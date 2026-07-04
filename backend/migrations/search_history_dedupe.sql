-- Migration: stop search_history from accumulating duplicate rows
-- Run in Supabase SQL Editor.
--
-- Context: saveSearchHistory() (backend/src/social/social.service.ts) used a
-- non-atomic delete-then-insert with no unique constraint on the table, so any
-- concurrency (a fast re-click, reordered requests) could slip a second row for
-- the same person into a user's recent searches. This dedupes what's already
-- there and adds a constraint so it can't happen again. The backend is switched
-- to an idempotent upsert in the same change.

-- 1. Remove existing duplicates, keeping the most recent per (user_id, result_id).
delete from public.search_history a
using public.search_history b
where a.user_id = b.user_id
  and a.result_id = b.result_id
  and a.created_at < b.created_at;

-- Tie-breaker for rows created in the same instant.
delete from public.search_history a
using public.search_history b
where a.user_id = b.user_id
  and a.result_id = b.result_id
  and a.created_at = b.created_at
  and a.id < b.id;

-- 2. One row per (user_id, result_id) from now on. This is also the conflict
--    target the backend's upsert relies on.
alter table public.search_history
  add constraint search_history_user_result_unique unique (user_id, result_id);
