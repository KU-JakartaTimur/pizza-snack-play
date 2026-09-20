/** Pembantu parsing & validasi parameter request. */

/** Batas bawah & atas tahun yang diterima untuk query bulanan. */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

/** Parse ID numerik positif dari path/query. `null` bila tidak valid. */
export function parseId(raw: string | undefined | null): number | null {
  const id = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Validasi parameter `year` + `month`.
 * Mengembalikan pesan error, atau `null` bila keduanya valid.
 */
export function validateYearMonth(year: number, month: number): string | null {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return "Parameter `year` tidak valid";
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Parameter `month` harus 1–12";
  }
  return null;
}

/** Batas jumlah hari untuk query rentang bebas. */
export const MAX_RANGE_DAYS = 92;

/**
 * Batas lebih longgar untuk pencarian riwayat — satu tahun ajaran
 * (~13 bulan) agar pencarian lintas semester tetap mungkin.
 */
export const MAX_SEARCH_DAYS = 400;

/**
 * Validasi rentang tanggal `from`–`to` (format `YYYY-MM-DD`).
 * Mengembalikan pesan error, atau `null` bila valid.
 */
export function validateRange(
  from: string | undefined,
  to: string | undefined,
  maxDays: number = MAX_RANGE_DAYS,
): string | null {
  if (!from || !to) return "Parameter `from` dan `to` wajib diisi";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return "Format tanggal harus YYYY-MM-DD";
  }
  if (from > to) return "`from` tidak boleh melebihi `to`";

  const days =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000;
  if (days > maxDays) {
    return `Rentang maksimum ${maxDays} hari`;
  }

  return null;
}
