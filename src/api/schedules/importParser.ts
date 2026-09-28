import type {
  ImportParseIssueDto,
  ImportParsedBlockDto,
  ImportParsedDayDto,
  ImportParseResultDto,
} from "../../types/schedule";
import { addDays, dayOfWeek, startOfWeek } from "../utils/date";

/**
 * Pembaca teks jadwal yang ditempel admin/korlas.
 *
 * Teksnya datang apa adanya dari sekolah — blok rentang tanggal, lalu baris
 * "Hari : menu":
 *
 *     1 - 2 Oktober 2026
 *     Kamis   : Puding Roti  + jeruk
 *     Jumat   : Libur
 *
 *     3 - 9 Oktober 2026
 *     Senin   : Pisang kukus + Melon
 *     …
 *
 * Berkas ini **murni**: tidak menyentuh database, tidak membaca jam, tidak
 * melempar galat. Semua hasilnya berupa data, termasuk masalah yang ditemukan
 * — supaya bisa diuji sendiri dan supaya pratinjau bisa menampilkan apa yang
 * akan terjadi sebelum satu baris pun ditulis.
 */

/** Nama hari → nomor hari, mengikuti `dayOfWeek()` (1=Senin … 7=Minggu). */
const DAY_INDEX: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
  minggu: 7,
};

const MONTH_INDEX: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

/** Nama hari yang dianggap bagian dari sepekan sekolah (Senin–Jumat). */
const SCHOOL_DAYS = ["senin", "selasa", "rabu", "kamis", "jumat"];

/** `YYYY-MM-DD` dari komponen tanggal; `null` bila tanggalnya tidak ada. */
function toIso(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  // Menolak 31 Februari dsb. — Date akan "meluber" ke bulan berikutnya.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/** Semua tanggal pada rentang `start`..`end` (inklusif). */
function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let cursor = start;
  // Batas pengaman: blok jadwal tidak pernah lebih dari satu semester.
  for (let guard = 0; guard < 400 && cursor <= end; guard++) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

/**
 * Pecah "Puding Roti  + jeruk" → utama "Puding Roti", buah "jeruk".
 *
 * Keterangan dalam tanda kurung, mis. "(outing)", dipisahkan jadi catatan —
 * sama seperti `parseMenuText()` di `scripts/seed.ts`, supaya teks yang sama
 * menghasilkan menu yang sama lewat jalur mana pun.
 */
export function splitMenuText(text: string): {
  main: string | null;
  fruit: string | null;
  notes: string | null;
} {
  let body = text.trim();
  let notes: string | null = null;

  const noteMatch = body.match(/\(([^)]+)\)/);
  if (noteMatch) {
    notes = noteMatch[1].trim();
    body = body.replace(noteMatch[0], "").trim();
  }

  const parts = body
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return { main: null, fruit: null, notes };

  return {
    main: parts[0],
    fruit: parts.length > 1 ? parts.slice(1).join(" + ") : null,
    notes,
  };
}

/**
 * Kunci pembanding menu — dipakai untuk mengenali menu yang **sudah ada**
 * agar tidak dibuat dua kali. Sengaja hanya menormalkan huruf besar/kecil dan
 * spasi: "Puding Roti + jeruk" dan "Puding Roti + Jeruk" harus dianggap sama,
 * tetapi "Pastel" dan "Pastel sayur" tetap berbeda.
 */
export function menuKey(main: string, fruit: string | null): string {
  const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
  return `${norm(main)}|${fruit ? norm(fruit) : ""}`;
}

export function isHolidayText(text: string): boolean {
  return /^libur\b/i.test(text.trim());
}

interface PendingBlock {
  line: number;
  rawStartDate: string;
  rawEndDate: string;
  days: { line: number; dayName: string; menuText: string }[];
}

/**
 * Cari tanggal untuk satu nama hari di dalam sebuah blok.
 *
 * Mengembalikan **daftar** calon: blok yang membentang lebih dari sepekan bisa
 * memuat dua hari bernama sama, dan itu lebih baik dilaporkan daripada ditebak.
 */
function candidatesFor(dayName: string, dates: string[]): string[] {
  const wanted = DAY_INDEX[dayName.toLowerCase()];
  return dates.filter((date) => dayOfWeek(date) === wanted);
}

