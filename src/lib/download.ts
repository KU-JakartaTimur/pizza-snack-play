/**
 * Simpan `Blob` yang sudah diterima sebagai berkas di komputer pemakai.
 *
 * Tombol unduh tidak bisa dibuat sebagai tautan biasa: berkas ini hanya boleh
 * diambil dengan menyertakan token JWT, sedangkan `<a href>` tidak membawa
 * header `Authorization`. Karena itu isinya diambil lebih dulu lewat `fetch`,
 * lalu objek sementara ini yang memicu penyimpanan.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // URL objek harus dilepas; kalau tidak, isi berkasnya tertahan di memori
  // selama halaman belum ditutup.
  URL.revokeObjectURL(url);
}
