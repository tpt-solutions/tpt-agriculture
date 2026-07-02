-- NOTE: `pin_hash` was never referenced anywhere and the `users` table itself
-- was dropped two migrations later by 0003_groovy_robbie_robertson.sql (the
-- Phase 13 auth removal). Kept as-is rather than squashed/deleted — rewriting
-- migration history would break the migration journal for any environment
-- that already applied it.
ALTER TABLE `users` ADD `pin_hash` text;