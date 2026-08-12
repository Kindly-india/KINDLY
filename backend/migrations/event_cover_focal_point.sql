-- Migration: cover image focal point
-- Run in Supabase SQL Editor
--
-- Fixes wide/horizontal cover images getting unpredictably cropped when
-- squeezed into the app's various display frames (tall mobile hero, wide
-- desktop hero, square thumbnails). Organizers can now pick which part of
-- the photo stays visible; object-position uses this at render time.
--
-- NOT NULL DEFAULT 50 (dead-center) makes this fully backward-compatible:
-- every existing event backfills to 50/50, which is pixel-identical to the
-- unconditional center-crop every cover image already renders with today.

ALTER TABLE events
  ADD COLUMN cover_focal_x smallint NOT NULL DEFAULT 50 CHECK (cover_focal_x BETWEEN 0 AND 100),
  ADD COLUMN cover_focal_y smallint NOT NULL DEFAULT 50 CHECK (cover_focal_y BETWEEN 0 AND 100);
