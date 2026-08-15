-- Migration: superadmin_role
-- Run this in Supabase SQL Editor before deploying the hard-delete admin
-- feature (SuperAdminGuard reads admin_users.role = 'superadmin').
--
-- Reuses admin_users' existing `role` column (already TEXT, default 'admin',
-- from admin_users.sql) rather than adding a new table/column. Purely a data
-- update — no schema change. Restricts the genuinely irreversible actions
-- (hard-deleting an org/volunteer) to the two founding admins specifically,
-- per direct instruction, distinct from the wider set of everyday admin
-- actions (approve/reject/suspend/edit) any admin_users row can already do.

UPDATE admin_users
SET role = 'superadmin'
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('adityamohandhongade@gmail.com', 'manasdhivare@gmail.com')
);

-- Verification — should list exactly the two founding admins.
SELECT u.user_id, au.email, u.role, u.granted_at
FROM admin_users u
JOIN auth.users au ON au.id = u.user_id
WHERE u.role = 'superadmin';
