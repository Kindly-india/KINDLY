-- Migration: drop the unused phone_verifications table
-- Run in Supabase SQL Editor.
--
-- Real phone-OTP verification was never wired up (auth is email-only, via the
-- OTP AuthCard + Google). This table has no readers/writers left anywhere in
-- the codebase — the "phone-verification" module was renamed to
-- volunteer-contact and only ever writes phone straight to
-- volunteer_profiles.phone. Supersedes phone_verifications_cascade.sql, whose
-- FK fix is now moot since the table it patched no longer exists.

drop table if exists public.phone_verifications;
