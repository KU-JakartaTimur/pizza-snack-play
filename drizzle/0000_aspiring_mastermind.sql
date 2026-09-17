CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`color` text DEFAULT '#CCCCCC',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_name` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_holidays_date` ON `holidays` (`date`);--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_file` text NOT NULL,
	`records_added` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`error_message` text,
	`imported_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_categories` (
	`menu_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`menu_id`, `category_id`),
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`menu_id` integer NOT NULL,
	`name` text NOT NULL,
	`item_type` text DEFAULT 'main' NOT NULL,
	`category_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_menu_items_menu_id` ON `menu_items` (`menu_id`);--> statement-breakpoint
CREATE INDEX `idx_menu_items_name` ON `menu_items` (`name`);--> statement-breakpoint
CREATE INDEX `idx_menu_items_type` ON `menu_items` (`item_type`);--> statement-breakpoint
CREATE TABLE `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_menus_name` ON `menus` (`name`);--> statement-breakpoint
CREATE INDEX `idx_menus_active` ON `menus` (`is_active`);--> statement-breakpoint
CREATE TABLE `parents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`parent_name` text NOT NULL,
	`student_name` text NOT NULL,
	`student_class` text,
	`relationship` text DEFAULT 'ibu' NOT NULL,
	`phone` text,
	`address` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_parents_user_id` ON `parents` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_parents_class` ON `parents` (`student_class`);--> statement-breakpoint
CREATE INDEX `idx_parents_active` ON `parents` (`is_active`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_id` integer,
	`schedule_date` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`menu_id` integer,
	`is_holiday` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_schedules_date` ON `schedules` (`schedule_date`);--> statement-breakpoint
CREATE INDEX `idx_schedules_week` ON `schedules` (`week_id`);--> statement-breakpoint
CREATE INDEX `idx_schedules_menu` ON `schedules` (`menu_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_settings_key` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text,
	`email` text,
	`phone` text,
	`role` text DEFAULT 'parent' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`last_login_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_users_active` ON `users` (`is_active`);--> statement-breakpoint
CREATE TABLE `weeks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_start_date` text NOT NULL,
	`week_end_date` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`label` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weeks_range` ON `weeks` (`week_start_date`,`week_end_date`);--> statement-breakpoint
CREATE INDEX `idx_weeks_month_year` ON `weeks` (`month`,`year`);