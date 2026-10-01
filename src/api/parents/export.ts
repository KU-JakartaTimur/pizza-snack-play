/**
 * Penyusun berkas Excel untuk daftar akun orang tua.
 *
 * Isi lembar sengaja **mengikuti apa yang tampil di layar** — kolomnya sama
 * dengan tabel di halaman Akun Orang Tua, ditambah kolom yang berguna begitu
 * berkasnya keluar dari aplikasi (terkunci & kapan terakhir masuk). Berkas
 * yang dicetak jadi tidak pernah berbeda dari yang dilihat admin.
 *
 * Dua kolom tambahan membuat berkas ini bisa **kembali masuk** lewat
 * `POST /parents/import`:
 *  - **Username** — kunci pencocokan saat impor. Tanpa ini, dua orang tua
 *    bernama sama tidak bisa dibedakan dan baris yang salah akan tertimpa.
 *  - **Password** — selalu **kosong**; hash password tidak pernah keluar dari
 *    server. Kolomnya disediakan sebagai tempat mengisi password akun baru,
 *    karena impor mewajibkannya. Dikosongkan = password akun lama tidak
 *    diubah.
 *
 * Modul ini murni: daftar DTO masuk, byte `.xlsx` keluar. Tidak menyentuh
 * database maupun `Context` Hono, sehingga bisa diuji tanpa menyalakan server.
 */

import type { ManagedRole, ParentDto } from "../../types/account";
import { downloadFileName } from "../utils/response";
import { slugify } from "../utils/slug";
import { buildXlsx, type XlsxCell, type XlsxRow } from "../utils/xlsx";

/**
 * Nama kolom lembar akun — **satu sumber untuk ekspor dan impor**.
 *
 * Impor (`import.ts`) mencari kolom berdasarkan teks kepala ini, bukan
 * berdasarkan posisinya. Karena itu mengubah nama di sini otomatis mengubah
 * keduanya, dan berkas yang kolomnya diacak admin tetap terbaca benar.
 */
export const ACCOUNT_COLUMNS = {
  parentName: "Nama orang tua",
  username: "Username",
  password: "Password",
  role: "Peran",
  className: "Kelas dikoordinasi",
  students: "Anak",
  active: "Aktif",
  locked: "Terkunci",
  lastLogin: "Login terakhir",
} as const;

/** Tulisan peran di lembar; dipakai juga saat membacanya kembali. */
export const ROLE_LABELS: Record<ManagedRole, string> = {
  parent: "Orang tua",
  korlas: "Korlas",
};

/** Tulisan kolom `Aktif`/`Terkunci` — dibaca kembali apa adanya oleh impor. */
export const YES_NO = { yes: "Ya", no: "Tidak" } as const;

/** Kolom tabel, urut kiri ke kanan. */
const HEADERS = [
  ACCOUNT_COLUMNS.parentName,
  ACCOUNT_COLUMNS.username,
  ACCOUNT_COLUMNS.password,
  ACCOUNT_COLUMNS.role,
  ACCOUNT_COLUMNS.className,
  ACCOUNT_COLUMNS.students,
  ACCOUNT_COLUMNS.active,
  ACCOUNT_COLUMNS.locked,
  ACCOUNT_COLUMNS.lastLogin,
] as const;

/** Lebar kolom (satuan Excel) — disetel agar isi terpanjang tidak terpotong. */
const COLUMN_WIDTHS = [24, 18, 16, 16, 18, 40, 10, 12, 22];

/** Gaya "tebal" di `styles.xml`; dipakai judul, ringkasan, dan kepala tabel. */
const BOLD = 1 as const;

function cell(value: string | number | null, style?: 0 | 1): XlsxCell {
  return style === undefined ? { value } : { value, style };
}

/**
 * `2026-09-30 04:12:00` (UTC) → `30 September 2026 11:12`.
 *
 * Nilai dari `datetime('now')` selalu UTC, dan seluruh aplikasi memakai WIB —
 * jadi jamnya digeser +7 supaya berkas tidak tampak "telat tujuh jam" bagi
 * yang membacanya di Jakarta.
 */
