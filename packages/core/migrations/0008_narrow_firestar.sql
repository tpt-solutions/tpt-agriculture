CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`record_table` text NOT NULL,
	`record_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`data_base64` text NOT NULL,
	`caption` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
