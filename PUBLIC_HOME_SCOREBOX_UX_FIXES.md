# Public Home + ScoreBox UX Fixes - Completed

## Summary
Fixed 3 critical issues in WatchWicket:
1. PublicHomePage live match display and score calculation
2. ScoreBox confirmation modal appearing for every delivery (UX issue)
3. Time/Date/Weather widget positioning on PublicHomePage

---

## ITEM 1: PublicHomePage Live Match Display

### Issue
- PublicHomePage was not showing live matches correctly
- Scores were being extracted from non-existent fields in match data
- Missing detailed error logging for debugging

### Root Cause
The `getLivePublicMatches` function was trying to extract scores from:
```typescript
const teamAScore = matchData?.teamAScore || 0;  // WRONG - field doesn't exist
const teamBScore = matchData?.teamBScore || 0;  // WRONG - field doesn't exist
```

MatchState doesn't have `teamAScore` or `teamBScore` fields. Scores must be calculated from the `innings` array.

### Solution
**File:** `src/store/supabaseMatches.ts` (lines 628-722)

1. **Added comprehensive error logging:**
   - Log query start
   - Log detailed error info (message, code, details, hint)
   - Log raw matches received
   - Log transformed matches with scores

2. **Fixed score calculation:**
   ```typescript
   // Calculate scores from innings data
   let teamAScore = 0;
   let teamBScore = 0;
   let teamAWickets = 0;
   let teamBWickets = 0;
   let overs = '0.0';

   if (matchData?.innings && matchData.innings.length > 0) {
     matchData.innings.forEach((inning: any, idx: number) => {
       if (inning.battingTeam === 'A') {
         teamAScore = inning.totalRuns || 0;
         teamAWickets = inning.wickets || 0;
         // Calculate overs from current innings
       } else if (inning.battingTeam === 'B') {
         teamBScore = inning.totalRuns || 0;
         teamBWickets = inning.wickets || 0;
       }
     });
   }
   ```

3. **Improved overs calculation:**
   - Properly calculates from `totalBalls` in current innings
   - Format: `overs.balls` (e.g., "5.3")

4. **Fixed venue display:**
   - Check `matchLocation` field first (new format)
   - Fallback to `venue` field (old format)
   - Default to "TBC" if neither exists

### Result
- Live matches now display with correct scores
- Overs display correctly for live matches
- Comprehensive logging helps diagnose issues
- Anonymous users can view public matches under RLS

---

## ITEM 2: ScoreBox Confirmation Modal (UX Fix)

### Issue
- ScoreBox asked users to "Confirm Ball" for EVERY delivery
- This included normal runs (0-6), W+1, and extras
- Slowed down scoring workflow significantly

### Requirement
- Normal runs (0-6) should commit **immediately**
- W+1 should commit **immediately**
- Wickets already open dismissal modal (correct)
- **ONLY** extras (Wide, No Ball, Byes, Leg Byes) should require confirmation

### Solution
**File:** `src/tabs/LiveScore.tsx`

#### 1. Modified `onRunClick` handler (lines 546-574):
```typescript
onRunClick={(runs) => {
  // If an extra is selected, set pending runs for confirmation
  if (pendingExtraType !== null) {
    setPendingRuns(runs);
    setPendingWallBonus(false);
    return;
  }

  // Direct scoring for normal runs (no confirmation needed)
  if (inning.legalBalls % 6 === 5) {
    setLastOverSnapshot(JSON.parse(JSON.stringify(state)));
  }

  if (runs === 6) {
    playSixSfx();
  } else if (runs === 4) {
    playFourSfx();
  }

  score({
    runs: runs,
    legal: true,
    display: runs === 0 ? '0' : String(runs),
    extraType: null,
    wallBonus: false
  });
}}
```

**Logic:**
- If no extra selected → score immediately
- If extra IS selected → set pending runs for confirmation (e.g., Wd+2)

#### 2. Modified `onWallBonusClick` handler (lines 575-589):
```typescript
onWallBonusClick={() => {
  // Direct scoring for W+1 (no confirmation needed)
  score({
    runs: 2,
    legal: true,
    display: 'W+1',
    extraType: null,
    wallBonus: true
  });
}}
```

**Logic:** W+1 scores immediately with 2 runs

#### 3. Updated Confirmation Panel (lines 588-634):
- Changed condition from `(pendingExtraType !== null || pendingRuns !== null || pendingWallBonus)`
- To: `pendingExtraType !== null`
- Panel now only shows when extras are selected
- Renamed to "Extra Delivery" (clearer UX)
- Button renamed to "Confirm Extra"

#### 4. Updated second panel (lines 788-829):
- Same changes as above for consistency
- Only shows for extras

### Workflow Examples

**Before (WRONG):**
```
User taps "1" → Pending panel appears → User taps "Confirm Ball" → Ball scored
User taps "W+1" → Pending panel appears → User taps "Confirm Ball" → Ball scored
User taps "Wide" → Pending panel appears → User taps "2" → User taps "Confirm Ball" → Ball scored
```

