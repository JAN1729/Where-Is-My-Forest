-- =============================================
-- Where Is My Forest — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable required extensions
-- (Commented out because re-running this on an existing Supabase project often causes "dependent privileges exist" errors)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================
-- Table 1: forest_stats
-- Static reference data per state from ISFR
-- =============================================
CREATE TABLE IF NOT EXISTS public.forest_stats (
  id SERIAL PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  total_area_sqkm NUMERIC,
  forest_cover_sqkm NUMERIC NOT NULL,
  forest_cover_pct NUMERIC,
  dense_forest_sqkm NUMERIC,
  open_forest_sqkm NUMERIC,
  scrub_sqkm NUMERIC,
  alerts_count INTEGER DEFAULT 0,
  trend TEXT CHECK (trend IN ('increasing', 'decreasing', 'stable')) DEFAULT 'stable',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table 2: forest_alerts
-- Deforestation + fire alerts from GFW & NASA
-- =============================================
CREATE TABLE IF NOT EXISTS public.forest_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('deforestation', 'fire', 'encroachment')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  state TEXT,
  location TEXT,
  area_affected_ha NUMERIC,
  confidence NUMERIC,
  data_source TEXT NOT NULL,  -- 'GFW_GLAD', 'NASA_FIRMS', etc.
  detected_at TIMESTAMPTZ NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table 3: news_articles
-- Forest-related news from NewsData.io
-- =============================================
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_name TEXT,
  source_url TEXT,
  category TEXT CHECK (category IN ('deforestation', 'fire', 'conservation', 'wildlife', 'policy')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  state TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  published_at TIMESTAMPTZ,
  ai_summary TEXT,
  external_id TEXT UNIQUE,  -- prevent duplicates
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table 4: deforestation_trends
-- Monthly aggregated trend data
-- =============================================
CREATE TABLE IF NOT EXISTS public.deforestation_trends (
  id SERIAL PRIMARY KEY,
  period TEXT NOT NULL,  -- e.g. 'Jan 2026'
  alerts INTEGER DEFAULT 0,
  area_lost NUMERIC DEFAULT 0,
  fires INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_alerts_detected ON public.forest_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.forest_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_state ON public.forest_alerts(state);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news_articles(category);

-- =============================================
-- Row Level Security — enable read for everyone
-- =============================================
ALTER TABLE public.forest_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forest_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deforestation_trends ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
DROP POLICY IF EXISTS "Public read forest_stats" ON public.forest_stats;
DROP POLICY IF EXISTS "Public read forest_alerts" ON public.forest_alerts;
DROP POLICY IF EXISTS "Public read news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "Public read deforestation_trends" ON public.deforestation_trends;

CREATE POLICY "Public read forest_stats" ON public.forest_stats FOR SELECT USING (true);
CREATE POLICY "Public read forest_alerts" ON public.forest_alerts FOR SELECT USING (true);
CREATE POLICY "Public read news_articles" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "Public read deforestation_trends" ON public.deforestation_trends FOR SELECT USING (true);

-- Service role does not need explicit policies as it bypasses RLS automatically.
-- Removed previously insecure public insert policies to prevent unauthorized data spoofing.

-- =============================================
-- Enable Realtime for live updates
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forest_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forest_alerts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'news_articles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
  END IF;
END $$;

-- =============================================
-- Cron job: refresh data every 30 minutes
-- (Calls our Edge Functions via pg_net)
-- =============================================
-- NOTE: Replace YOUR_PROJECT_REF and YOUR_ANON_KEY below
-- SELECT cron.schedule(
--   'refresh-forest-alerts',
--   '*/30 * * * *',
--   $$SELECT net.http_post(
--     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-forest-alerts',
--     '{}',
--     'application/json',
--     ARRAY[http_header('Authorization', 'Bearer YOUR_ANON_KEY')]
--   )$$
-- );
--
-- SELECT cron.schedule(
--   'refresh-forest-news',
--   '*/30 * * * *',
--   $$SELECT net.http_post(
--     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-forest-news',
--     '{}',
--     'application/json',
--     ARRAY[http_header('Authorization', 'Bearer YOUR_ANON_KEY')]
--   )$$
-- );

-- =============================================
-- Table: incidents (User reported)
-- =============================================
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT CHECK (length(description) <= 2000),
  category TEXT NOT NULL CHECK (category IN ('deforestation', 'fire', 'wildlife', 'conservation', 'pollution', 'policy', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  latitude NUMERIC NOT NULL CHECK (latitude BETWEEN 6.0 AND 36.0),
  longitude NUMERIC NOT NULL CHECK (longitude BETWEEN 68.0 AND 98.0),
  state TEXT,
  district TEXT,
  location_name TEXT,
  reporter_name TEXT,
  reporter_org TEXT,
  reporter_contact TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'resolved', 'dismissed')),
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table: planted_trees (Community reforestation)
-- =============================================
CREATE TABLE IF NOT EXISTS public.planted_trees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  planter_name TEXT NOT NULL,
  planted_date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  tree_type TEXT,
  ai_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table: protected_areas
-- =============================================
CREATE TABLE IF NOT EXISTS public.protected_areas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  type TEXT,
  threat_level TEXT,
  latitude NUMERIC,
  longitude NUMERIC
);

-- =============================================
-- Table: resource_directory
-- =============================================
CREATE TABLE IF NOT EXISTS public.resource_directory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  category TEXT,
  contact_info TEXT
);

-- RLS for new tables
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planted_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protected_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_directory ENABLE ROW LEVEL SECURITY;

-- Read policies
DROP POLICY IF EXISTS "Public read incidents" ON public.incidents;
DROP POLICY IF EXISTS "Public read planted_trees" ON public.planted_trees;
DROP POLICY IF EXISTS "Public read protected_areas" ON public.protected_areas;
DROP POLICY IF EXISTS "Public read resource_directory" ON public.resource_directory;

CREATE POLICY "Public read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Public read planted_trees" ON public.planted_trees FOR SELECT USING (true);
CREATE POLICY "Public read protected_areas" ON public.protected_areas FOR SELECT USING (true);
CREATE POLICY "Public read resource_directory" ON public.resource_directory FOR SELECT USING (true);

-- Insert policies (Anon users can only insert, not update/delete)
DROP POLICY IF EXISTS "Public insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Public insert planted_trees" ON public.planted_trees;

CREATE POLICY "Public insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert planted_trees" ON public.planted_trees FOR INSERT WITH CHECK (status = 'pending');

-- =============================================
-- Table: rate_limits (Edge Function protection)
-- =============================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  last_request TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Storage Bucket & Policies: tree-photos
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tree-photos', 
  'tree-photos', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure storage policies exist securely
DROP POLICY IF EXISTS "Public read tree-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon insert tree-photos" ON storage.objects;

CREATE POLICY "Public read tree-photos" ON storage.objects FOR SELECT USING (bucket_id = 'tree-photos');
CREATE POLICY "Anon insert tree-photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'tree-photos' 
  AND (auth.role() = 'anon' OR auth.role() = 'authenticated')
);

