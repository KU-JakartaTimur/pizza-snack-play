ALTER TABLE `users` ADD `class_name` text;--> statement-breakpoint
DROP INDEX `idx_schedules_date`;--> statement-breakpoint
-- Jadwal kini bersifat per kelas, sehingga keunikannya menjadi komposit
-- (schedule_date, class_name). SQLite tidak mengizinkan penambahan kolom
-- NOT NULL pada tabel yang sudah berisi data, jadi tabel dibangun ulang
-- lalu isinya direplikasi ke setiap kelas yang dikenal.
CREATE TABLE `schedules_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_id` integer,
	`schedule_date` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`class_name` text NOT NULL,
	`menu_id` integer,
	`is_holiday` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
-- Setiap baris jadwal lama (dulu berlaku untuk seluruh sekolah) digandakan
-- ke tiap kelas yang terdaftar pada `students`, ditambah kelas yang sudah
-- dikoordinasi oleh akun korlas.
INSERT INTO `schedules_new`
	(`week_id`, `schedule_date`, `day_of_week`, `class_name`, `menu_id`, `is_holiday`, `notes`, `created_at`, `updated_at`)
SELECT
	s.`week_id`, s.`schedule_date`, s.`day_of_week`, c.`class_name`, s.`menu_id`, s.`is_holiday`, s.`notes`, s.`created_at`, s.`updated_at`
FROM `schedules` s
CROSS JOIN (
	SELECT DISTINCT TRIM(`class_name`) AS `class_name` FROM `students`
	WHERE `class_name` IS NOT NULL AND TRIM(`class_name`) <> ''
	UNION
	SELECT DISTINCT TRIM(`class_name`) AS `class_name` FROM `users`
	WHERE `role` = 'korlas' AND `class_name` IS NOT NULL AND TRIM(`class_name`) <> ''
) c;--> statement-breakpoint
-- Bila belum ada satu pun kelas, baris lama diselamatkan ke kelas "Umum"
-- supaya jadwal yang sudah tersusun tidak hilang.
INSERT INTO `schedules_new`
	(`week_id`, `schedule_date`, `day_of_week`, `class_name`, `menu_id`, `is_holiday`, `notes`, `created_at`, `updated_at`)
SELECT
	s.`week_id`, s.`schedule_date`, s.`day_of_week`, 'Umum', s.`menu_id`, s.`is_holiday`, s.`notes`, s.`created_at`, s.`updated_at`
FROM `schedules` s
WHERE NOT EXISTS (
	SELECT 1 FROM `schedules_new` n WHERE n.`schedule_date` = s.`schedule_date`
);--> statement-breakpoint
DROP TABLE `schedules`;--> statement-breakpoint
ALTER TABLE `schedules_new` RENAME TO `schedules`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_schedules_date_class` ON `schedules` (`schedule_date`,`class_name`);--> statement-breakpoint
CREATE INDEX `idx_schedules_class` ON `schedules` (`class_name`);--> statement-breakpoint
CREATE INDEX `idx_schedules_week` ON `schedules` (`week_id`);--> statement-breakpoint
CREATE INDEX `idx_schedules_menu` ON `schedules` (`menu_id`);
