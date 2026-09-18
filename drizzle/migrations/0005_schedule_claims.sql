CREATE TABLE `schedule_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schedule_id` integer NOT NULL,
	`parent_id` integer NOT NULL,
	`student_id` integer,
	`note` text,
	`claimed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_schedule_claims_schedule` ON `schedule_claims` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `idx_schedule_claims_parent` ON `schedule_claims` (`parent_id`);