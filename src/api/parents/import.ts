/**
 * Pembaca lembar impor akun orang tua.
 *
 * Lembar masukannya adalah **berkas yang keluar dari `export.ts`** — judul,
 * baris label, kepala kolom, baris data, lalu baris ringkasan — sehingga
 * alurnya bundar: unduh, sunting di Excel, unggah kembali. Karena itu baris
 * judul dan ringkasan harus dilewati, dan kepala kolom dicari, bukan
 * diasumsikan ada di baris pertama.
 *
 * Kolom dicocokkan **berdasarkan teks kepalanya**, bukan posisinya. Admin yang
 * menggeser atau menambah kolom tidak merusak impor, dan berkas yang dibuat
 * dari nol pun jalan selama kepalanya diberi nama yang sama.
 *
 * Berkas ini **murni**: kisi teks masuk, data keluar. Tidak menyentuh
 * database maupun jam, dan tidak melempar galat — semua masalah yang
 * ditemukan dikembalikan sebagai data, supaya bisa ditampilkan sebagai
 * pratinjau sebelum satu baris pun ditulis.
 */

import type { ManagedRole } from "../../types/account";
import { isBlankRow } from "../utils/xlsxRead";
import { ACCOUNT_COLUMNS, ROLE_LABELS, YES_NO } from "./export";

export interface ParsedChild {
  name: string;
  className: string | null;
}

/** Satu baris data yang sudah tervalidasi bentuknya. */
export interface ParsedAccountRow {
  /** Nomor baris di lembar (1-based) — dipakai menunjuk baris bermasalah. */
  row: number;
  parentName: string;
  username: string;
  /** `null` = kolom password kosong; akun lama tidak diganti passwordnya. */
  password: string | null;
  role: ManagedRole;
  className: string | null;
  /**
   * `null` = kolom Anak kosong, artinya daftar anaknya jangan diubah.
   *
   * Kolom ini memang boleh kosong: akun yang sudah ada bisa saja belum punya
   * anak, dan berkas hasil ekspor menuliskannya sebagai sel kosong. Menolak
   * baris seperti itu akan membuat berkas ekspor sendiri gagal diimpor.
   */
  students: ParsedChild[] | null;
  /** `null` = kolom kosong, artinya status aktifnya jangan diubah. */
  isActive: boolean | null;
}

export interface SheetIssue {
  /** Nomor baris di lembar (1-based). */
  row: number;
  message: string;
}

export type AccountsSheetParse =
  | { ok: false; error: string }
  | { ok: true; rows: ParsedAccountRow[]; issues: SheetIssue[] };

/** Bidang yang bisa dikenali dari kepala kolom. */
type Field =
  | "parentName"
  | "username"
  | "password"
  | "role"
  | "className"
  | "students"
  | "active";

/**
 * Alias kepala kolom. Nama utama diambil dari `ACCOUNT_COLUMNS` supaya ekspor
 * dan impor tidak bisa berbeda diam-diam; sisanya menoleransi lembar yang
 * disusun sendiri oleh admin.
 */
const HEADER_ALIASES: Record<Field, string[]> = {
  parentName: [ACCOUNT_COLUMNS.parentName, "nama ortu", "nama orangtua", "nama"],
  username: [ACCOUNT_COLUMNS.username, "nama pengguna", "user"],
  password: [ACCOUNT_COLUMNS.password, "kata sandi", "sandi"],
  role: [ACCOUNT_COLUMNS.role, "role"],
  className: [ACCOUNT_COLUMNS.className, "kelas koordinasi", "kelas"],
  students: [ACCOUNT_COLUMNS.students, "anak-anak", "nama anak"],
  active: [ACCOUNT_COLUMNS.active, "status aktif", "status"],
};

/** Kolom yang wajib ada di kepala lembar. */
const REQUIRED: Field[] = ["parentName", "username", "password"];

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;

/** Normalkan teks kepala kolom: huruf kecil, spasi dirapikan, titik dua dibuang. */
function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[:*]+$/, "")
    .replace(/\s+/g, " ");
}