/**
 * Apakah blok ini "sepekan sekolah penuh" — yaitu seluruh harinya Senin–Jumat
 * dan salah satunya Senin. Hanya blok seperti inilah yang boleh digeser.
 */
function isFullSchoolWeek(dayNames: string[]): boolean {
  const unique = [...new Set(dayNames.map((name) => name.toLowerCase()))];
  return (
    unique.length === SCHOOL_DAYS.length &&
    SCHOOL_DAYS.every((day) => unique.includes(day))
  );
}

export function parseScheduleText(text: string): ImportParseResultDto {
  const lines = text.split(/\r?\n/);
  const blocks: PendingBlock[] = [];
  const issues: ImportParseIssueDto[] = [];
  const warnings: string[] = [];

  let current: PendingBlock | null = null;

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index].trim();
    const lineNo = index + 1;
    if (!raw) continue;
    // Pemisah yang dipakai berkas sumber sekolah.
    if (/^-{2,}$/.test(raw)) continue;

    // Judul berkas: "JADWAL Piket (SNACK) Oktober 2026, Sebagai Berikut :".
    // Hanya penanda batas — tiap blok sudah menulis bulannya sendiri.
    if (/^JADWAL/i.test(raw)) continue;

    // Rentang: "1 - 2 Oktober 2026"
    const range = raw.match(
      /^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
    );
    if (range) {
      const month = MONTH_INDEX[range[3].toLowerCase()];
      const year = Number.parseInt(range[4], 10);
      if (!month) {
        issues.push({ line: lineNo, message: `Nama bulan tidak dikenal: "${range[3]}"` });
        current = null;
        continue;
      }
      const start = toIso(year, month, Number.parseInt(range[1], 10));
      const end = toIso(year, month, Number.parseInt(range[2], 10));
      if (!start || !end || start > end) {
        issues.push({
          line: lineNo,
          message: `Rentang tanggal tidak sah: "${raw}"`,
        });
        current = null;
        continue;
      }
      current = { line: lineNo, rawStartDate: start, rawEndDate: end, days: [] };
      blocks.push(current);
      continue;
    }

    // Satu hari: "31 Agustus 2026"
    const single = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (single) {
      const month = MONTH_INDEX[single[2].toLowerCase()];
      const year = Number.parseInt(single[3], 10);
      const date = month ? toIso(year, month, Number.parseInt(single[1], 10)) : null;
      if (!date) {
        issues.push({ line: lineNo, message: `Tanggal tidak sah: "${raw}"` });
        current = null;
        continue;
      }
      current = { line: lineNo, rawStartDate: date, rawEndDate: date, days: [] };
      blocks.push(current);
      continue;
    }

    // Baris hari: "Kamis   : Puding Roti  + jeruk"
    const day = raw.match(/^([A-Za-z]+)\s*:\s*(.+)$/);
    if (day) {
      const dayName = day[1].toLowerCase();
      if (DAY_INDEX[dayName] === undefined) {
        // Bukan baris hari (mis. baris pengantar) — abaikan tanpa gaduh.
        continue;
      }
      if (!current) {
        issues.push({
          line: lineNo,
          message: `Baris "${raw}" tidak punya blok tanggal di atasnya`,
        });
        continue;
      }
      current.days.push({ line: lineNo, dayName, menuText: day[2].trim() });
      continue;
    }

    // Sisa baris tak dikenal (mis. kalimat pengantar) — abaikan.
  }

  // ── Ubah blok yang tertunda menjadi tanggal nyata ──────────
  const resolved: ImportParsedBlockDto[] = [];
  /** Tanggal yang sudah dipakai blok sebelumnya, untuk mendeteksi tumpang tindih. */
  const seen = new Map<string, number>();

  for (const block of blocks) {
    if (block.days.length === 0) {
      issues.push({
        line: block.line,
        message: "Blok tanggal tidak diikuti satu baris hari pun",
      });
      continue;
    }

    let dates = datesBetween(block.rawStartDate, block.rawEndDate);
    let shifted = false;
    let assign = assignDays(block, dates);

    // Nama hari tidak ketemu di rentangnya. Kalau bloknya sepekan sekolah
    // penuh, kemungkinan besar rentangnya yang salah tulis — bukan menunya.
    // Digeser ke Senin–Jumat pada minggu yang memuat tanggal awalnya.
    // Kasus nyata: "14 - 18 Oktober 2026" dilabeli Senin–Jumat padahal
    // 14 Oktober 2026 jatuh hari Rabu; yang benar 12 - 16 Oktober.
    if (assign.unmatched.length > 0 && isFullSchoolWeek(block.days.map((d) => d.dayName))) {
      const monday = startOfWeek(block.rawStartDate);
      const friday = addDays(monday, 4);
      const retryDates = datesBetween(monday, friday);
      const retry = assignDays(block, retryDates);
      if (retry.unmatched.length === 0) {
        dates = retryDates;
        shifted = true;
        assign = retry;
        warnings.push(
          `Rentang "${block.rawStartDate} – ${block.rawEndDate}" digeser ke ` +
            `"${monday} – ${friday}" karena nama harinya tidak cocok dengan kalender.`,
        );
      }
    }

    for (const missed of assign.unmatched) {
      issues.push({
        line: missed.line,
        message:
          `Hari "${missed.dayName}" tidak ada pada rentang ` +
          `${block.rawStartDate} – ${block.rawEndDate}. ` +
          "Periksa rentangnya, atau tulis tanggalnya secara eksplisit.",
      });
    }
    for (const ambiguous of assign.ambiguous) {
      issues.push({
        line: ambiguous.line,
        message:
          `Hari "${ambiguous.dayName}" muncul lebih dari sekali pada rentang ` +
          `${block.rawStartDate} – ${block.rawEndDate}. Persempit rentangnya.`,
      });
    }

    const days: ImportParsedDayDto[] = assign.resolved.map(({ date, entry }) => {
      const holiday = isHolidayText(entry.menuText);
      const split = holiday
        ? { main: null, fruit: null, notes: null }
        : splitMenuText(entry.menuText);
      return {
        date,
        dayName: entry.dayName,
        menuText: entry.menuText,
        isHoliday: holiday,
        menuMain: split.main,
        menuFruit: split.fruit,
        notes: holiday ? "Libur" : split.notes,
      };
    });

    // Jadwal sekolah hanya Senin–Jumat; tanggal akhir pekan patut dicurigai.
    for (const day of days) {
      if (dayOfWeek(day.date) > 5) {
        warnings.push(
          `${day.date} (${day.dayName}) jatuh pada akhir pekan — periksa kembali rentangnya.`,
        );
      }
      // Tanggal yang sama tidak boleh muncul dua kali dalam satu tempelan,
      // mis. bila dua blok rentangnya tumpang tindih.
      const previous = seen.get(day.date);
      if (previous !== undefined) {
        issues.push({
          line: block.line,
          message:
            `Tanggal ${day.date} sudah dipakai blok pada baris ${previous} — ` +
            "kemungkinan bloknya tumpang tindih.",
        });
      } else {
        seen.set(day.date, block.line);
      }
    }

    resolved.push({
      rawStartDate: block.rawStartDate,
      rawEndDate: block.rawEndDate,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      shifted,
      days,
    });
  }

  const dayCount = resolved.reduce((total, block) => total + block.days.length, 0);

  return { blocks: resolved, issues, warnings, dayCount };
}

/** Cocokkan setiap baris hari pada satu blok dengan tanggal di `dates`. */
function assignDays(block: PendingBlock, dates: string[]) {
  const resolved: {
    date: string;
    entry: { line: number; dayName: string; menuText: string };
  }[] = [];
  const unmatched: { line: number; dayName: string }[] = [];
  const ambiguous: { line: number; dayName: string }[] = [];
  const taken = new Set<string>();

  for (const entry of block.days) {
    const options = candidatesFor(entry.dayName, dates).filter(
      (date) => !taken.has(date),
    );
    if (options.length === 1) {
      taken.add(options[0]);
      resolved.push({ date: options[0], entry });
    } else if (options.length === 0) {
      unmatched.push({ line: entry.line, dayName: entry.dayName });
    } else {
      ambiguous.push({ line: entry.line, dayName: entry.dayName });
    }
  }

  resolved.sort((a, b) => a.date.localeCompare(b.date));
  return { resolved, unmatched, ambiguous };
}
