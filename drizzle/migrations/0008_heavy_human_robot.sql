/*
  Gambar kategori — disimpan di dalam baris, bukan di object storage.

  Menambahkan `categories.image` yang berisi **data URI base64**
  (`data:image/png;base64,…`), mis. ikon penanda untuk "Buah Segar" atau
  "Gorengan". Kolomnya nullable: kategori lama tetap sah tanpa gambar dan
  jatuh kembali ke kotak warna (`categories.color`).

  Kenapa base64 di kolom ini, bukan berkas terpisah:

  1. Jumlah kategori sedikit (satuan) dan gambarnya cuma ikon, jadi satu
     kolom menghapus seluruh urusan unggah/unduh berkas — tidak ada bucket,
     tidak ada URL yang bisa basi, dan tidak ada berkas yatim saat kategori
     dihapus.
  2. Awalan `data:…;base64,` ikut tersimpan sehingga nilainya siap dipakai
     `<img src>` apa adanya; tipe berkasnya tidak perlu ditebak saat
     menampilkan.

  Batas panjangnya ditegakkan aplikasi lewat `CATEGORY_IMAGE_MAX_LENGTH`
  (±730 KB berkas) — jauh di bawah batas 2 MB per baris D1. Karena gambar
  ikut terkirim di `GET /categories`, bentuk ringkas `CategorySummaryDto`
  sengaja **tidak** membawa kolom ini pada menu & jadwal.
*/

ALTER TABLE `categories` ADD `image` text;
