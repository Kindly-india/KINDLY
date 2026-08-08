-- Migration: drop_is_admin_column
-- Run this AFTER admin_users.sql has been run and the deployed backend code
-- (SupabaseService.isAdmin reading only admin_users, no fallback) is live.
--
-- Confirmed via a read-only query before writing this: both current admins
-- (adityamohandhongade@gmail.com, manasdhivare@gmail.com) already have an
-- active row in admin_users, so nothing depends on this column anymore —
-- confirmed with a repo-wide grep that no backend or frontend code reads
-- volunteer_profiles.is_admin any longer.

ALTER TABLE volunteer_profiles DROP COLUMN is_admin;
