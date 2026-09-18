ALTER TABLE `schedules` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `locked_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `schedules` ADD `locked_at` text;--> statement-breakpoint
ALTER TABLE `schedules` ADD `published_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `schedules` ADD `published_at` text;--> statement-breakpoint
CREATE INDEX `idx_schedules_status` ON `schedules` (`status`);