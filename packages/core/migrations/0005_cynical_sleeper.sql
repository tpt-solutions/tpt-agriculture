CREATE TABLE `input_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`item_name` text NOT NULL,
	`category` text,
	`unit` text,
	`cost_per_unit` real NOT NULL,
	`effective_date` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`amount` real NOT NULL,
	`category` text,
	`module_id` text,
	`description` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `output_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`item_name` text NOT NULL,
	`category` text,
	`unit` text,
	`price_per_unit` real NOT NULL,
	`effective_date` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
