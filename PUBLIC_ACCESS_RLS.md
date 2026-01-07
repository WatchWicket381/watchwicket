# Public Access RLS Configuration

## Overview
Supabase RLS policies have been configured to allow **read-only public access** to match data for anonymous users. This enables public viewing of shared matches without requiring authentication.

## Current RLS Setup

### Matches Table
**Public Access (anon role):**
- ✅ **SELECT**: Anonymous users can read matches where `is_public = true`
- ❌ **INSERT**: Not allowed (authentication required)
- ❌ **UPDATE**: Not allowed (authentication required)
- ❌ **DELETE**: Not allowed (authentication required)

**Policy Details:**
```sql
-- Anonymous users can view public matches
CREATE POLICY "Anyone can view public matches"
  ON matches FOR SELECT
  TO anon
  USING (is_public = true);

-- Authenticated users can view public matches OR their own matches
CREATE POLICY "Authenticated users can view public matches"
  ON matches FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);
```

### Data Architecture

#### Teams
- No separate teams table exists
- Team names are stored directly in the `matches` table:
  - `team_a_name` (text)
  - `team_b_name` (text)
  - `team_a_logo_url` (text, optional)
  - `team_b_logo_url` (text, optional)

#### Scores
- No separate scores table exists
- All scoring data is embedded in the `match_data` JSONB column:
  - Innings scores (runs, wickets, overs, balls)
  - Current batsmen (name, runs, balls faced)
  - Current bowler (name, overs, runs, wickets)
  - Ball-by-ball data
  - Match result

#### Player Data
- Player profiles and stats tables exist but are **NOT publicly accessible**
- Player information for public matches is stored in the `match_data` JSONB field
- This ensures privacy: users can share match scores without exposing their player roster

## Security Verification

Run this query to verify public access:
```sql
SELECT
  tablename,
  COUNT(*) FILTER (WHERE roles = '{anon}' AND cmd = 'SELECT') as anon_select_policies,
  COUNT(*) FILTER (WHERE roles = '{anon}' AND cmd IN ('INSERT', 'UPDATE', 'DELETE')) as anon_write_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'matches'
GROUP BY tablename;
```

Expected result:
- `anon_select_policies`: 1 (read access enabled)
- `anon_write_policies`: 0 (no write access)

## Public Match Sharing Flow

1. **User creates a match** (authenticated)
   - Match is private by default (`is_public = false`)
   - Only the owner can view and edit

2. **User shares the match** (authenticated)
   - Sets `is_public = true`
   - Records `shared_at` timestamp
   - Match becomes publicly viewable

3. **Anonymous users view the match**
   - Can access via public URLs (e.g., `/match/:id`)
   - Can see all match data from `match_data` JSONB field
   - Cannot modify any data
   - Cannot see the owner's player profiles or other private data

4. **User revokes sharing** (authenticated)
   - Sets `is_public = false`
   - Match becomes private again

## API Access

### Public Endpoints (No Auth Required)
```typescript
// Fetch all public matches
const { data } = await supabase
  .from('matches')
  .select('*')
  .eq('is_public', true)
  .order('updated_at', { ascending: false });

// Fetch specific public match
const { data } = await supabase
  .from('matches')
  .select('*')
  .eq('id', matchId)
  .eq('is_public', true)
  .maybeSingle();
```

### Protected Endpoints (Auth Required)
All INSERT, UPDATE, DELETE operations require authentication and ownership verification.

## Performance

Indexes have been created for optimal public query performance:
- `idx_matches_public_status`: For filtering public matches by status
- `idx_matches_public_id`: For fast public match lookup by ID

## Summary

✅ **Matches**: Public SELECT allowed for is_public=true matches
✅ **Teams**: Data embedded in matches table (public access via matches)
✅ **Scores**: Data embedded in match_data JSON (public access via matches)
❌ **No Write Access**: Anonymous users cannot INSERT/UPDATE/DELETE
❌ **Player Profiles**: Private, not accessible by anonymous users
