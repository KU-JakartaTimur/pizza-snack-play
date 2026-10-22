-- Push subscriptions untuk Web Push PWA
CREATE TABLE `push_subscriptions` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`endpoint` TEXT NOT NULL,
	`p256dh` TEXT NOT NULL,
	`auth` TEXT NOT NULL,
	`user_id` INTEGER,
	`class_name` TEXT,
	`created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_push_sub_endpoint` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_push_sub_user` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_push_sub_class` ON `push_subscriptions` (`class_name`);--> statement-breakpoint

-- Riwayat broadcast WhatsApp
CREATE TABLE `whatsapp_broadcasts` (
	`id` INTEGER PRIMARY KEY AUTOINCREMENT,
	`sender_id` INTEGER NOT NULL,
	`message` TEXT NOT NULL,
	`target_scope` TEXT NOT NULL DEFAULT 'all',
	`target_count` INTEGER NOT NULL DEFAULT 0,
	`sent_count` INTEGER NOT NULL DEFAULT 0,
	`status` TEXT NOT NULL DEFAULT 'pending',
	`error_message` TEXT,
	`created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `idx_wa_broadcast_sender` ON `whatsapp_broadcasts` (`sender_id`);--> statement-breakpoint
CREATE INDEX `idx_wa_broadcast_status` ON `whatsapp_broadcasts` (`status`);
