ALTER TABLE `users` ADD `failed_login_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_failed_login_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `locked_at` text;--> statement-breakpoint
/*
  Satu akun hanya boleh punya satu profil orang tua.

  Indeks ini semula ditulis untuk memenuhi syarat indeks sebuah foreign key
  komposit di `schedules` — kolom tujuan FK komposit wajib punya indeks unik.
  FK itu sudah dilepas di `0007` (lihat catatan panjang di berkas itu),
  sehingga alasan teknisnya tidak lagi berlaku. Indeksnya tetap dipertahankan
  karena aturannya memang benar dengan sendirinya, terlepas dari FK.

  Ditulis manual di sini, bukan di `0007`, karena `ALTER TABLE ... ADD INDEX`
  tidak dikenal SQLite: drizzle-kit menolak menambahkannya ke migrasi yang
  tidak sedang membangun ulang tabel `parents`.
*/
CREATE UNIQUE INDEX `idx_parents_user` ON `parents` (`user_id`);
