/*
  # WatchWicket ScoreBox - jwkobz Database Setup Migration

  ## Purpose
  Make the jwkobz Supabase project fully compatible with WatchWicket ScoreBox app.
  This migration is SAFE, IDEMPOTENT, and can be run multiple times without issues.

  ## What This Does

  1. **Creates matches table if missing** with all required columns
  2. **Adds missing columns** to existing matches table (if they don't exist)
  3. **Fixes overs column** - ensures it has a default value of 15 and is NOT NULL
  4. **Sets up RLS policies** for authenticated users to manage their own matches
  5. **Creates updated_at trigger** for automatic timestamp updates
  6. **Adds indexes** for performance optimization

  ## Required Columns

  The app inserts these columns when creating/updating matches:
  - id (uuid, primary key, auto-generated)
  - user_id (uuid, required, references auth.users)
  - match_type (text, required, default 'INDOOR')
  - team_a_name (text, required, default 'Team A')
  - team_b_name (text, required, default 'Team B')
  - team_a_logo_url (text, nullable)
  - team_b_logo_url (text, nullable)
  - status (text, required, default 'draft')
  - format (text, required, default 'INDOOR')
  - match_data (jsonb, required, default '{}')
  - has_activity (boolean, required, default false)
  - legal_balls (integer, required, default 0)
  - is_public (boolean, required, default false)
  - overs (integer, required, default 15)
  - created_at (timestamptz, auto-set)
  - updated_at (timestamptz, auto-updated)
  - completed_at (timestamptz, nullable)
  - league_id (uuid, nullable)
  - fixture_id (uuid, nullable)
  - deleted_at (timestamptz, nullable, for soft delete)
  - match_date (date, nullable)
  - match_time (time, nullable)
  - match_location (text, nullable)
  - allow_player_stats_view (boolean, default false)
  - allow_team_scorecard_view (boolean, default false)

  ## RLS Policies

  - Authenticated users can INSERT/SELECT/UPDATE/DELETE their own matches
  - Public can SELECT matches where is_public = true
  - Completed matches are immutable (updates blocked via policy)

  ## Safety Features

  - Uses IF NOT EXISTS for all CREATE operations
  - Checks column existence before ALTER TABLE ADD COLUMN
  - Idempotent - safe to run multiple times
  - No data loss - only adds/modifies, never drops
*/

-- ============================================================
-- STEP 1: Create matches table if it doesn't exist
-- ============================================================

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_type text DEFAULT 'INDOOR' NOT NULL,
  team_a_name text DEFAULT 'Team A' NOT NULL,
  team_b_name text DEFAULT 'Team B' NOT NULL,
  team_a_logo_url text,
  team_b_logo_url text,
  status text DEFAULT 'draft' NOT NULL,
  format text DEFAULT 'INDOOR' NOT NULL,
  match_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  has_activity boolean DEFAULT false NOT NULL,
  legal_balls integer DEFAULT 0 NOT NULL,
  is_public boolean DEFAULT false NOT NULL,
  overs integer DEFAULT 15 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  deleted_at timestamptz,
  league_id uuid,
  fixture_id uuid,
  match_date date,
  match_time time,
  match_location text,
  allow_player_stats_view boolean DEFAULT false,
  allow_team_scorecard_view boolean DEFAULT false
);

-- ============================================================
-- STEP 2: Add missing columns to existing table
-- ============================================================

