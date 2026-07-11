-- Paid Events: schema
-- Run in Supabase SQL Editor. Safe to re-run (uses IF NOT EXISTS guards).
-- Must be run together with paid_events_functions.sql and the updated
-- auto_complete_events_cron.sql before the dependent backend code is deployed.

-- Ticket price in paise (smallest currency unit, matches Razorpay's convention).
-- NULL/0 = free event. No separate is_paid column -- derive from this.
alter table public.events
  add column if not exists ticket_price integer;

comment on column public.events.ticket_price is 'Ticket price in paise. NULL/0 = free event.';

-- Org's UPI id, shown to the superadmin (for manual payout) and to the org
-- on its own bill. Payouts are manual in v1 -- see FINANCE.md.
alter table public.organization_profiles
  add column if not exists upi_id text;

-- One row per payment attempt/order for a paid registration.
create table if not exists public.event_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount_paise integer not null,
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded', 'partially_refunded')),
  refund_amount_paise integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_payments_event_id_idx on public.event_payments(event_id);
create index if not exists event_payments_volunteer_id_idx on public.event_payments(volunteer_id);

-- Links a registration to the payment that paid for it. NULL for free events.
alter table public.event_registrations
  add column if not exists payment_id uuid references public.event_payments(id);

-- Razorpay delivers webhooks at-least-once -- dedup by their event id.
-- Insert a row here BEFORE processing a webhook, not after, so a crash
-- mid-processing on redelivery doesn't reprocess.
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

-- One row per event's bill to its organization. Only created for events that
-- actually have paid registrations (see finalize_event_billing), at event
-- completion. Visible only to the org that held the event and the superadmin.
create table if not exists public.event_bills (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  organization_id uuid not null references public.organization_profiles(id) on delete cascade,
  gross_amount_paise integer not null,
  org_amount_paise integer not null,
  platform_fee_paise integer not null,
  eligible_registration_count integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  paid_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_bills_organization_id_idx on public.event_bills(organization_id);
create index if not exists event_bills_status_idx on public.event_bills(status);
