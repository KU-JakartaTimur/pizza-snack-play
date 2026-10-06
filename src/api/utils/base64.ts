/**
 * Base64 ↔ byte untuk berkas yang dikirim lewat JSON.
 *
 * Klien mengirim isi `.xlsx` sebagai teks base64, bukan `multipart/form-data`.
 * Alasannya bukan kesederhanaan belaka: klien HTTP aplikasi ini memasang
 * `Content-Type: application/json` untuk semua permintaan, dan permintaan
 * multipart menuntut header itu dihapus agar `boundary`-nya bisa diisi
 * otomatis — satu-satunya tempat di aplikasi yang perlu menembus bungkus itu.
 * Berkas impor juga kecil (daftar akun sekolah), jadi pembengkakan 33% dari
 * base64 tidak berarti apa-apa.
 */

/** Buang spasi & ganti alfabet base64url, lalu tambal padding yang hilang. */
function normalize(value: string): string {
  const compact = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  return compact + "=".repeat((4 - (compact.length % 4)) % 4);
}

/**
 * Base64 → byte. Melempar `Error` bila isinya bukan base64 — pemanggil yang
 * memutuskan bagaimana melaporkannya.
 */
export function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(normalize(value));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
