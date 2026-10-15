/**
 * Tautan WhatsApp dari nomor yang disimpan orang tua.
 *
 * Nomornya tersimpan apa adanya sebagai teks di `parents.phone` — admin pun
 * mengetiknya bebas dari menu Akun, dan orang tua boleh menulisnya dengan
 * tanda pemisah sesuka hati (`0812-3456-7890`, `+62 812 3456 7890`, …).
 * Karena itu bentuknya tidak bisa diandalkan; yang bisa diandalkan hanyalah
 * **digitnya**. `wa.me` sendiri hanya menerima digit, dengan kode negara tanpa
 * tanda `+` dan tanpa nol di depan — itulah yang disusun di sini.
 *
 * Modul ini murni (tanpa impor) supaya bisa diuji tanpa DOM.
 */

/** Kode negara Indonesia — pengganti nol di depan nomor lokal. */
const ID_COUNTRY_CODE = "62";

/**
 * Jumlah digit tersedikit yang masih masuk akal sebagai nomor telepon.
 * Di bawah itu pasti bukan nomor, jadi lebih baik tidak dibuatkan tautan
 * daripada menyodorkan tautan yang menuju nomor orang lain.
 */
const MIN_DIGITS = 8;

/**
 * Ubah nomor tersimpan menjadi tautan `wa.me`, atau `null` bila nomornya
 * kosong/tidak masuk akal.
 *
 * Mengembalikan `null` — bukan tautan kosong — supaya pemanggilnya cukup
 * memeriksa kebenaran nilainya untuk memutuskan antara menampilkan tautan
 * atau teks biasa.
 */
export function whatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < MIN_DIGITS) return null;

  return `https://wa.me/${withCountryCode(digits)}`;
}

/**
 * Susun digit menjadi format internasional.
 *
 * - `0812…`  → `62812…` — nol di depan adalah penanda lokal, bukan bagian nomor
 * - `62812…` → tetap, sudah lengkap
 * - lainnya  → dibiarkan apa adanya; bisa jadi nomor luar negeri yang sudah
 *              lengkap, dan menempelkan kode negara kita justru salah
 */
function withCountryCode(digits: string): string {
  return digits.startsWith("0") ? ID_COUNTRY_CODE + digits.slice(1) : digits;
}