/** Kunci pembanding nama orang tua & anak. */
export function nameKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function fieldFor(header: string): Field | null {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
    Field,
    string[],
  ][]) {
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
      return field;
    }
  }
  return null;
}

/**
 * Padanan `Ya`/`Tidak`. Ditulis huruf kecil karena dibandingkan dengan isi sel
 * yang sudah dinormalkan — `YES_NO` sendiri tetap dipakai sebagai sumber
 * tulisannya, supaya ekspor dan impor tidak bisa berbeda.
 */
const ACTIVE_TRUE = [YES_NO.yes.toLowerCase(), "y", "true", "1", "aktif"];
const ACTIVE_FALSE = [
  YES_NO.no.toLowerCase(),
  "t",
  "false",
  "0",
  "nonaktif",
  "tidak aktif",
];

/**
 * Baca nilai `Ya`/`Tidak` (atau padanannya).
 *
 * Mengembalikan `null` untuk sel kosong — "jangan diubah" — dan `undefined`
 * bila isinya tidak dikenali, supaya barisnya bisa dilaporkan alih-alih
 * ditebak.
 */
function parseActive(value: string): boolean | null | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (ACTIVE_TRUE.includes(normalized)) return true;
  if (ACTIVE_FALSE.includes(normalized)) return false;
  return undefined;
}

function parseRole(value: string): ManagedRole | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "parent";
  if (normalized === "korlas" || normalized === ROLE_LABELS.korlas.toLowerCase()) {
    return "korlas";
  }
  if (
    normalized === "parent" ||
    normalized === "orang tua" ||
    normalized === "orangtua"
  ) {
    return "parent";
  }
  return null;
}

/**
 * Pecah sel `Anak` menjadi daftar anak.
 *
 * Pemisahnya koma, tetapi **koma di dalam tanda kurung tidak memisahkan** —
 * nama kelas seperti `"1A, 1B"` tidak lazim, namun tanda kurung juga dipakai
 * menuliskan catatan pada nama, dan memecah di situ akan menghasilkan nama
 * yang salah.
 */
function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of value) {
    if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);

  return parts.map((part) => part.trim()).filter(Boolean);
}

/** `"Budi (1A)"` → nama `Budi`, kelas `1A`; `"Ani"` → kelas `null`. */
export function parseChild(value: string): ParsedChild {
  const match = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(value.trim());
  if (!match) return { name: value.trim(), className: null };

  const name = match[1].trim();
  const className = match[2].trim();
  // Kurung tanpa isi bukan penanda kelas — kembalikan apa adanya.
  if (!name) return { name: value.trim(), className: null };

  return { name, className: className || null };
}

function parseChildren(value: string): ParsedChild[] {
  return splitTopLevel(value)
    .map(parseChild)
    .filter((child) => child.name.length > 0);
}

/** Baris ringkasan penutup dari ekspor — batas akhir data. */
function isSummaryRow(row: string[] | undefined): boolean {
  if (!row) return false;
  return row.some((cell) => /^ringkasan\b/i.test(cell?.trim() ?? ""));
}

/**
 * Cari baris kepala kolom: baris pertama yang memuat kolom **Nama orang tua**
 * beserta minimal satu kolom lain yang dikenal.
 *
 * Syarat "minimal satu kolom lain" itu penting: judul berkas
 * ("Daftar Akun Orang Tua") tidak boleh disangka kepala kolom hanya karena
 * kebetulan memuat kata yang sama.
 */
function findHeaderRow(grid: string[][]): {
  index: number;
  columns: Map<Field, number>;
} | null {
  for (let index = 0; index < grid.length; index++) {
    const row = grid[index];
    if (!row) continue;

    const columns = new Map<Field, number>();
    row.forEach((header, column) => {
      const field = fieldFor(header ?? "");
      // Kolom pertama yang menang; duplikat diabaikan, bukan menimpa.
      if (field && !columns.has(field)) columns.set(field, column);
    });

    if (columns.has("parentName") && columns.size >= 2) {
      return { index, columns };
    }
  }

  return null;
}