-- Helper function to add column if it doesn't exist
DO $$
BEGIN
  -- match_data column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_data'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN match_data jsonb DEFAULT '{}'::jsonb NOT NULL;
    RAISE NOTICE 'Added match_data column';
  END IF;

  -- legal_balls column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'legal_balls'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN legal_balls integer DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added legal_balls column';
  END IF;

  -- has_activity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'has_activity'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN has_activity boolean DEFAULT false NOT NULL;
    RAISE NOTICE 'Added has_activity column';
  END IF;

  -- is_public column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN is_public boolean DEFAULT false NOT NULL;
    RAISE NOTICE 'Added is_public column';
  END IF;

  -- status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN status text DEFAULT 'draft' NOT NULL;
    RAISE NOTICE 'Added status column';
  END IF;

  -- deleted_at column (soft delete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN deleted_at timestamptz;
    RAISE NOTICE 'Added deleted_at column';
  END IF;

  -- completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN completed_at timestamptz;
    RAISE NOTICE 'Added completed_at column';
  END IF;

  -- updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added updated_at column';
  END IF;

  -- league_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'league_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN league_id uuid;
    RAISE NOTICE 'Added league_id column';
  END IF;

  -- fixture_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'fixture_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN fixture_id uuid;
    RAISE NOTICE 'Added fixture_id column';
  END IF;

  -- match_location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_location'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN match_location text;
    RAISE NOTICE 'Added match_location column';
  END IF;

  -- match_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_date'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN match_date date;
    RAISE NOTICE 'Added match_date column';
  END IF;

  -- match_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_time'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN match_time time;
    RAISE NOTICE 'Added match_time column';
  END IF;

  -- team_a_logo_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'team_a_logo_url'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN team_a_logo_url text;
    RAISE NOTICE 'Added team_a_logo_url column';
  END IF;

  -- team_b_logo_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'team_b_logo_url'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN team_b_logo_url text;
    RAISE NOTICE 'Added team_b_logo_url column';
  END IF;

  -- allow_player_stats_view column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'allow_player_stats_view'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN allow_player_stats_view boolean DEFAULT false;
    RAISE NOTICE 'Added allow_player_stats_view column';
  END IF;

  -- allow_team_scorecard_view column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'allow_team_scorecard_view'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN allow_team_scorecard_view boolean DEFAULT false;
    RAISE NOTICE 'Added allow_team_scorecard_view column';
  END IF;

END $$;

-- ============================================================
-- STEP 3: Fix overs column (CRITICAL FIX)
-- ============================================================

DO $$
BEGIN
  -- Check if overs column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'overs'
  ) THEN
    -- Column exists, ensure it has proper default and handle NOT NULL
    ALTER TABLE public.matches ALTER COLUMN overs SET DEFAULT 15;

    -- Update any existing NULL values to 15
    UPDATE public.matches SET overs = 15 WHERE overs IS NULL;

    -- Now make it NOT NULL (safe since all nulls are gone)
    ALTER TABLE public.matches ALTER COLUMN overs SET NOT NULL;

    RAISE NOTICE 'Fixed overs column: set default to 15, updated nulls, enforced NOT NULL';
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE public.matches ADD COLUMN overs integer DEFAULT 15 NOT NULL;
    RAISE NOTICE 'Created overs column with default 15';
  END IF;
END $$;

-- ============================================================
-- STEP 4: Create updated_at trigger function
-- ============================================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at ON public.matches;

-- Create trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- STEP 5: Enable Row Level Security
-- ============================================================

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can insert own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update own non-completed matches" ON public.matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON public.matches;
DROP POLICY IF EXISTS "Public can view public matches" ON public.matches;

-- Policy 1: Users can view their own matches
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own matches
CREATE POLICY "Users can insert own matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own non-completed matches
-- Completed matches are immutable
CREATE POLICY "Users can update own non-completed matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND completed_at IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
    AND completed_at IS NULL
  );

-- Policy 4: Users can delete their own matches
CREATE POLICY "Users can delete own matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 5: Public can view public matches
CREATE POLICY "Public can view public matches"
  ON public.matches FOR SELECT
  TO anon
  USING (is_public = true AND deleted_at IS NULL);

-- ============================================================
-- STEP 7: Create indexes for performance
-- ============================================================

-- Index on user_id for fast user match lookups
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);

-- Index on status for filtering by match state
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- Index on is_public for public match queries
CREATE INDEX IF NOT EXISTS idx_matches_is_public ON public.matches(is_public) WHERE is_public = true;

-- Index on created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);

-- Index on league_id for league match queries
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON public.matches(league_id) WHERE league_id IS NOT NULL;

-- Index on deleted_at for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_matches_deleted_at ON public.matches(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for common query pattern: user's active matches
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON public.matches(user_id, status) WHERE deleted_at IS NULL;

-- ============================================================
-- STEP 8: Force PostgREST schema cache reload
-- ============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================

-- Run this to verify the setup
DO $$
DECLARE
  column_count int;
  rls_enabled boolean;
  policy_count int;
  index_count int;
BEGIN
  -- Count columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'matches';

  -- Check RLS
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'matches' AND relnamespace = 'public'::regnamespace;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'matches' AND schemaname = 'public';

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'matches' AND schemaname = 'public';

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'WATCHWICKET SCOREBOX - JWKOBZ DATABASE SETUP COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Table: public.matches';
  RAISE NOTICE 'Columns: %', column_count;
  RAISE NOTICE 'RLS Enabled: %', rls_enabled;
  RAISE NOTICE 'Policies: %', policy_count;
  RAISE NOTICE 'Indexes: %', index_count;
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Status: READY FOR MATCH CREATION';
  RAISE NOTICE '============================================================';
END $$;
