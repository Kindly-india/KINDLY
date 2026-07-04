-- Migration: move event auto-completion into the database (pg_cron)
-- Run in Supabase SQL Editor.
--
-- Context: events currently become 'completed' via POST /events/auto-complete
-- (backend/src/event/event.service.ts), triggered by an external cron-job.org
-- schedule. Downsides of that: a third party holds CRON_SECRET, every run is an
-- HTTP round-trip to the Render backend, and a misconfigured job (GET instead
-- of POST, or a missing/wrong x-admin-secret header) fails silently — leaving
-- events stuck 'published' and impact reading 0.
--
-- This replaces all of that with a pure-SQL function scheduled by pg_cron,
-- running entirely inside Postgres: no HTTP, no external service, no secret.
--
-- WHY A SCHEDULED JOB, NOT A TRIGGER: completion is time-based. Nothing writes
-- to an event row when it simply "ends" — only the clock moves — so a trigger
-- (which fires on row changes) can never do this. pg_cron is the right tool.
--
-- This mirrors autoCompleteEvents() exactly. Once it's live and verified, you
-- can delete the cron-job.org job (see DECOMMISSION at the bottom). The backend
-- POST /events/auto-complete route can stay as a manual/admin escape hatch or
-- be removed — your call; this function makes it redundant.

-- 1. Enable pg_cron (also available via Dashboard -> Database -> Extensions).
create extension if not exists pg_cron;

-- 2. The completion logic — an event is completed once its end time (IST) is
--    more than 24 hours in the past. Identical to the backend's rule.
create or replace function public.auto_complete_events()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  completed_ids uuid[];
begin
  -- Collect published events whose end time (Asia/Kolkata) is >24h ago.
  -- (event_date + end_time) is a naive timestamp; AT TIME ZONE 'Asia/Kolkata'
  -- reads it as IST wall-clock and returns an absolute timestamptz to compare.
  select array_agg(id) into completed_ids
  from public.events
  where status = 'published'
    and (((event_date + coalesce(end_time, start_time)) at time zone 'Asia/Kolkata')
         < now() - interval '24 hours');

  if completed_ids is null then
    return 0;
  end if;

  update public.events
    set status = 'completed', updated_at = now()
    where id = any(completed_ids);

  -- Attendees who checked in -> completed; no-shows who only registered -> missed.
  update public.event_registrations
    set status = 'completed'
    where event_id = any(completed_ids) and status = 'checked_in';

  update public.event_registrations
    set status = 'missed'
    where event_id = any(completed_ids) and status = 'registered';

  return coalesce(array_length(completed_ids, 1), 0);
end;
$$;

-- 3. Schedule it hourly. The 24h cutoff means hourly is plenty (an event flips
--    to 'completed' within an hour of crossing the mark). Unschedule any prior
--    copy first so re-running this file is safe.
select cron.unschedule('auto-complete-events')
where exists (select 1 from cron.job where jobname = 'auto-complete-events');

select cron.schedule('auto-complete-events', '0 * * * *', $$select public.auto_complete_events();$$);

-- ── Useful afterwards ────────────────────────────────────────────────────────
-- Watch runs:   select * from cron.job_run_details order by start_time desc limit 20;
-- Run once now: select public.auto_complete_events();
-- Stop it:      select cron.unschedule('auto-complete-events');
--
-- ── DECOMMISSION the old external cron ───────────────────────────────────────
-- Once you've confirmed a successful run above, delete the cron-job.org job that
-- hits /events/auto-complete. Nothing else uses it.
