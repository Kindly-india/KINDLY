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
--   2. <YOUR_CRON_SECRET>  the same value as the backend's CRON_SECRET env var
--      (this is the existing secret already used by the /events/auto-complete
--      cron route — see backend/src/auth/guards/cron-secret.guard.ts)

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
      url := 'https://kindly-2ggv.onrender.com/organizations/webhooks/approved',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-admin-secret', '43386149bc3c9e755f20acdc82ef2f73eb5820d1aa6e2f6b83248ade62e0c5c5'
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
