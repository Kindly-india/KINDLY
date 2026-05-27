-- Migration: add_org_gallery
-- Run this in Supabase SQL Editor before deploying the org gallery feature.

CREATE TABLE IF NOT EXISTS org_gallery (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security
ALTER TABLE org_gallery ENABLE ROW LEVEL SECURITY;

-- Public can read all gallery photos
CREATE POLICY "org_gallery_public_read"
  ON org_gallery FOR SELECT
  USING (true);

-- Only the org's user can insert photos
CREATE POLICY "org_gallery_owner_insert"
  ON org_gallery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the org's user can delete their own photos
CREATE POLICY "org_gallery_owner_delete"
  ON org_gallery FOR DELETE
  USING (auth.uid() = user_id);

-- NOTE: Reuses the existing "gallery_images" Supabase Storage bucket.
-- Org photos are stored under the "org/" prefix within that bucket.
