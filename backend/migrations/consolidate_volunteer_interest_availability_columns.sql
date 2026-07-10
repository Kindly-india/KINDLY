-- Migration: consolidate duplicate volunteer_profiles columns (P1-3).
-- Run in Supabase SQL Editor. Push the matching backend + frontend code at the
-- same time — see backend/src/volunteer/dto/update-volunteer-profile.dto.ts,
-- backend/src/auth/auth.service.ts, backend/src/event/event.service.ts, and
-- frontend/app/settings/profile/page.tsx.
--
-- Why: onboarding writes interest_tags (fixed ~25-tag vocabulary that drives
-- feed personalization) + preferred_availability; settings separately writes a
-- freeform `interests` field (verified: rendered nowhere in the UI) +
-- availability_status (a superset enum, adds 'remote'). Two concepts each
-- split across two never-synced columns. Keeping interest_tags +
-- preferred_availability: interest_tags already powers a real feature and
-- interests is currently dead weight; preferred_availability just needs its
-- enum widened by one value.
--
-- Tiebreak when both availability columns are already set and disagree:
-- settings' value (availability_status) wins, since it's the more-recently
-- editable surface.

begin;

-- 1. Widen preferred_availability's CHECK constraint to add 'remote' ----------
-- The constraint name isn't tracked in this repo (added outside a migration
-- file, likely via the Supabase dashboard), so look it up dynamically instead
-- of guessing it — drops every CHECK constraint currently on this column.
do $$
declare
  _constraint_name text;
begin
  for _constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
    where rel.relname = 'volunteer_profiles'
      and att.attname = 'preferred_availability'
      and con.contype = 'c'
  loop
    execute format('alter table public.volunteer_profiles drop constraint %I', _constraint_name);
  end loop;
end $$;

alter table public.volunteer_profiles
  add constraint volunteer_profiles_preferred_availability_check
  check (preferred_availability is null or preferred_availability in ('weekends', 'weekdays', 'remote', 'flexible'));

-- 2. Backfill: settings value wins where both are set and disagree -------------
update public.volunteer_profiles
set preferred_availability = availability_status
where availability_status is not null
  and availability_status is distinct from preferred_availability;

-- 3. Drop the duplicate columns -------------------------------------------------
-- interests: freeform text, never rendered anywhere in the UI (verified) — no
-- sensible way to map it onto the fixed interest_tags vocabulary, so this is a
-- real but low-stakes (unused-field) data loss, accepted knowingly.
alter table public.volunteer_profiles drop column if exists interests;
alter table public.volunteer_profiles drop column if exists availability_status;

commit;
