-- Migration: notify the backend when an organization is approved
-- Run in Supabase SQL Editor
--
-- Context: organizations are approved by manually flipping
-- organization_profiles.approval_status to 'approved' in the Supabase table
-- editor (there's no in-app admin panel for this yet). This trigger is what
-- actually tells the org they can log in — without it, approval_status
-- changes silently and nobody gets notified.
--
-- BEFORE RUNNING: replace the two placeholders below —
--   1. <YOUR_BACKEND_URL>  e.g. https://api.kindly.co.in (must be reachable
--      from Supabase's servers — not localhost)
--   2. <YOUR_WEBHOOK_SECRET>  the same value as the backend's WEBHOOK_SECRET
--      env var on Render (see backend/src/auth/guards/webhook-secret.guard.ts).
--      Use a fresh random value — do NOT reuse the old CRON_SECRET, which was
--      previously committed here in plaintext and must be considered leaked.

-- 1. Enable pg_net (Supabase's HTTP-from-Postgres extension), if not already on.
create extension if not exists pg_net with schema extensions;

-- 2. Trigger function: fires only on the transition INTO 'approved'.
create or replace function public.notify_org_approved()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.approval_status = 'approved' and (OLD.approval_status is distinct from 'approved') then
    perform net.http_post(
      url := '<YOUR_BACKEND_URL>/organizations/webhooks/approved',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-admin-secret', '<YOUR_WEBHOOK_SECRET>'
      ),
      body := jsonb_build_object('orgId', NEW.id)
    );
  end if;
  return NEW;
end;
$$;

-- 3. Attach the trigger to organization_profiles.
drop trigger if exists on_org_approved on public.organization_profiles;
create trigger on_org_approved
  after update on public.organization_profiles
  for each row
  execute function public.notify_org_approved();
