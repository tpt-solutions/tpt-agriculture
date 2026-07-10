CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`operation` text NOT NULL,
	`changed_by` text,
	`changed_at` integer NOT NULL,
	`old_values` text,
	`new_values` text,
	`notes` text,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
