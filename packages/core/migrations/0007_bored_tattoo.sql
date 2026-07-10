CREATE TABLE `fertiliser_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`field_id` text,
	`date` integer NOT NULL,
	`product_type` text,
	`rate_kg_ha` real,
	`total_kg` real,
	`method` text,
	`operator` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `forest_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`species` text NOT NULL,
	`area_ha` real NOT NULL,
	`planting_date` integer,
	`expected_harvest_year` integer,
	`stocking_rate` integer,
	`status` text DEFAULT 'ESTABLISHING' NOT NULL,
	`soil_type` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forest_harvests` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`date` integer NOT NULL,
	`volume_m3` real NOT NULL,
	`area_ha` real,
	`avg_stem_diam_cm` real,
	`buyer` text,
	`price_per_m3` real,
	`notes` text,
	FOREIGN KEY (`block_id`) REFERENCES `forest_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forest_plantings` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`date` integer NOT NULL,
	`species` text NOT NULL,
	`seedlings_planted` integer NOT NULL,
	`area_ha` real NOT NULL,
	`spacing` text,
	`supplier` text,
	`notes` text,
	FOREIGN KEY (`block_id`) REFERENCES `forest_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forest_thinnings` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`date` integer NOT NULL,
	`volume_m3` real NOT NULL,
	`area_ha` real,
	`avg_stem_diam_cm` real,
	`harvester` text,
	`notes` text,
	FOREIGN KEY (`block_id`) REFERENCES `forest_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mushroom_crops` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`species` text NOT NULL,
	`substrate_type` text,
	`spawn_date` integer NOT NULL,
	`spawn_source` text,
	`casing_date` integer,
	`first_harvest_date` integer,
	`last_harvest_date` integer,
	`total_yield_kg` real,
	`status` text DEFAULT 'IN_CROP' NOT NULL,
	`notes` text,
	FOREIGN KEY (`room_id`) REFERENCES `mushroom_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mushroom_harvests` (
	`id` text PRIMARY KEY NOT NULL,
	`crop_id` text NOT NULL,
	`date` integer NOT NULL,
	`kg` real NOT NULL,
	`grade` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	FOREIGN KEY (`crop_id`) REFERENCES `mushroom_crops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mushroom_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`room_type` text NOT NULL,
	`shelf_count` integer,
	`area_sqm` real,
	`climate_control` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nursery_beds` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`bed_type` text NOT NULL,
	`area_sqm` real,
	`capacity` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nursery_propagation` (
	`id` text PRIMARY KEY NOT NULL,
	`bed_id` text NOT NULL,
	`species` text NOT NULL,
	`variety` text,
	`seeded_date` integer NOT NULL,
	`tray_count` integer NOT NULL,
	`cells_per_tray` integer,
	`germination_pct` real,
	`expected_ready_date` integer,
	`status` text DEFAULT 'GERMINATING' NOT NULL,
	`notes` text,
	FOREIGN KEY (`bed_id`) REFERENCES `nursery_beds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nursery_transplants` (
	`id` text PRIMARY KEY NOT NULL,
	`propagation_id` text NOT NULL,
	`date` integer NOT NULL,
	`plant_count` integer NOT NULL,
	`destination` text,
	`buyer` text,
	`price_per_plant` real,
	`notes` text,
	FOREIGN KEY (`propagation_id`) REFERENCES `nursery_propagation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`module_id` text NOT NULL,
	`record_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
