-- Migration: fix volunteer hours being ERASED when an event completes
-- Run in Supabase SQL Editor.  ⚠ Time-sensitive: the pg_cron auto-complete job
-- moves checked_in -> completed hourly, and the OLD trigger removed hours on
-- that transition. Run this to stop the bleeding and repair existing totals.
--
-- Root cause: update_volunteer_hours_on_checkin() added hours when a
-- registration became 'checked_in', and removed them when it left 'checked_in'
-- — but 'completed' counts as "left checked_in", so completing an event undid
-- the hours. Fix: treat 'checked_in' AND 'completed' as one "credited" state.
--   entering credited (from non-credited) -> add
--   leaving  credited (to  non-credited)  -> remove
--   checked_in <-> completed              -> no-op (hours stay)

-- 1. Corrected trigger function -------------------------------------------------
create or replace function public.update_volunteer_hours_on_checkin()
returns trigger
language plpgsql
security definer
as $function$
declare
  _start_time time;
  _end_time time;
  _duration_seconds double precision;
  _hours_to_log integer;
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

  _hours_to_log := round(_duration_seconds / 3600);

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

-- 2. One-time repair -----------------------------------------------------------
-- Recompute every volunteer's total_hours from their currently-credited
-- registrations, using the SAME per-event rounding the trigger uses. This
-- overwrites total_hours for all volunteers — safe, because the trigger is the
-- only writer and its output was corrupted by the bug above.
update public.volunteer_profiles vp
set total_hours = coalesce((
  select sum(round(
    (case
       when e.end_time < e.start_time
         then extract(epoch from ((e.end_time + interval '24 hours') - e.start_time))
       else extract(epoch from (e.end_time - e.start_time))
     end) / 3600
  ))
  from public.event_registrations er
  join public.events e on e.id = er.event_id
  where er.volunteer_id = vp.id
    and er.status in ('checked_in', 'completed')
), 0);
