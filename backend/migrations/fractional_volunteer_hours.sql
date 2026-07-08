-- Migration: store volunteer hours as FRACTIONAL (2dp) instead of whole hours.
-- Run in Supabase SQL Editor. Push the matching code at the same time — this is
-- the DB half of the hours-consolidation change (see backend/src/common/hours.util.ts
-- and frontend/lib/utils.ts eventHours(), which use the identical formula).
--
-- Why: a 1h30m event was being rounded to either 1h or 2h everywhere. We now keep
-- 2 decimals end-to-end. This supersedes the whole-hour rounding introduced by
-- fix_volunteer_hours_trigger.sql (that migration fixed hours being ERASED on
-- completion; this one makes the surviving value fractional).
--
-- Three coordinated steps, safe to run as one transaction:
--   1. widen volunteer_profiles.total_hours  integer -> numeric
--   2. rewrite the check-in trigger to log ROUND(duration, 2) per event
--   3. one-time recompute of every total_hours with the fractional formula

begin;

-- 1. Column type: integer -> numeric ------------------------------------------
-- Widening cast, no data loss. Keep the 0 default.
alter table public.volunteer_profiles
  alter column total_hours type numeric using coalesce(total_hours, 0)::numeric;

alter table public.volunteer_profiles
  alter column total_hours set default 0;

-- 2. Trigger function: fractional (2dp) per-event hours ------------------------
-- Identical credited-state logic to fix_volunteer_hours_trigger.sql — the ONLY
-- change is _hours_to_log is now numeric and rounded to 2 decimals, matching
-- eventHours() in both backend and frontend.
create or replace function public.update_volunteer_hours_on_checkin()
returns trigger
language plpgsql
security definer
as $function$
declare
  _start_time time;
  _end_time time;
  _duration_seconds double precision;
  _hours_to_log numeric;
  _old_credited boolean;
  _new_credited boolean;
begin
  _old_credited := (OLD.status in ('checked_in', 'completed'));
  _new_credited := (NEW.status in ('checked_in', 'completed'));

  -- Nothing to do unless the credited-state actually flipped.
  if _old_credited is not distinct from _new_credited then
    return NEW;
  end if;

  select start_time, end_time
  into _start_time, _end_time
  from public.events
  where id = NEW.event_id;

  if _end_time < _start_time then
    _duration_seconds := extract(epoch from ((_end_time + interval '24 hours') - _start_time));
  else
    _duration_seconds := extract(epoch from (_end_time - _start_time));
  end if;

  _hours_to_log := round((_duration_seconds / 3600)::numeric, 2);

  if _new_credited and not _old_credited then
    -- entered the credited state -> add hours
    update public.volunteer_profiles
    set total_hours = coalesce(total_hours, 0) + _hours_to_log
    where id = NEW.volunteer_id;
  elsif _old_credited and not _new_credited then
    -- left the credited state -> remove hours (floor at 0)
    update public.volunteer_profiles
    set total_hours = greatest(0, coalesce(total_hours, 0) - _hours_to_log)
    where id = NEW.volunteer_id;
  end if;

  return NEW;
end;
$function$;

-- 3. One-time recompute with the fractional formula ---------------------------
-- Sum ROUND(duration, 2) per credited registration. Same per-event rounding the
-- trigger now uses, so the column stays exactly consistent going forward.
update public.volunteer_profiles vp
set total_hours = coalesce((
  select sum(round(
    (case
       when e.end_time < e.start_time
         then extract(epoch from ((e.end_time + interval '24 hours') - e.start_time))
       else extract(epoch from (e.end_time - e.start_time))
     end) / 3600::numeric
  , 2))
  from public.event_registrations er
  join public.events e on e.id = er.event_id
  where er.volunteer_id = vp.id
    and er.status in ('checked_in', 'completed')
), 0);

commit;