function longDateTime(value: string): string {
  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;

  const wib = new Date(parsed.getTime() + 7 * 3_600_000);
  const day = wib.getUTCDate();
  const month = DAY_NAMES_MONTH[wib.getUTCMonth()];
  const hour = String(wib.getUTCHours()).padStart(2, "0");
  const minute = String(wib.getUTCMinutes()).padStart(2, "0");

  return `${day} ${month} ${wib.getUTCFullYear()} ${hour}:${minute}`;
}

const DAY_NAMES_MONTH = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** `Ya` / `Tidak` — lebih terbaca di Excel daripada 1/0. */
function yesNo(value: boolean): string {
  return value ? YES_NO.yes : YES_NO.no;
}

function roleLabel(parent: ParentDto): string {
  return ROLE_LABELS[parent.role];
}

/** Satu baris data untuk satu akun. */
function accountRow(parent: ParentDto): XlsxRow {
  const students = parent.students
    .map((student) =>
      student.className ? `${student.name} (${student.className})` : student.name,
    )
    .join(", ");

  return {
    cells: [
      cell(parent.parentName),
      cell(parent.username),
      // Sel kosong sengaja tidak ditulis sama sekali — lihat `buildXlsx`.
      // Hash password tidak pernah keluar dari server.
      cell(""),
      cell(roleLabel(parent)),
      // Kelas hanya bermakna untuk korlas; orang tua biasa dibiarkan kosong.
      cell(parent.role === "korlas" ? (parent.className ?? "") : ""),
      cell(students),
      cell(yesNo(parent.isActive)),
      cell(parent.lockedAt ? YES_NO.yes : YES_NO.no),
      cell(parent.lastLoginAt ? longDateTime(parent.lastLoginAt) : "Belum pernah"),
    ],
  };
}

/** Baris yang seluruh kolomnya digabung — dipakai judul dan ringkasan. */
function mergedRow(text: string): XlsxRow {
  return { cells: [cell(text, BOLD)], span: HEADERS.length };
}

function headerRow(): XlsxRow {
  return { cells: HEADERS.map((label) => cell(label, BOLD)) };
}

/** Baris kosong sebagai pemisah antar blok. */
const SPACER: XlsxRow = { cells: [] };

function summaryRow(items: ParentDto[]): XlsxRow {
  const active = items.filter((parent) => parent.isActive).length;
  const locked = items.filter((parent) => parent.lockedAt !== null).length;
  const korlas = items.filter((parent) => parent.role === "korlas").length;

  return mergedRow(
    `Ringkasan: ${items.length} akun · ${active} aktif · ${locked} terkunci · ${korlas} korlas`,
  );
}

/**
 * Susun lembar daftar akun orang tua.
 *
 * `label` menjelaskan cakupan berkasnya (mis. `Semua akun` atau
 * `Hanya akun aktif`) supaya orang yang membuka berkasnya tahu ia sedang
 * melihat bagian mana — berkas yang tersimpan lama mudah terlupa asalnya.
 */
export function buildAccountsSheet(
  items: ParentDto[],
  label: string,
): Uint8Array<ArrayBuffer> {
  const rows: XlsxRow[] = [
    mergedRow("Daftar Akun Orang Tua"),
    mergedRow(label),
    SPACER,
    headerRow(),
    ...items.map(accountRow),
    SPACER,
    summaryRow(items),
  ];

  return buildXlsx({
    sheetName: "Akun Orang Tua",
    rows,
    columnWidths: COLUMN_WIDTHS,
  });
}

/** `akun-orang-tua-2026-09-30.xlsx` */
export function accountsFilename(today: string): string {
  return downloadFileName(["akun-orang-tua", today]);
}

/**
 * Slug kelas untuk potongan nama berkas, bila suatu saat ekspor dipecah
 * per kelas. Disediakan karena `slugify` sudah jadi sumber tunggalnya.
 */
export function classSlug(className: string): string {
  return slugify(className);
}
