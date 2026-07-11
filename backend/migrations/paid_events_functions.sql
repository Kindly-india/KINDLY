-- Paid Events: functions
-- Run in Supabase SQL Editor, after paid_events_schema.sql.
-- Safe to re-run (CREATE OR REPLACE).

-- Atomically confirms a paid registration: re-checks capacity/deadline/
-- duplicate, then inserts the event_registrations row. events.registered_count
-- is NOT touched manually here -- the existing update_registered_count_trigger
-- on event_registrations already maintains it on insert/delete, same as the
-- free-registration path. (There is no events.current_volunteers column --
-- an earlier version of this function incorrectly assumed one existed.)
--
-- Idempotent by payment_id: if a registration already references this
-- payment, returns it instead of erroring. This WILL be called twice in
-- normal operation -- once from POST /events/:id/payment/verify (the client
-- Checkout success handler) and once from the Razorpay webhook (the
-- authoritative backstop) -- and the two calls can race each other.
--
-- Uses its own advisory lock (hashtext(event_id)), independent of whatever
-- lock register_for_event uses for free RSVPs. This is safe because an event
-- is either paid or free, never both -- the create/edit-event UI only shows
-- a ticket price field when the "paid event" toggle is on, and locks it once
-- a paid registration exists -- so confirm_paid_registration and
-- register_for_event are never called concurrently for the same event_id.
create or replace function public.confirm_paid_registration(
  p_event_id uuid,
  p_volunteer_id uuid,
  p_payment_id uuid
)
returns public.event_registrations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event record;
  v_existing public.event_registrations;
  v_registration public.event_registrations;
begin
  perform pg_advisory_xact_lock(hashtext(p_event_id::text));

  select * into v_existing
    from public.event_registrations
    where payment_id = p_payment_id;

  if found then
    return v_existing;
  end if;

  select id, total_slots, registration_deadline, registered_count
    into v_event
    from public.events
    where id = p_event_id
    for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if v_event.registration_deadline is not null and v_event.registration_deadline < now() then
    raise exception 'DEADLINE_PASSED';
  end if;

  if exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and volunteer_id = p_volunteer_id
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;

  if v_event.total_slots is not null and v_event.registered_count >= v_event.total_slots then
    raise exception 'EVENT_FULL';
  end if;

  insert into public.event_registrations (event_id, volunteer_id, status, registered_at, payment_id)
  values (p_event_id, p_volunteer_id, 'registered', now(), p_payment_id)
  returning * into v_registration;

  return v_registration;
end;
$$;

-- NOTE: there is deliberately no "finalize_event_billing" function here.
-- Billing amounts are computed live by PaymentsService (backend/src/payments/
-- payments.service.ts) whenever an org/admin views a completed paid event,
-- and only written to event_bills at the moment admin marks it paid -- see
-- FINANCE.md's Architecture section for why (no need for DB-level atomicity
-- here, and freezing the amount at "paid" time rather than "completed" time
-- correctly picks up any late-arriving payment confirmations).
