-- ROLLBACK ikon kategori Pizza Snack Play
-- Dibuat oleh scripts/generate-category-icons.mjs.
--
-- Mengosongkan kembali kolom `categories.image`.
--
-- Ini sah sebagai rollback **karena sebelum patch dijalankan seluruh baris
-- masih NULL**. Begitu ada kategori yang gambarnya diunggah lewat halaman
-- Kategori, perintah ini akan ikut menghapus gambar itu — persempit daftar
-- slug-nya lebih dulu bila itu yang diinginkan.
--
-- Jalankan:
--   bunx wrangler d1 execute pizza-snack-play --remote --file=./scripts/sql/kategori-icons-rollback.sql

UPDATE `categories` SET `image` = NULL WHERE `slug` IN ('gorengan', 'kukusan', 'rebusan', 'panggangan', 'buah-segar', 'roti-bakery', 'kue-tradisional', 'lainnya');