/**
 * Baca kisi lembar menjadi baris-baris akun yang siap diproses.
 *
 * Baris yang bermasalah **tidak** dikembalikan di `rows` — hanya dilaporkan di
 * `issues` — sehingga pemanggil tidak perlu menyaring ulang.
 */
export function parseAccountsSheet(grid: string[][]): AccountsSheetParse {
  const header = findHeaderRow(grid);
  if (!header) {
    return {
      ok: false,
      error:
        "Kepala kolom tidak ditemukan. Pastikan lembar memuat kolom " +
        `"${ACCOUNT_COLUMNS.parentName}" beserta kolom lainnya.`,
    };
  }

  const missing = REQUIRED.filter((field) => !header.columns.has(field));
  if (missing.length > 0) {
    const names = missing.map(
      (field) => `"${ACCOUNT_COLUMNS[field as keyof typeof ACCOUNT_COLUMNS]}"`,
    );
    return {
      ok: false,
      error: `Kolom wajib belum ada: ${names.join(", ")}. Impor memerlukan kolom tersebut untuk mencocokkan akun lama dan membuat akun baru.`,
    };
  }

  const rows: ParsedAccountRow[] = [];
  const issues: SheetIssue[] = [];

  const read = (line: string[] | undefined, field: Field): string => {
    const column = header.columns.get(field);
    if (column === undefined) return "";
    return (line?.[column] ?? "").trim();
  };

  for (let index = header.index + 1; index < grid.length; index++) {
    const line = grid[index];
    if (isBlankRow(line)) continue;
    if (isSummaryRow(line)) break;

    // Nomor baris seperti yang terlihat di Excel (1-based).
    const rowNumber = index + 1;

    const parentName = read(line, "parentName");
    const username = read(line, "username").toLowerCase();
    const password = read(line, "password");
    const roleText = read(line, "role");
    const className = read(line, "className");
    const activeText = read(line, "active");

    if (!parentName) {
      issues.push({ row: rowNumber, message: "Nama orang tua kosong" });
      continue;
    }

    if (!username) {
      issues.push({ row: rowNumber, message: "Username kosong" });
      continue;
    }

    if (!USERNAME_PATTERN.test(username)) {
      issues.push({
        row: rowNumber,
        message: `Username "${username}" tidak sah — 3–32 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip`,
      });
      continue;
    }

    if (password && password.length < MIN_PASSWORD_LENGTH) {
      issues.push({
        row: rowNumber,
        message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter`,
      });
      continue;
    }

    const role = parseRole(roleText);
    if (role === null) {
      issues.push({
        row: rowNumber,
        message: `Peran "${roleText}" tidak dikenal — isi "${ROLE_LABELS.parent}" atau "${ROLE_LABELS.korlas}"`,
      });
      continue;
    }

    if (role === "korlas" && !className) {
      issues.push({
        row: rowNumber,
        message: "Korlas wajib memiliki kelas yang dikoordinasi",
      });
      continue;
    }

    // Kolom Anak yang **kosong** berarti "jangan ubah", bukan "tidak punya
    // anak" — akun lama memang boleh belum punya anak, dan ekspor menulisnya
    // sebagai sel kosong. Yang tidak kosong tetapi tidak memuat nama apa pun
    // baru dianggap salah tulis.
    const studentsText = read(line, "students");
    let students: ParsedChild[] | null = null;
    if (studentsText) {
      const parsed = parseChildren(studentsText);
      if (parsed.length === 0) {
        issues.push({
          row: rowNumber,
          message: `Kolom "${ACCOUNT_COLUMNS.students}" tidak memuat nama anak yang terbaca`,
        });
        continue;
      }
      students = parsed;
    }

    const isActive = parseActive(activeText);
    if (isActive === undefined) {
      issues.push({
        row: rowNumber,
        message: `Kolom "${ACCOUNT_COLUMNS.active}" harus "${YES_NO.yes}" atau "${YES_NO.no}"`,
      });
      continue;
    }

    rows.push({
      row: rowNumber,
      parentName,
      username,
      password: password || null,
      role,
      className: role === "korlas" ? className : null,
      students,
      isActive,
    });
  }

  return { ok: true, rows, issues };
}
