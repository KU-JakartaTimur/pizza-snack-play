/*
  Gambar kategori — disimpan di dalam baris, bukan di object storage.

  Menambahkan `categories.image` yang berisi **data URI base64**: teks
  `data:image/png`, lalu penanda `base64`, lalu isi gambarnya — mis. ikon
  penanda untuk "Buah Segar" atau "Gorengan". Kolomnya nullable: kategori lama
  tetap sah tanpa gambar dan jatuh kembali ke kotak warna (`categories.color`).

  Kenapa base64 di kolom ini, bukan berkas terpisah:

  1. Jumlah kategori sedikit (satuan) dan gambarnya cuma ikon, jadi satu kolom
     menghapus seluruh urutan unggah/unduh berkas — tidak ada bucket, tidak ada
     URL yang bisa basi, dan tidak ada berkas yatim saat kategori dihapus.
  2. Awalan `data:…` dan penanda `base64` ikut tersimpan sehingga nilainya siap
     dipakai `<img src>` apa adanya, dan tipe berkasnya tidak perlu ditebak saat
     menampilkan.

  Batas panjangnya ditegakkan aplikasi lewat `CATEGORY_IMAGE_MAX_LENGTH`
  (±730 KB berkas) — jauh di bawah batas 2 MB per baris D1. Karena gambar ikut
  terkirim di `GET /categories`, bentuk ringkas `CategorySummaryDto` sengaja
  **tidak** membawa kolom ini pada menu & jadwal.

  ═══════════════════════════════════════════════════════════════════════
  JANGAN menulis titik-koma di dalam komentar berkas migrasi
  ═══════════════════════════════════════════════════════════════════════

  Versi pertama migrasi ini menulis contoh data URI apa adanya, lengkap dengan
  titik-komanya. `wrangler d1 migrations apply --remote` menolaknya dengan:

    X [ERROR] SQL code did not contain a statement. [code: 7500]

  Sebabnya sudah **ditelusuri, bukan diduga**. `migrations apply` tidak
  menjalankan berkasnya sebagai berkas: isinya dibaca, disambung dengan
  `INSERT INTO d1_migrations …`, lalu dikirim sebagai **satu string perintah** —
  jalur yang sama dengan `d1 execute --command`. Di jalur itu pemisah pernyataan
  D1 memotong string pada setiap titik-koma **sebelum** komentar dibuang,
  sehingga potongan pertama (yang isinya hanya pembuka komentar) menjadi kosong
  dan ditolak 7500.

  Dibuktikan langsung pada database produksi, hanya dengan `SELECT 1`:

    komentar memuat titik-koma  ->  error 7500
    komentar tanpa titik-koma   ->  sukses

  `d1 execute --file` tidak terpengaruh (wrangler memotongnya sendiri di sisi
  klien), dan miniflare lokal memakai pemisah yang berbeda — jadi jebakan ini
  **hanya** muncul saat migrasi menyentuh production, tempat kegagalannya
  menghalangi deploy. Karena itu seluruh migrasi lain di direktori ini juga
  tidak pernah memuat titik-koma di komentarnya.
*/

ALTER TABLE `categories` ADD `image` text;
