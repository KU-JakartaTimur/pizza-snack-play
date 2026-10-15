/**
 * Normalisasi nomor telepon/WhatsApp.
 *
 * Orang tua menuliskan nomornya dengan gaya yang berbeda-beda — `0812-3456-7890`,
 * `+62 812 3456 7890`, `(021) 555 1234`. Yang disimpan sebaiknya satu bentuk
 * saja, supaya nomor yang sama tidak pernah tampak berbeda hanya karena cara
 * penulisannya. Bentuk yang dipilih di sini adalah **digit murni tanpa tanda
 * pemisah**, karena itulah yang langsung bisa dipakai tautan `wa.me`
 * (lihat `src/lib/whatsapp.ts` di sisi klien).
 *
 * Modul ini sengaja tidak mengimpor apa pun: aturannya murni, sehingga bisa
 * diuji tanpa database.
 */

/**
 * Batas jumlah digit. Nomor Indonesia berkisar 9–13 digit, jadi batas bawah
 * `8` masih menerima nomor rumah yang pendek, sedangkan batas atas `20`
 * sesuai batas nomor internasional (E.164) — lebih dari itu pasti salah ketik.
 */
export const MIN_PHONE_DIGITS = 8;
export const MAX_PHONE_DIGITS = 20;

/** Karakter yang boleh muncul sebagai pemisah di dalam nomor. */
const ALLOWED_SEPARATORS = /[\s().+-]/;

/**
 * Rapikan nomor menjadi digit murni.
 *
 * Mengembalikan:
 * - `null`      — teksnya kosong, artinya nomornya memang dikosongkan;
 * - `"invalid"` — isinya bukan nomor yang masuk akal;
 * - `string`    — digit murni, mis. `"6281234567890"`.
 *
 * Pemisah yang lazim dipakai (`+`, spasi, tanda hubung, titik, tanda kurung)
 * diterima apa adanya, sebab menolaknya hanya membuat orang tua mengulang
 * isian yang sebenarnya sudah benar. Sebaliknya huruf dan `+` di tengah nomor
 * ditolak: keduanya tanda salah ketik, dan menyimpannya diam-diam akan
 * menghasilkan tautan WhatsApp yang tidak bisa dibuka.
 */
export function normalizePhone(raw: string): string | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");

  for (const char of trimmed) {
    if (!/\d/.test(char) && !ALLOWED_SEPARATORS.test(char)) return "invalid";
  }

  // `+` hanya boleh di awal (kode negara).
  if (trimmed.slice(1).includes("+")) return "invalid";

  if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) {
    return "invalid";
  }

  return digits;
}
