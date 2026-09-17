/** Pembantu parsing & validasi parameter request. */

/** Parse ID numerik positif dari path/query. `null` bila tidak valid. */
export function parseId(raw: string | undefined | null): number | null {
  const id = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Batas jumlah hari untuk query rentang bebas. */
export const MAX_RANGE_DAYS = 92;

/**
 * Validasi rentang tanggal `from`–`to` (format `YYYY-MM-DD`).
 * Mengembalikan pesan error, atau `null` bila valid.
 */
export function validateRange(
  from: string | undefined,
  to: string | undefined,
): string | null {
  if (!from || !to) return "Parameter `from` dan `to` wajib diisi";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return "Format tanggal harus YYYY-MM-DD";
  }
  if (from > to) return "`from` tidak boleh melebihi `to`";

  const days =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000;
  if (days > MAX_RANGE_DAYS) {
    return `Rentang maksimum ${MAX_RANGE_DAYS} hari`;
  }

  return null;
}
