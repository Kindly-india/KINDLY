-- Migration: account_suspension
-- Run this in Supabase SQL Editor before deploying the suspend/disable admin
-- feature (P2-19) that reads/writes these columns.
--
-- Adds a reversible suspend/disable capability for an *approved* org or an
-- *active* volunteer. Deliberately separate from organization_profiles'
-- existing approval_status enum ('pending'/'approved') rather than adding a
-- 3rd value to it — approval_status already has a tightly-coupled meaning
-- (setApprovalStatus's rejected branch hard-deletes a still-pending org; a
-- suspension needs to be reversible and apply post-approval, a different
-- concept). Purely additive — does NOT touch any existing column.

ALTER TABLE organization_profiles
  ADD COLUMN suspended_at     TIMESTAMPTZ,
  ADD COLUMN suspended_reason TEXT,
  ADD COLUMN suspended_by     UUID REFERENCES auth.users(id);

ALTER TABLE volunteer_profiles
  ADD COLUMN suspended_at     TIMESTAMPTZ,
  ADD COLUMN suspended_reason TEXT,
  ADD COLUMN suspended_by     UUID REFERENCES auth.users(id);

-- Verification — should return zero rows immediately after this migration
-- (nothing is suspended yet).
SELECT 'organization_profiles' AS table_name, id, name FROM organization_profiles WHERE suspended_at IS NOT NULL
UNION ALL
SELECT 'volunteer_profiles', id, full_name FROM volunteer_profiles WHERE suspended_at IS NOT NULL;
