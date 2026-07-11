-- NOTE: this function now calls public.finalize_event_billing(), defined in
-- paid_events_functions.sql -- run that file first (or re-run this file
-- after it) when applying the Paid Events migrations.

create extension if not exists pg_cron;

create or replace function public.auto_complete_events()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  completed_ids uuid[];
  v_id uuid;
begin
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

  update public.event_registrations
    set status = 'completed'
    where event_id = any(completed_ids) and status = 'checked_in';

  update public.event_registrations
    set status = 'missed'
    where event_id = any(completed_ids) and status = 'registered';

  -- Bill generation runs after the status flip above (see
  -- finalize_event_billing's doc comment in paid_events_functions.sql).
  -- No-ops for free events / events with zero paid registrations.
  foreach v_id in array completed_ids loop
    perform public.finalize_event_billing(v_id);
  end loop;

  return coalesce(array_length(completed_ids, 1), 0);
end;
$$;

select cron.unschedule('auto-complete-events')
where exists (select 1 from cron.job where jobname = 'auto-complete-events');

select cron.schedule('auto-complete-events', '0 * * * *', $$select public.auto_complete_events();$$);