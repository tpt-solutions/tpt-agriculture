CREATE TABLE `farm_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`template_id` text,
	`task_type` text NOT NULL,
	`title` text,
	`due_date` integer,
	`completed_date` integer,
	`assigned_to` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`source_module` text,
	`source_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `task_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `task_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`task_type` text NOT NULL,
	`default_due_days_offset` integer,
	`default_assigned_role` text,
	`category` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE cascade
);