-- =============================================
-- Seed: India state-wise forest data (ISFR 2023)
-- =============================================
INSERT INTO public.forest_stats (state, total_area_sqkm, forest_cover_sqkm, forest_cover_pct, alerts_count, trend) VALUES
  ('Madhya Pradesh', 308252, 77073, 25.0, 14, 'decreasing'),
  ('Arunachal Pradesh', 83743, 66688, 79.6, 8, 'decreasing'),
  ('Chhattisgarh', 135192, 55547, 41.1, 12, 'decreasing'),
  ('Odisha', 155707, 51345, 33.0, 9, 'stable'),
  ('Maharashtra', 307713, 50778, 16.5, 11, 'stable'),
  ('Jharkhand', 79716, 23553, 29.5, 10, 'decreasing'),
  ('Karnataka', 191791, 38575, 20.1, 7, 'stable'),
  ('Andhra Pradesh', 162968, 29137, 17.9, 6, 'stable'),
  ('Assam', 78438, 26832, 34.2, 7, 'decreasing'),
  ('Uttarakhand', 53483, 24303, 45.4, 5, 'stable'),
  ('Kerala', 38852, 21144, 54.4, 4, 'stable'),
  ('Tamil Nadu', 130058, 26364, 20.3, 5, 'increasing'),
  ('Rajasthan', 342239, 16572, 4.8, 3, 'stable'),
  ('Meghalaya', 22429, 17046, 76.0, 6, 'decreasing'),
  ('Mizoram', 21081, 17820, 84.5, 4, 'decreasing'),
  ('Nagaland', 16579, 12251, 73.9, 3, 'decreasing'),
  ('Manipur', 22327, 16847, 75.5, 4, 'decreasing'),
  ('Tripura', 10486, 7726, 73.7, 3, 'decreasing'),
  ('Himachal Pradesh', 55673, 15434, 27.7, 2, 'increasing'),
  ('Gujarat', 196024, 14857, 7.6, 3, 'increasing'),
  ('Telangana', 112077, 20582, 18.4, 5, 'stable'),
  ('West Bengal', 88752, 16805, 18.9, 4, 'stable'),
  ('Jammu & Kashmir', 42241, 10062, 23.8, 2, 'stable'),
  ('Sikkim', 7096, 3341, 47.1, 1, 'stable'),
  ('Goa', 3702, 2237, 60.4, 1, 'stable'),
  ('Punjab', 50362, 1849, 3.7, 1, 'increasing'),
  ('Bihar', 94163, 7296, 7.7, 3, 'stable'),
  ('Uttar Pradesh', 240928, 14806, 6.1, 4, 'stable'),
  ('Haryana', 44212, 1603, 3.6, 1, 'stable')
ON CONFLICT (state) DO UPDATE SET
  forest_cover_sqkm = EXCLUDED.forest_cover_sqkm,
  forest_cover_pct = EXCLUDED.forest_cover_pct,
  alerts_count = EXCLUDED.alerts_count,
  trend = EXCLUDED.trend,
  updated_at = NOW();
