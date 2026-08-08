-- Migration: admin_users
-- Run this in Supabase SQL Editor before deploying the AdminGuard/SupabaseService
-- change that reads from this table (see PR for "Admin upgrade Phase B").
--
-- Replaces the is_admin boolean on volunteer_profiles with a dedicated, sparse
-- table: only real admins get a row, with grant metadata instead of a bare
-- flag. Purely additive — does NOT touch volunteer_profiles or any other
-- existing table/column. The deployed code checks this table OR the legacy
-- is_admin flag (see SupabaseService.isAdmin), so nothing loses access if
-- this backfill is ever re-run or delayed relative to the code deploy.

CREATE TABLE admin_users (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'admin',
  granted_by  UUID        REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);

-- Row-level security — no policies defined on purpose: this table is only
-- ever read/written by the backend's service-role client (which bypasses
-- RLS), so "enabled, zero policies" correctly locks out anon/authenticated
-- access entirely.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Backfill: one row per account that currently has is_admin = true.
-- Dynamic (reads live data), not hardcoded emails — captures exactly who is
-- admin right now, which as of this writing is adityamohandhongade@gmail.com
-- and manasdhivare@gmail.com (confirmed via a read-only query before writing
-- this). team@kindly.co.in has no profile row at all yet, so it's untouched.
INSERT INTO admin_users (user_id, role, granted_at)
SELECT user_id, 'admin', NOW()
FROM volunteer_profiles
WHERE is_admin = true
ON CONFLICT (user_id) DO NOTHING;

-- Verification — run this after the above and confirm it lists exactly your
-- current admins before moving on.
SELECT u.user_id, v.email, u.role, u.granted_at
FROM admin_users u
JOIN volunteer_profiles v ON v.user_id = u.user_id;
