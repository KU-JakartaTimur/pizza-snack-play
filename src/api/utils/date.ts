/**
 * Utilitas tanggal untuk Pizza Snack Play.
 *
 * PENTING — timezone:
 * Worker Cloudflare berjalan pada UTC. Sekolah berada di WIB (UTC+7).
 * Semua perhitungan "hari ini" harus memakai offset WIB, bukan waktu server,
 * agar jadwal tidak bergeser satu hari antara pukul 00:00–07:00 WIB.
 *
 * Konvensi tanggal internal: string ISO `YYYY-MM-DD` (date-only, tanpa waktu).
 * `day_of_week`: 1 = Senin … 7 = Minggu (ISO-8601).
 */

/** Offset WIB terhadap UTC, dalam jam. */
export const WIB_OFFSET_HOURS = 7;

const MS_PER_DAY = 86_400_000;

const DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const MONTH_NAMES_ID = [
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

/** `YYYY-MM-DD` → Date pada tengah malam UTC (aman dari pergeseran timezone). */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

/** Date → `YYYY-MM-DD`. */
export function isoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Validasi longgar untuk string `YYYY-MM-DD`. */
export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Tanggal hari ini menurut WIB, dalam format `YYYY-MM-DD`. */
export function todayInWib(clock: Date = new Date()): string {
  const shifted = new Date(clock.getTime() + WIB_OFFSET_HOURS * 3_600_000);
  return isoDate(shifted);
}

/** Tambah/kurangi hari. */
export function addDays(value: string, days: number): string {
  return isoDate(new Date(parseIsoDate(value).getTime() + days * MS_PER_DAY));
}

/** Hari dalam minggu, 1 = Senin … 7 = Minggu. */
export function dayOfWeek(value: string): number {
  const day = parseIsoDate(value).getUTCDay(); // 0 = Minggu
  return day === 0 ? 7 : day;
}

/** Tanggal Senin pada minggu yang memuat `value`. */
export function startOfWeek(value: string): string {
  return addDays(value, -(dayOfWeek(value) - 1));
}

/** Tanggal Jumat pada minggu yang memuat `value`. */
export function endOfWeek(value: string): string {
  return addDays(startOfWeek(value), 4);
}

/** Senin–Jumat pada minggu yang memuat `value`. */
export function weekRange(value: string): string[] {
  const monday = startOfWeek(value);
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));
}

/** Hari pertama dan terakhir pada bulan (year, month 1–12). */
export function monthRange(
  year: number,
  month: number,
): { start: string; end: string; days: number } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
  return { start, end, days };
}

/** Nomor bulan (1–12) dari string ISO. */
export function monthOf(value: string): number {
  return parseIsoDate(value).getUTCMonth() + 1;
}

/** Nomor tahun dari string ISO. */
export function yearOf(value: string): number {
  return parseIsoDate(value).getUTCFullYear();
}

/** Label Indonesia, contoh: `Selasa, 1 September 2026`. */
export function formatIndonesianDate(value: string): string {
  const date = parseIsoDate(value);
  const dayName = DAY_NAMES_ID[date.getUTCDay()];
  const monthName = MONTH_NAMES_ID[date.getUTCMonth()];
  return `${dayName}, ${date.getUTCDate()} ${monthName} ${date.getUTCFullYear()}`;
}

/** Nama hari Indonesia, contoh: `Selasa`. */
export function indonesianDayName(value: string): string {
  return DAY_NAMES_ID[parseIsoDate(value).getUTCDay()];
}

/** Nama bulan Indonesia, contoh: `September`. */
export function indonesianMonthName(month: number): string {
  return MONTH_NAMES_ID[month - 1] ?? "";
}

/**
 * Label rentang minggu seperti pada dokumen sumber,
 * contoh: `1 - 4 September 2026` (atau `29 - 2 Oktober 2026` lintas bulan).
 */
export function formatWeekLabel(start: string, end: string): string {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  const startMonth = MONTH_NAMES_ID[s.getUTCMonth()];
  const endMonth = MONTH_NAMES_ID[e.getUTCMonth()];

  if (startMonth === endMonth) {
    return `${s.getUTCDate()} - ${e.getUTCDate()} ${endMonth} ${e.getUTCFullYear()}`;
  }
  return `${s.getUTCDate()} ${startMonth} - ${e.getUTCDate()} ${endMonth} ${e.getUTCFullYear()}`;
}

/**
 * Jarak hari dari hari ini (WIB) ke `value`.
 * Negatif = sudah lewat, 0 = hari ini, positif = akan datang.
 */
export function daysFromToday(value: string, clock: Date = new Date()): number {
  const diff = parseIsoDate(value).getTime() - parseIsoDate(todayInWib(clock)).getTime();
  return Math.round(diff / MS_PER_DAY);
}

/** Timestamp UTC `YYYY-MM-DD HH:MM:SS` — format yang dipakai `datetime('now')`. */
export function utcTimestamp(clock: Date = new Date()): string {
  return clock.toISOString().replace("T", " ").slice(0, 19);
}
