CREATE TABLE `compliance_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`check_name` text NOT NULL,
	`category` text,
	`country_profile` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`due_date` integer,
	`completed_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `equipment_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`asset_type` text,
	`make` text,
	`model` text,
	`serial_number` text,
	`purchase_date` integer,
	`purchase_price` real,
	`last_service_date` integer,
	`next_service_date` integer,
	`wof_expiry` integer,
	`cof_expiry` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`item_name` text NOT NULL,
	`category` text,
	`unit` text,
	`current_stock` real DEFAULT 0 NOT NULL,
	`reorder_level` real,
	`location` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`item_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`quantity` real NOT NULL,
	`movement_date` integer NOT NULL,
	`reason` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `soil_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`test_date` integer NOT NULL,
	`field_name` text,
	`ph` real,
	`phosphorus_kg_ha` real,
	`potassium_kg_ha` real,
	`nitrogen_kg_ha` real,
	`organic_matter_pct` real,
	`calcium_kg_ha` real,
	`sulphur_kg_ha` real,
	`lab_reference` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `staff_members` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`contract_type` text,
	`phone` text,
	`email` text,
	`start_date` integer,
	`end_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
