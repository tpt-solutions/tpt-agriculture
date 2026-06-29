CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `farm_users` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `farm_users_farm_id_user_id_unique` ON `farm_users` (`farm_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `farms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country_profile` text DEFAULT 'nz' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `aqua_feeding_events` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`date` integer NOT NULL,
	`feed_type` text,
	`amount_g` real NOT NULL,
	`notes` text,
	FOREIGN KEY (`system_id`) REFERENCES `aqua_systems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `aqua_plant_yields` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`date` integer NOT NULL,
	`crop_variety` text NOT NULL,
	`yield_grams` real NOT NULL,
	`bed` text,
	`notes` text,
	FOREIGN KEY (`system_id`) REFERENCES `aqua_systems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `aqua_systems` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`system_type` text NOT NULL,
	`fish_tank_litres` real,
	`grow_bed_sqm` real,
	`pump_flow_lph` real,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `canopy_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`date` integer NOT NULL,
	`shoot_length_cm` real,
	`lateral_growth` text,
	`leaf_area_index` real,
	`observations` text,
	`photos` text,
	FOREIGN KEY (`block_id`) REFERENCES `vit_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chemicals` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`active_ingredient` text,
	`registration_no` text,
	`withholding_period_days` integer,
	`safety_notes` text,
	`hazard_class` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `climate_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`structure_id` text NOT NULL,
	`date` integer NOT NULL,
	`temp_min_c` real,
	`temp_max_c` real,
	`humidity_pct` real,
	`co2_ppm` integer,
	`light_lux` integer,
	`notes` text,
	FOREIGN KEY (`structure_id`) REFERENCES `structures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `crop_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`field_id` text,
	`crop_variety` text NOT NULL,
	`planned_plant_date` integer NOT NULL,
	`planned_harvest_date` integer,
	`actual_plant_date` integer,
	`actual_harvest_date` integer,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `fertigation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`structure_id` text NOT NULL,
	`date` integer NOT NULL,
	`ec` real,
	`ph` real,
	`nutrients` text,
	`volume_litres` real,
	`irrigation_mins` integer,
	`notes` text,
	FOREIGN KEY (`structure_id`) REFERENCES `structures`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fields` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`area_ha` real NOT NULL,
	`soil_type` text,
	`irrigation_zone` text,
	`coordinates` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fish_stocks` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`species` text NOT NULL,
	`stock_count` integer NOT NULL,
	`average_weight_g` real,
	`stock_date` integer NOT NULL,
	`source` text,
	`notes` text,
	FOREIGN KEY (`system_id`) REFERENCES `aqua_systems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `harvest_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`field_id` text,
	`crop_variety` text NOT NULL,
	`harvest_date` integer NOT NULL,
	`total_yield_kg` real NOT NULL,
	`grade_breakdown` text,
	`lot_number` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `harvest_records` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`plot_id` text,
	`yield_kg` real NOT NULL,
	`grade` text,
	`notes` text,
	FOREIGN KEY (`batch_id`) REFERENCES `harvest_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plot_id`) REFERENCES `plots`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `microgreen_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`variety` text NOT NULL,
	`substrate` text,
	`tray_count` integer NOT NULL,
	`tray_size_cm` text,
	`seeding_date` integer NOT NULL,
	`expected_harvest_date` integer,
	`actual_harvest_date` integer,
	`yield_grams` real,
	`revenue_nzd` real,
	`buyer` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microgreen_trays` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`tray_number` integer NOT NULL,
	`yield_grams` real,
	`notes` text,
	FOREIGN KEY (`batch_id`) REFERENCES `microgreen_batches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orchard_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`species` text NOT NULL,
	`variety` text,
	`area_ha` real,
	`year_planted` integer,
	`rootstock` text,
	`pollinator_variety` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orchard_harvest_bins` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`harvest_date` integer NOT NULL,
	`bin_count` integer NOT NULL,
	`weight_kg` real,
	`grade` text,
	`coolstore_id` text,
	`notes` text,
	FOREIGN KEY (`block_id`) REFERENCES `orchard_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `planting_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`crop_plan_id` text NOT NULL,
	`task_type` text NOT NULL,
	`due_date` integer NOT NULL,
	`completed_date` integer,
	`assigned_to` text,
	`notes` text,
	FOREIGN KEY (`crop_plan_id`) REFERENCES `crop_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plots` (
	`id` text PRIMARY KEY NOT NULL,
	`field_id` text NOT NULL,
	`name` text NOT NULL,
	`row` integer,
	`col` integer,
	`area_sqm` real,
	`notes` text,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spray_events` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`field_id` text,
	`chemical_id` text,
	`application_date` integer NOT NULL,
	`rate_per_ha` real,
	`total_volume_litres` real,
	`operator` text,
	`weather_conditions` text,
	`wind_speed_kph` real,
	`temp_c` real,
	`withholding_end_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`chemical_id`) REFERENCES `chemicals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `structures` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`area_sqm` real NOT NULL,
	`year_built` integer,
	`roof_material` text,
	`heating_system` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tree_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`tree_count` integer NOT NULL,
	`tree_spacing_m` real,
	`row_spacing_m` real,
	`training_system` text,
	`notes` text,
	FOREIGN KEY (`block_id`) REFERENCES `orchard_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `veg_beds` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`length_m` real,
	`width_m` real,
	`indoor` integer DEFAULT false NOT NULL,
	`soil_mix` text,
	`irrigation_type` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `veg_successions` (
	`id` text PRIMARY KEY NOT NULL,
	`bed_id` text NOT NULL,
	`crop_variety` text NOT NULL,
	`plant_date` integer NOT NULL,
	`transplant_date` integer,
	`expected_harvest_date` integer,
	`actual_harvest_date` integer,
	`yield_kg` real,
	`seed_source` text,
	`notes` text,
	FOREIGN KEY (`bed_id`) REFERENCES `veg_beds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vintage_records` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`year` integer NOT NULL,
	`brix_at_harvest` real,
	`ph_at_harvest` real,
	`ta_at_harvest` real,
	`yield_kg` real,
	`harvest_date` integer,
	`winemaker` text,
	`notes` text,
	FOREIGN KEY (`block_id`) REFERENCES `vit_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vintage_records_block_id_year_unique` ON `vintage_records` (`block_id`,`year`);--> statement-breakpoint
CREATE TABLE `vit_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`variety` text NOT NULL,
	`area_ha` real NOT NULL,
	`row_count` integer,
	`rootstock` text,
	`year_planted` integer,
	`trellis_system` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `water_quality_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`system_id` text NOT NULL,
	`date` integer NOT NULL,
	`ph` real,
	`ammonia_mgl` real,
	`nitrite_mgl` real,
	`nitrate_mgl` real,
	`do_mgl` real,
	`temp_c` real,
	`notes` text,
	FOREIGN KEY (`system_id`) REFERENCES `aqua_systems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bee_hives` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`hive_name` text NOT NULL,
	`hive_type` text,
	`location` text,
	`queen_age` integer,
	`queen_color` text,
	`origin` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bee_honey_harvests` (
	`id` text PRIMARY KEY NOT NULL,
	`hive_id` text NOT NULL,
	`date` integer NOT NULL,
	`kg` real NOT NULL,
	`type` text,
	`grade` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	FOREIGN KEY (`hive_id`) REFERENCES `bee_hives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bee_inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`hive_id` text NOT NULL,
	`date` integer NOT NULL,
	`temperament` text,
	`queen_seen` integer DEFAULT true NOT NULL,
	`eggs_present` integer DEFAULT true NOT NULL,
	`brood_pattern` text,
	`mite_count` integer,
	`food_stores` text,
	`disease_signs` text,
	`action` text,
	`notes` text,
	FOREIGN KEY (`hive_id`) REFERENCES `bee_hives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `beef_draftings` (
	`id` text PRIMARY KEY NOT NULL,
	`mob_id` text NOT NULL,
	`date` integer NOT NULL,
	`head_count` integer NOT NULL,
	`avg_weight_kg` real NOT NULL,
	`destination` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`mob_id`) REFERENCES `beef_mobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `beef_mobs` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`breed` text,
	`head_count` integer NOT NULL,
	`location` text,
	`target_weight_kg` real,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `beef_weight_records` (
	`id` text PRIMARY KEY NOT NULL,
	`mob_id` text NOT NULL,
	`date` integer NOT NULL,
	`avg_weight_kg` real NOT NULL,
	`sample_count` integer,
	`notes` text,
	FOREIGN KEY (`mob_id`) REFERENCES `beef_mobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dairy_cows` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`animal_id` text NOT NULL,
	`breed` text,
	`date_of_birth` integer,
	`sex` text DEFAULT 'FEMALE' NOT NULL,
	`current_status` text DEFAULT 'LACTATING' NOT NULL,
	`calving_count` integer DEFAULT 0 NOT NULL,
	`last_calving_date` integer,
	`sire` text,
	`dam` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dairy_health_events` (
	`id` text PRIMARY KEY NOT NULL,
	`cow_id` text NOT NULL,
	`date` integer NOT NULL,
	`event_type` text NOT NULL,
	`description` text NOT NULL,
	`withdrawn` integer DEFAULT false NOT NULL,
	`withdrawn_until` integer,
	FOREIGN KEY (`cow_id`) REFERENCES `dairy_cows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dairy_milk_records` (
	`id` text PRIMARY KEY NOT NULL,
	`cow_id` text NOT NULL,
	`date` integer NOT NULL,
	`liters` real NOT NULL,
	`fat_pct` real,
	`protein_pct` real,
	`scc` integer,
	`comments` text,
	FOREIGN KEY (`cow_id`) REFERENCES `dairy_cows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deer_herds` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`species` text,
	`head_count` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deer_velvet_records` (
	`id` text PRIMARY KEY NOT NULL,
	`herd_id` text NOT NULL,
	`stag_id` text,
	`harvest_date` integer NOT NULL,
	`velvet_kg` real NOT NULL,
	`grade` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	FOREIGN KEY (`herd_id`) REFERENCES `deer_herds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deer_venison_records` (
	`id` text PRIMARY KEY NOT NULL,
	`herd_id` text NOT NULL,
	`date` integer NOT NULL,
	`head_count` integer NOT NULL,
	`carcass_kg` real NOT NULL,
	`grade` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	FOREIGN KEY (`herd_id`) REFERENCES `deer_herds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goat_fibre_records` (
	`id` text PRIMARY KEY NOT NULL,
	`herd_id` text NOT NULL,
	`date` integer NOT NULL,
	`fibre_kg` real NOT NULL,
	`fibre_type` text,
	`grade` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	FOREIGN KEY (`herd_id`) REFERENCES `goat_herds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goat_herds` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`breed` text,
	`head_count` integer NOT NULL,
	`type` text DEFAULT 'DAIRY' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goat_milk_records` (
	`id` text PRIMARY KEY NOT NULL,
	`herd_id` text NOT NULL,
	`date` integer NOT NULL,
	`liters` real NOT NULL,
	`butterfat` real,
	`protein` real,
	`comments` text,
	FOREIGN KEY (`herd_id`) REFERENCES `goat_herds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `paddock_rotations` (
	`id` text PRIMARY KEY NOT NULL,
	`paddock_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`stock_type` text,
	`head_count` integer,
	`comments` text,
	FOREIGN KEY (`paddock_id`) REFERENCES `paddocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `paddocks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`area_ha` real NOT NULL,
	`soil_type` text,
	`grass_type` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pasture_cover_records` (
	`id` text PRIMARY KEY NOT NULL,
	`paddock_id` text NOT NULL,
	`date` integer NOT NULL,
	`cover_kg_ha` real NOT NULL,
	`method` text,
	`growth_rate` real,
	`notes` text,
	FOREIGN KEY (`paddock_id`) REFERENCES `paddocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pig_feed_records` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`date` integer NOT NULL,
	`group_name` text NOT NULL,
	`head_count` integer NOT NULL,
	`feed_type` text NOT NULL,
	`feed_kg` real NOT NULL,
	`cost_per_kg` real,
	`notes` text,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pig_litters` (
	`id` text PRIMARY KEY NOT NULL,
	`sow_id` text NOT NULL,
	`farrow_date` integer NOT NULL,
	`piglets_born` integer NOT NULL,
	`piglets_alive` integer NOT NULL,
	`piglets_weaned` integer,
	`wean_date` integer,
	`notes` text,
	FOREIGN KEY (`sow_id`) REFERENCES `pig_sows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pig_sows` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`animal_id` text NOT NULL,
	`breed` text,
	`date_of_birth` integer,
	`parity_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`sire` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poultry_egg_records` (
	`id` text PRIMARY KEY NOT NULL,
	`flock_id` text NOT NULL,
	`date` integer NOT NULL,
	`egg_count` integer NOT NULL,
	`grade` text,
	`cracked` integer DEFAULT 0 NOT NULL,
	`comments` text,
	FOREIGN KEY (`flock_id`) REFERENCES `poultry_flocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poultry_flocks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`batch_name` text NOT NULL,
	`species` text NOT NULL,
	`breed` text,
	`bird_count` integer NOT NULL,
	`housed_date` integer NOT NULL,
	`house` text,
	`purpose` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poultry_mortality` (
	`id` text PRIMARY KEY NOT NULL,
	`flock_id` text NOT NULL,
	`date` integer NOT NULL,
	`count` integer NOT NULL,
	`cause` text,
	`notes` text,
	FOREIGN KEY (`flock_id`) REFERENCES `poultry_flocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sheep_drenching_records` (
	`id` text PRIMARY KEY NOT NULL,
	`flock_id` text NOT NULL,
	`date` integer NOT NULL,
	`product` text NOT NULL,
	`dose_ml` real,
	`head_count` integer NOT NULL,
	`withholding_meat` integer,
	`notes` text,
	FOREIGN KEY (`flock_id`) REFERENCES `sheep_flocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sheep_flocks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`breed` text,
	`head_count` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sheep_lambing_records` (
	`id` text PRIMARY KEY NOT NULL,
	`flock_id` text NOT NULL,
	`season` text NOT NULL,
	`ewes_lambed` integer NOT NULL,
	`lambs_born` integer NOT NULL,
	`lambs_alive` integer NOT NULL,
	`lambing_pct` real,
	`date` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`flock_id`) REFERENCES `sheep_flocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sheep_shearing_records` (
	`id` text PRIMARY KEY NOT NULL,
	`flock_id` text NOT NULL,
	`date` integer NOT NULL,
	`head_count` integer NOT NULL,
	`wool_kg` real NOT NULL,
	`wool_grade` text,
	`buyer` text,
	`price_per_kg` real,
	`notes` text,
	FOREIGN KEY (`flock_id`) REFERENCES `sheep_flocks`(`id`) ON UPDATE no action ON DELETE cascade
);
