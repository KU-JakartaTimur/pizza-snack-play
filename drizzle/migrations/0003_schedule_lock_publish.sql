-- Menambahkan kolom status, locked_by, locked_at, published_by, published_at
-- ke tabel schedules untuk fitur Kunci & Publikasi Jadwal.
--
-- status: 'draft' (default) | 'locked' | 'published'
-- Data lama di-set ke 'published' agar tetap terlihat oleh orang tua
-- (kompatibilitas mundur — perilaku sebelumnya memperlihatkan semua jadwal).
ALTER TABLE `schedules` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `locked_by` integer REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
ALTER TABLE `schedules` ADD `locked_at` text;--> statement-breakpoint
ALTER TABLE `schedules` ADD `published_by` integer REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
ALTER TABLE `schedules` ADD `published_at` text;--> statement-breakpoint
-- Data lama dianggap sudah dipublikasi (agar tidak hilang dari tampilan orang tua)
UPDATE `schedules` SET `status` = 'published';--> statement-breakpoint
CREATE INDEX `idx_schedules_status` ON `schedules` (`status`);
