-- Migration: fix the one FK that would block deleting a user
-- Run in Supabase SQL Editor.
--
-- The FK audit showed every relationship is already ON DELETE CASCADE (or, for
-- notifications.actor_id, the correct SET NULL) — except phone_verifications,
-- which was ON DELETE NO ACTION. That would BLOCK deleting an auth user who has
-- a phone_verifications row (e.g. the org-reject flow's auth.admin.deleteUser,
-- or a future account-deletion flow). Change it to CASCADE.
--
-- (The phone-verification feature is currently unused — if you later remove it
-- entirely, drop this table instead. Until then, CASCADE keeps deletes working.)

alter table public.phone_verifications
  drop constraint phone_verifications_user_id_fkey,
  add constraint phone_verifications_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
