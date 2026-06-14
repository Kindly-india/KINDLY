-- Migration: allow unlimited volunteer slots
-- Run in Supabase SQL Editor

-- 1. Make total_slots nullable (NULL = unlimited)
ALTER TABLE events ALTER COLUMN total_slots DROP NOT NULL;

-- 2. Update register_for_event to skip capacity check when total_slots IS NULL
--    IMPORTANT: Replace the body below with your actual function body if it differs.
--    The only change needed is wrapping the EVENT_FULL check with:
--      IF v_event.total_slots IS NOT NULL THEN ... END IF;
--
--    If you have the original function in Supabase, edit it directly and add that
--    NULL guard around the capacity check. The pattern to find and wrap is:
--
--      -- BEFORE:
--      IF current_count >= v_event.total_slots THEN
--        RAISE EXCEPTION 'EVENT_FULL';
--      END IF;
--
--      -- AFTER:
--      IF v_event.total_slots IS NOT NULL AND current_count >= v_event.total_slots THEN
--        RAISE EXCEPTION 'EVENT_FULL';
--      END IF;
