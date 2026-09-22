/**
 * Penyusun berkas Excel untuk jadwal Sepekan & Bulanan.
 *
 * Isi lembar sengaja **mengikuti apa yang tampil di layar** — kolom yang sama,
 * urutan hari yang sama, dan penyebutan libur yang sama dengan halaman
 * Sepekan/Bulanan. Berkas yang dicetak jadi tidak pernah berbeda dari yang
 * dilihat admin/korlas, termasuk hari dari bulan sebelah yang ikut tampil
 * pada blok pekan pertama/terakhir (label pekannya menjelaskan rentang itu).
 *
 * Modul ini murni: DTO masuk, byte `.xlsx` keluar. Tidak menyentuh database
 * maupun `Context` Hono, sehingga bisa diuji tanpa menyalakan server.
 */

import type {
  MonthScheduleDto,
  ScheduleDayDto,
  WeekScheduleDto,
} from "../../types/schedule";
import { indonesianMonthName, parseIsoDate } from "../utils/date";
import { buildXlsx, type XlsxCell, type XlsxRow } from "../utils/xlsx";

/** Kolom tabel, urut kiri ke kanan — sama dengan urutan di layar. */
const HEADERS = [
  "Hari",
  "Tanggal",
  "Menu",
  "Komponen menu",
  "Petugas",
  "Orang tua petugas",
  "Catatan",
] as const;

/** Lebar kolom (satuan Excel) — disetel agar isi terpanjang tidak terpotong. */
const COLUMN_WIDTHS = [10, 20, 30, 40, 22, 22, 34];

/** Gaya "tebal" di `styles.xml`; dipakai judul, label pekan, dan kepala tabel. */
const BOLD = 1 as const;

function cell(value: string | number | null, style?: 0 | 1): XlsxCell {
  return style === undefined ? { value } : { value, style };
}

/** `2026-09-01` → `1 September 2026`. Nama hari tidak diulang — sudah ada kolomnya. */
function longDate(value: string): string {
  const date = parseIsoDate(value);
  return `${date.getUTCDate()} ${indonesianMonthName(date.getUTCMonth() + 1)} ${date.getUTCFullYear()}`;
}

/** Satu baris data untuk satu hari. */
function dayRow(day: ScheduleDayDto): XlsxRow {
  // Libur tidak punya menu, jadi keterangannya ditaruh di kolom menu —
  // persis seperti kartu di layar yang menggantikan menu dengan nama libur.
  const menu = day.isHoliday
    ? day.holidayName
      ? `Libur — ${day.holidayName}`
      : "Libur"
    : (day.menu?.name ?? "");

  return {
    cells: [
      cell(day.dayName),
      cell(longDate(day.date)),
      cell(menu),
      cell(day.menu?.items.map((item) => item.name).join(", ") ?? ""),
      cell(day.petugasName ?? ""),
      cell(day.petugasParentName ?? ""),
      cell(day.notes ?? ""),
    ],
  };
}

/** Baris yang seluruh kolomnya digabung — dipakai judul, label pekan, ringkasan. */
function mergedRow(text: string): XlsxRow {
  return { cells: [cell(text, BOLD)], span: HEADERS.length };
}

function headerRow(): XlsxRow {
  return { cells: HEADERS.map((label) => cell(label, BOLD)) };
}

/** Baris kosong sebagai pemisah antar blok. */
const SPACER: XlsxRow = { cells: [] };

function summaryRow(days: ScheduleDayDto[]): XlsxRow {
  const withMenu = days.filter((day) => day.menu !== null).length;
  const holidays = days.filter((day) => day.isHoliday).length;
  return mergedRow(
    `Ringkasan: ${days.length} hari · ${withMenu} ada menu · ${holidays} libur`,
  );
}

/** ` — Kelas 1A`, atau kosong bila user belum punya kelas. */
function classSuffix(className: string | null): string {
  return className ? ` — Kelas ${className}` : "";
}

/** Susun lembar jadwal Sepekan. */
export function buildWeekSheet(data: WeekScheduleDto): Uint8Array<ArrayBuffer> {
  const rows: XlsxRow[] = [
    mergedRow(`Jadwal Snack Sepekan${classSuffix(data.className)}`),
    mergedRow(data.label),
    SPACER,
    headerRow(),
    ...data.days.map(dayRow),
    SPACER,
    summaryRow(data.days),
  ];

  return buildXlsx({
    sheetName: "Jadwal Sepekan",
    rows,
    columnWidths: COLUMN_WIDTHS,
  });
}

/** Susun lembar jadwal Bulanan — satu blok per pekan, seperti di layar. */
export function buildMonthSheet(data: MonthScheduleDto): Uint8Array<ArrayBuffer> {
  const rows: XlsxRow[] = [
    mergedRow(
      `Jadwal Snack ${data.monthName} ${data.year}${classSuffix(data.className)}`,
    ),
    SPACER,
  ];

  const allDays: ScheduleDayDto[] = [];

  for (const week of data.weeks) {
    // Kepala tabel diulang tiap pekan supaya tiap blok tetap terbaca
    // kalau lembar ini dicetak atau digulir jauh ke bawah.
    rows.push(mergedRow(week.label), headerRow());

    for (const day of week.days) {
      rows.push(dayRow(day));
      allDays.push(day);
    }

    rows.push(SPACER);
  }

  rows.push(summaryRow(allDays));

  return buildXlsx({
    sheetName: `${data.monthName} ${data.year}`,
    rows,
    columnWidths: COLUMN_WIDTHS,
  });
}

/** `1A` → `1a`; spasi dan tanda baca jadi satu tanda hubung. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Nama berkas unduhan.
 *
 * Sengaja ASCII dan tanpa spasi: sebagian browser mengabaikan `filename*`
 * dan memotong nama berkas di spasi pertama.
 */
function fileName(parts: Array<string | null>): string {
  return `${parts.filter(Boolean).join("-")}.xlsx`;
}

/** `jadwal-sepekan-kelas-1a-2026-09-01.xlsx` */
export function weekFilename(data: WeekScheduleDto): string {
  return fileName([
    "jadwal-sepekan",
    data.className ? `kelas-${slug(data.className)}` : null,
    data.startDate,
  ]);
}

/** `jadwal-bulanan-2026-09-kelas-1a.xlsx` */
export function monthFilename(data: MonthScheduleDto): string {
  return fileName([
    "jadwal-bulanan",
    `${data.year}-${String(data.month).padStart(2, "0")}`,
    data.className ? `kelas-${slug(data.className)}` : null,
  ]);
}
