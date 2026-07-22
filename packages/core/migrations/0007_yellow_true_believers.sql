CREATE TABLE `livestock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`date` integer NOT NULL,
	`species` text NOT NULL,
	`direction` text NOT NULL,
	`head_count` integer NOT NULL,
	`tag_numbers` text,
	`scheme` text NOT NULL,
	`counterparty_name` text,
	`counterparty_property_id` text,
	`reference` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
