import {
  CATEGORY_IMAGE_MAX_LENGTH,
  CATEGORY_IMAGE_MIME_TYPES,
} from "../../types/catalog";

/**
 * Data URI gambar yang diterima: tipenya diambil dari daftar bersama, isinya
 * base64. Diuji **setelah** panjangnya diperiksa, supaya teks raksasa tidak
 * pernah masuk ke mesin regex.
 */
const IMAGE_DATA_URI = new RegExp(
  `^data:(${CATEGORY_IMAGE_MIME_TYPES.join("|")});base64,[A-Za-z0-9+/]+={0,2}$`,
);

/** Batas ukuran dalam KB — angka yang sama dipakai klien untuk pesannya. */
export const CATEGORY_IMAGE_MAX_KB = Math.round(
  CATEGORY_IMAGE_MAX_LENGTH / 1000,
);

/**
 * Periksa kolom `image` kategori.
 *
 * Tiga hal yang sengaja dibedakan, karena artinya berbeda bagi pemanggil:
 *
 * - `undefined` → kolomnya **tidak dikirim**, gambar yang tersimpan dibiarkan.
 * - `null`      → permintaan **mengosongkan** gambar.
 * - string      → harus data URI base64 yang sah dan tidak kebesaran.
 *
 * Mengembalikan pesan yang siap ditampilkan, atau `null` bila sah.
 */
export function validateCategoryImage(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;

  if (typeof raw !== "string") return "Gambar harus berupa teks base64";

  if (raw.length > CATEGORY_IMAGE_MAX_LENGTH) {
    return `Gambar terlalu besar — maksimum sekitar ${CATEGORY_IMAGE_MAX_KB} KB`;
  }

  if (!IMAGE_DATA_URI.test(raw)) {
    return `Gambar harus berupa data URI base64 bertipe ${CATEGORY_IMAGE_MIME_TYPES.join(", ")}`;
  }

  return null;
}
