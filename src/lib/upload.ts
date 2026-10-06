/**
 * Baca berkas yang dipilih pemakai menjadi teks base64.
 *
 * Dipakai fitur impor yang mengirim isi berkas di dalam JSON, bukan sebagai
 * `multipart/form-data`. Alasannya ada di `src/api/utils/base64.ts`: klien HTTP
 * aplikasi ini memasang `Content-Type: application/json` untuk semua
 * permintaan, dan multipart menuntut header itu dilepas agar `boundary`-nya
 * bisa diisi otomatis.
 *
 * `FileReader.readAsDataURL` dipakai karena ia sudah menangani pembacaan
 * berkas besar tanpa menyusun string biner di JavaScript; hasilnya lalu
 * dipotong di koma pertama untuk membuang awalan `data:…;base64,`.
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Berkas tidak bisa dibaca"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };

    reader.readAsDataURL(file);
  });
}
