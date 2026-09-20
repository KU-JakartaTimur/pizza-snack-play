/**
 * Utilitas tanggal untuk sisi klien.
 *
 * Dipisahkan dari `src/api/utils/date.ts` karena `tsconfig.app.json`
 * mengecualikan folder `src/api` dari kompilasi frontend.
 * Logikanya sengaja dijaga identik — semua tanggal memakai WIB (UTC+7).
 */

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

const DAY_NAMES_SHORT_ID = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
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

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

export function isoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Tanggal hari ini menurut WIB (UTC+7). */
export function todayInWib(clock: Date = new Date()): string {
  return isoDate(new Date(clock.getTime() + 7 * 3_600_000));
}

export function addDays(value: string, days: number): string {
  return isoDate(new Date(parseIsoDate(value).getTime() + days * MS_PER_DAY));
}

/** 1 = Senin … 7 = Minggu. */
export function dayOfWeek(value: string): number {
  const day = parseIsoDate(value).getUTCDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(value: string): string {
  return addDays(value, -(dayOfWeek(value) - 1));
}

export function endOfWeek(value: string): string {
  return addDays(startOfWeek(value), 4);
}

/** Senin–Jumat pada minggu yang memuat `value`. */
export function weekDates(value: string): string[] {
  const monday = startOfWeek(value);
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));
}

export function indonesianDayName(value: string): string {
  return DAY_NAMES_ID[parseIsoDate(value).getUTCDay()];
}

export function indonesianDayShort(value: string): string {
  return DAY_NAMES_SHORT_ID[parseIsoDate(value).getUTCDay()];
}

export function indonesianMonthName(month: number): string {
  return MONTH_NAMES_ID[month - 1] ?? "";
}

/** `Selasa, 1 September 2026` */
export function formatIndonesianDate(value: string): string {
  const date = parseIsoDate(value);
  return `${DAY_NAMES_ID[date.getUTCDay()]}, ${date.getUTCDate()} ${
    MONTH_NAMES_ID[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
}

/** `1 September 2026` */
export function formatShortDate(value: string): string {
  const date = parseIsoDate(value);
  return `${date.getUTCDate()} ${MONTH_NAMES_ID[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `1 Sep 2026` */
export function formatCompactDate(value: string): string {
  const date = parseIsoDate(value);
  return `${date.getUTCDate()} ${MONTH_NAMES_ID[date.getUTCMonth()].slice(0, 3)} ${date.getUTCFullYear()}`;
}

/** `1 - 4 September 2026` */
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

/** Label relatif: `Hari ini`, `Besok`, `3 hari lagi`, `2 hari lalu`. */
export function relativeDayLabel(value: string, clock: Date = new Date()): string {
  const diff = Math.round(
    (parseIsoDate(value).getTime() - parseIsoDate(todayInWib(clock)).getTime()) /
      MS_PER_DAY,
  );

  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff === -1) return "Kemarin";
  if (diff > 1) return `${diff} hari lagi`;
  return `${Math.abs(diff)} hari lalu`;
}

export function monthOf(value: string): number {
  return parseIsoDate(value).getUTCMonth() + 1;
}

export function yearOf(value: string): number {
  return parseIsoDate(value).getUTCFullYear();
}

/**
 * Rentang tanggal satu bulan penuh sebagai string ISO.
 *
 * Batas atas selalu `31` — dengan sengaja. Perbandingan tanggal di server
 * dilakukan sebagai teks (`YYYY-MM-DD`), sehingga `2026-02-31` tetap
 * menangkap seluruh hari di bulan Februari tanpa perlu tahu jumlah harinya.
 * Sama persis dengan `monthBounds` di `src/api/schedules/repository.ts`.
 */
export function monthRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const mm = String(month).padStart(2, "0");
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-31` };
}

/** Daftar bulan untuk dropdown, `{ value, label }`. */
export function monthOptions(): { value: number; label: string }[] {
  return MONTH_NAMES_ID.map((label, index) => ({ value: index + 1, label }));
}
