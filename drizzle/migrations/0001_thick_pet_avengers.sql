CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer NOT NULL,
	`name` text NOT NULL,
	`class_name` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_students_parent_id` ON `students` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_students_class` ON `students` (`class_name`);--> statement-breakpoint
-- Pindahkan data anak yang sudah ada dari kolom lama di `parents`
-- ke tabel `students` SEBELUM kolomnya dihapus.
INSERT INTO `students` (`parent_id`, `name`, `class_name`, `is_active`, `created_at`, `updated_at`)
SELECT `id`, TRIM(`student_name`), `student_class`, 1, `created_at`, `updated_at`
FROM `parents`
WHERE `student_name` IS NOT NULL AND TRIM(`student_name`) <> '';--> statement-breakpoint
DROP INDEX `idx_parents_class`;--> statement-breakpoint
ALTER TABLE `parents` DROP COLUMN `student_name`;--> statement-breakpoint
ALTER TABLE `parents` DROP COLUMN `student_class`;