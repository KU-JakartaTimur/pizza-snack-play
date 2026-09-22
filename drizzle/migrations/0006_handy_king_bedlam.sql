ALTER TABLE `users` ADD `failed_login_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_failed_login_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `locked_at` text;