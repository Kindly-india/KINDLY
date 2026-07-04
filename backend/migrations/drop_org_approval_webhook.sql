-- Migration: remove the org-approval DB webhook (replaced by the admin panel)
-- Run in Supabase SQL Editor.
--
-- Context: org approval used to work by manually flipping approval_status in the
-- dashboard, which fired the on_org_approved trigger -> notify_org_approved ->
-- HTTP POST to the backend (authenticated with the shared CRON_SECRET/
-- WEBHOOK_SECRET). That whole chain is now replaced by the in-app admin panel:
-- an admin approves/rejects via PATCH /organizations/admin/:id/approval
-- (AdminGuard), which sets approval_status AND emails the org inline.
--
-- So the trigger, its function, and the shared secret are no longer needed —
-- drop them. After this, NOTHING in the project uses a webhook/cron secret.

drop trigger if exists on_org_approved on public.organization_profiles;
drop function if exists public.notify_org_approved();

-- Note: org_approval_webhook.sql is now obsolete — this supersedes it.
