# Public Match Page - Full Scorecard Implementation

## Summary

Added complete batting and bowling scorecards to the public match page, fixing the ghost innings issue and providing a comprehensive view of match data.

## Files Changed/Created

### New File Created
1. **`src/utils/publicScorecardAdapter.ts`**
   - Adapter functions to extract and normalize scorecard data
   - Functions:
     - `getActiveInnings()` - Filters out ghost/duplicate innings
     - `getBattingRows()` - Extracts batting data with proper formatting
     - `getBowlingRows()` - Computes bowling figures from deliveries
     - `getRunsPerOver()` - Extracts run rate data for graphing
     - `hasActivityInInnings()` - Checks if innings has real activity

### Modified Files

2. **`src/store/supabaseMatches.ts`**
   - Updated `getPublicMatchById()` return object
   - Added `matchData` field containing raw match_data from database
   - Provides full innings, players, and delivery data for scorecard display

3. **`src/pages/PublicMatchPage.tsx`**
   - Added imports for adapter functions and utilities
   - Extended `MatchData` interface to include optional `matchData` field
   - Added DEV-only logging to inspect data shape (logs once on mount)
   - Fixed ghost innings display by using `getActiveInnings()` adapter
   - Created `InningsScorecardSection` component (collapsible accordion)
   - Created `ScorecardSections` wrapper component
   - Added full scorecard rendering below "Last 6 Balls" section
   - Scorecard shows for both live and completed matches

## Ghost Innings Fix

**Problem**: Duplicate team cards appearing (Team B showing twice)

**Solution**: `getActiveInnings()` function filters innings by:
1. Checking for real activity (deliveries > 0 OR totalRuns > 0 OR wickets > 0)
2. Removing duplicates by ensuring each batting team appears only once
3. Taking the first occurrence of each team with activity

**Logic**:
```typescript
const firstIndexOfTeam = matchData.innings.findIndex(
  (i: any) => i.battingTeam === inn.battingTeam && hasActivityInInnings(i)
);
return hasActivity && firstIndexOfTeam === index;
```

## Features Implemented

### 1. Data Inspection (DEV Mode)
- Logs match data structure once on component mount
- Shows available keys, innings count, player arrays
- Helps diagnose data issues during development
- Only runs in DEV mode (`import.meta.env.DEV`)

### 2. Batting Scorecard
- Columns: Batter, R, B, 4s, 6s, SR (tablet+), How Out (desktop+)
- Shows captain (C) and wicketkeeper (WK) indicators
- Formats dismissals properly (e.g., "c Smith b Jones", "lbw b Khan")
- Strike rate calculated as (runs/balls * 100)
- Horizontally scrollable on mobile
- Bold names, clear numbers

### 3. Bowling Figures
- Columns: Bowler, O, R, W, Econ (tablet+), Wd (desktop+), Nb (desktop+)
- Computed from ball-by-ball deliveries
- Overs formatted as "X.Y" (e.g., "5.3")
- Economy calculated as runs per over
- Sorted by wickets (desc), then economy (asc)
- Shows captain/keeper indicators

### 4. Runs Per Over Graph
- Simple CSS bar chart (no heavy dependencies)
- Shows run rate visualization
- Horizontally scrollable
- Only displays if over data exists
- Color gradient bars (green)

### 5. Collapsible Design
- Each innings in its own accordion section
- Header shows: Team name, Score (runs/wickets), Overs
- Click to expand/collapse
- Chevron icon indicates state
- Mobile-first approach (collapsed by default)

### 6. Empty States
- Friendly message if no innings started
- "No batting data yet" if players haven't batted
- "No bowling figures yet" if no deliveries bowled
- Doesn't crash on missing data

## Data Adapter Strategy

The adapter functions handle various data shapes:

1. **Primary Source**: Player objects in `teamAPlayers` and `teamBPlayers`
   - Batting stats: runs, balls, fours, sixes from player.runs, player.balls, etc.
   - Dismissal info: player.dismissal and player.dismissalDetails

2. **Bowling Computation**: Aggregated from `innings.deliveries[]`
   - Loop through all deliveries
   - Track balls, runs, wickets per bowler
   - Calculate overs and economy rate

3. **Fallback**: Returns empty arrays if data not available
   - UI shows empty state message
   - No crashes or errors

## Responsive Design

- **Mobile**: Essential columns only (Name, R, B, 4s, 6s, O, R, W)
- **Tablet**: Add SR and Econ columns
- **Desktop**: Add How Out, Wd, Nb columns
- Horizontal scroll for tables on small screens
- Touch-friendly tap targets
- Adequate spacing between sections

## Testing Verification

✅ Build successful (no TypeScript errors)
✅ Data adapter handles missing data gracefully
✅ Ghost innings issue resolved with `getActiveInnings()`
✅ Collapsible accordions work
✅ Tables are horizontally scrollable
✅ Empty states display correctly
✅ Both live and completed matches show scorecards
✅ DEV logging implemented with one-time guard

## What Shows Now

Public match page displays:
1. Match header (teams, status, format)
2. Innings summary cards (no duplicates)
3. Match result (if completed)
4. Current batsmen (if live)
5. Current bowler (if live)
6. Last 6 balls (if live)
7. **NEW**: Full batting scorecard for each innings
8. **NEW**: Full bowling figures for each innings
9. **NEW**: Runs per over graph (if data exists)

## Next Steps (Optional Future Enhancements)

- Add maiden overs calculation to bowling figures
- Add fall of wickets timeline
- Add partnership information
- Add player photos if available
- Add download/share scorecard feature
- Add filters (sort by runs, strike rate, etc.)
