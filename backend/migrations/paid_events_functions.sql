-- Paid Events: functions
-- Run in Supabase SQL Editor, after paid_events_schema.sql.
-- Safe to re-run (CREATE OR REPLACE).

-- Atomically confirms a paid registration: re-checks capacity/deadline/
-- duplicate, then inserts the event_registrations row and increments
-- events.current_volunteers.
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

  select id, total_slots, registration_deadline, current_volunteers
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

  if v_event.total_slots is not null and v_event.current_volunteers >= v_event.total_slots then
    raise exception 'EVENT_FULL';
  end if;

  insert into public.event_registrations (event_id, volunteer_id, status, registered_at, payment_id)
  values (p_event_id, p_volunteer_id, 'registered', now(), p_payment_id)
  returning * into v_registration;

  update public.events
    set current_volunteers = current_volunteers + 1
    where id = p_event_id;

  return v_registration;
end;
$$;

-- Computes and stores the bill owed to an event's organization: 93% of the
-- gross amount collected from still-existing, paid registrations.
--
-- This naturally includes no-shows -- by the time this runs (after the
-- registered->missed / checked_in->completed status flip), every remaining
-- registration is either 'completed' or 'missed', both billable -- and
-- naturally excludes cancelled/refunded registrations, since cancelling a
-- registration hard-deletes its event_registrations row.
--
-- Idempotent: no-ops if a bill already exists for this event (never
-- overwrites a bill an admin may have already marked paid), and returns null
-- (no bill created) if there are zero paid registrations -- which is always
-- true for free events, so this is safe to call unconditionally on every
-- completed event, not just paid ones.
--
-- Call this AFTER the status-flip updates, from BOTH completion paths:
-- auto_complete_events() (below) and NestJS's completeEvent().
create or replace function public.finalize_event_billing(p_event_id uuid)
returns public.event_bills
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
  v_gross integer;
  v_org_amount integer;
  v_count integer;
  v_bill public.event_bills;
begin
  select * into v_bill from public.event_bills where event_id = p_event_id;
  if found then
    return v_bill;
  end if;

  select organization_id into v_organization_id
    from public.events where id = p_event_id;

  if v_organization_id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  select coalesce(sum(ep.amount_paise), 0), count(*)
    into v_gross, v_count
    from public.event_registrations er
    join public.event_payments ep on ep.id = er.payment_id
    where er.event_id = p_event_id and ep.status = 'paid';

  if v_count = 0 then
    return null;
  end if;

  v_org_amount := floor(v_gross * 0.93)::integer;

  insert into public.event_bills (
    event_id, organization_id, gross_amount_paise, org_amount_paise,
    platform_fee_paise, eligible_registration_count
  )
  values (
    p_event_id, v_organization_id, v_gross, v_org_amount,
    v_gross - v_org_amount, v_count
  )
  on conflict (event_id) do nothing
  returning * into v_bill;

  return v_bill;
end;
$$;
