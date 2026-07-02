CREATE TABLE `custom_options` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`list_key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_options_farm_id_list_key_value_unique` ON `custom_options` (`farm_id`,`list_key`,`value`);