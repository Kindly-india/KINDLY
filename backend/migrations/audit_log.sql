-- Migration: audit_log
-- Run this in Supabase SQL Editor before deploying AuditService (Admin upgrade Phase C).
--
-- Lightweight audit trail for sensitive admin/financial actions (org
-- approve/reject, event approve, mark-paid). Fire-and-forget inserts from
-- the backend's service-role client only. target_id is TEXT (not a foreign
-- key) on purpose — the target row (e.g. a rejected org) may be deleted
-- after the action, and the log entry must survive that.

CREATE TABLE audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES auth.users(id),
  actor_email TEXT,
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_created_at_idx ON audit_log (created_at DESC);

-- Row-level security — no policies defined on purpose: this table is only
-- ever read/written by the backend's service-role client (which bypasses
-- RLS), so "enabled, zero policies" correctly locks out anon/authenticated
-- access entirely.
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