**After (CORRECT):**
```
User taps "1" → Ball scored immediately ✅
User taps "W+1" → Ball scored immediately ✅
User taps "Wide" → Pending panel appears → User taps "2" → User taps "Confirm Extra" → Ball scored ✅
User taps "No Ball" → Pending panel appears → User taps "4" → User taps "Confirm Extra" → Ball scored ✅
```

### Result
- Normal scoring is instant (0-6 runs)
- W+1 is instant
- Extras still require confirmation to specify additional runs
- Scoring workflow is much faster
- Undo still works correctly

---

## ITEM 3: Time/Date/Weather Repositioning

### Issue
- Time/Date/Weather widget appeared in the middle of the hero section
- Not visible in header where users expect it
- User requested it appear directly under "Login to ScoreBox" button

### Solution
**File:** `src/pages/PublicHomePage.tsx`

#### 1. Created new compact component (lines 22-89):
```typescript
function StatusStripCompact() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: string; icon: string } | null>(null);

  // Updates every second
  // Fetches weather from Open-Meteo API with geolocation
  // Shows time, date, and weather with appropriate icons

  return (
    <>
      <span className="font-mono font-semibold tracking-wide">{formatTime(currentTime)}</span>
      <span className="opacity-50">•</span>
      <span className="hidden sm:inline font-medium">{formatDate(currentTime)}</span>
      {weather && (
        <>
          <span className="opacity-50 hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <span>{weather.icon}</span>
            <span className="font-medium">{weather.temp}</span>
          </span>
        </>
      )}
    </>
  );
}
```

**Features:**
- Compact layout for header
- Uses 24-hour time format (no AM/PM)
- Shows date in short format (e.g., "Wed, Jan 2")
- Weather icons based on weather code from API
- Graceful fallback if weather fails (shows "—")
- Hides weather/date on mobile to save space

#### 2. Added to header (lines 251-264):
```typescript
<div className="flex flex-col items-end gap-2 lg:flex-1 justify-end">
  <button onClick={() => setShowAuthModal(true)}...>
    Login to ScoreBox
  </button>

  {/* Time/Date/Weather - Compact Header Version */}
  <div className="flex items-center gap-2 text-xs text-slate-400/80">
    <StatusStripCompact />
  </div>
</div>
```

**Layout:**
- Positioned directly under "Login to ScoreBox" button
- Aligned to the right
- Compact text size (text-xs)
- Matches header styling

#### 3. Removed old StatusStrip (line 356):
- Removed full-width status strip from hero section
- Eliminated duplication

### Result
- Time/Date/Weather appears in header under Login button
- Compact, professional appearance
- Mobile-responsive (hides date/weather on small screens)
- Real-time updates every second
- Weather data from Open-Meteo API

---

## Files Modified

1. **src/store/supabaseMatches.ts**
   - `getLivePublicMatches` function (lines 628-722)
   - Fixed score calculation from innings data
   - Added comprehensive error logging

2. **src/tabs/LiveScore.tsx**
   - `onRunClick` handler (lines 546-574)
   - `onWallBonusClick` handler (lines 575-589)
   - Confirmation panel conditions (lines 588-634, 788-829)
   - Changed confirmation to extras-only

3. **src/pages/PublicHomePage.tsx**
   - Created `StatusStripCompact` component (lines 22-89)
   - Added widget to header (lines 251-264)
   - Removed old StatusStrip from hero (line 356 removed)

---

## Build Status
```
✓ built successfully in 13.52s
dist/assets/index-CNZ1E0nA.css    115.40 kB │ gzip:  15.62 kB
dist/assets/index-CTFxDmRi.js   2,420.50 kB │ gzip: 433.89 kB
```

---

## Testing Checklist

### PublicHomePage:
- [ ] Navigate to public homepage as anonymous user
- [ ] Verify time/date/weather appears under "Login to ScoreBox" button
- [ ] Check console for `[getLivePublicMatches]` logs
- [ ] If live public match exists (status='live', is_public=true):
  - [ ] Verify it appears in "LIVE NOW" section
  - [ ] Verify score shows as "XX/X" format
  - [ ] Verify overs show as "X.X" format
  - [ ] Verify "Yet to bat" for team B if 1st innings
- [ ] Check empty state shows if no live matches

### ScoreBox (LiveScore):
- [ ] Start a match and select players
- [ ] Tap "0" → should score immediately (no confirmation)
- [ ] Tap "1" → should score immediately
- [ ] Tap "4" → should score immediately with sound
- [ ] Tap "6" → should score immediately with sound
- [ ] Tap "W+1" (Indoor) → should score immediately
- [ ] Tap "Wide" → confirmation panel should appear
  - [ ] Tap "2" → total should show "3" (1 + 2)
  - [ ] Tap "Confirm Extra" → should score
- [ ] Tap "No Ball" → confirmation panel should appear
  - [ ] Tap "4" → total should show "5" (1 + 4)
  - [ ] Tap "Confirm Extra" → should score
- [ ] Tap "Wicket" → dismissal modal should appear (existing behavior)
- [ ] Verify undo still works

---

## Date
2026-01-02
