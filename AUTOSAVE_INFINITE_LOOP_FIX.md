# Autosave Infinite Loop Fix - Complete

## Problem
The Live Scoring page was spamming the console with:
```
[saveMatchToDb] Attempting to upsert match...
[saveMatchToDb] Successfully saved match...
```

This was caused by an infinite loop in the autosave `useEffect` that was re-triggering on every state change.

## Root Cause
The autosave `useEffect` had the entire `state` object in its dependency array:

```typescript
useEffect(() => {
  autoSaveMatch();
}, [state, currentMatchId, user]); // ❌ state object causes infinite loop!
```

### Why This Caused an Infinite Loop:
1. Any state change → triggers useEffect
2. useEffect calls `saveMatchToDb()`
3. Save updates `state.updatedAt` timestamp
4. Updated timestamp → triggers useEffect again
5. Loop continues infinitely

## Solution Applied

### 1. **Added Refs for Tracking** (`src/App.tsx` line ~111)
```typescript
// Refs for autosave logic
const isInitialLoadRef = useRef(true); // Prevent autosave during initial load
const lastSavedKeyRef = useRef<string | null>(null); // Track last saved state
```

### 2. **Created Stable Save Key with useMemo** (line ~232-276)
Instead of depending on the entire state object, we create a stable "save key" that only changes when meaningful fields change:

```typescript
const saveKey = useMemo(() => {
  if (!currentMatchId) return null;

  const deliveriesHash = state.innings.map(i => i.deliveries.length).join(',');
  const playersHash = `${state.teamAPlayers.length}-${state.teamBPlayers.length}`;

  // Only include fields that matter for autosave
  return JSON.stringify({
    matchId: currentMatchId,
    status: state.status,
    format: state.format,
    teamAName: state.teamAName,
    teamBName: state.teamBName,
    oversLimit: state.oversLimit,
    currentInning: state.currentInning,
    currentBatsman: state.currentBatsman,
    currentBowler: state.currentBowler,
    deliveriesHash,
    playersHash,
    teamAScore: state.teamAScore,
    teamBScore: state.teamBScore,
    teamAWickets: state.teamAWickets,
    teamBWickets: state.teamBWickets,
    tossWinner: state.toss?.winnerTeam || null,
  });
}, [/* specific dependencies only */]);
```

**Key Benefits:**
- Only changes when actual meaningful data changes
- Ignores `updatedAt` timestamp changes
- Ignores transient UI state changes
- Creates stable reference for comparison

### 3. **Enhanced useEffect with Guards** (line ~278-327)
```typescript
useEffect(() => {
  if (!currentMatchId || !user) return;

  const isCompleted = state.status === 'completed' || state.status === 'Completed';
  const isDraft = state.status === 'draft' || !state.status;

  // Always save locally immediately
  saveMatchLocally(currentMatchId, state, user.id, false);

  // Don't auto-sync completed or draft matches
  if (isCompleted || isDraft) {
    isInitialLoadRef.current = false;
    return;
  }

  // GUARD 1: Skip during initial load (prevents overwriting DB)
  if (isInitialLoadRef.current) {
    console.log('[App] Skipping autosave during initial load');
    isInitialLoadRef.current = false;
    lastSavedKeyRef.current = saveKey;
    return;
  }

  // GUARD 2: Skip if nothing changed
  if (saveKey === lastSavedKeyRef.current) {
    return;
  }

  // GUARD 3: Debounce - wait 1 second after last change
  const saveTimeout = setTimeout(async () => {
    // GUARD 4: Double-check during debounce
    if (saveKey === lastSavedKeyRef.current) {
      return;
    }

    try {
      console.log('[App] 💾 Autosave triggered for match:', currentMatchId);
      const result = await saveMatchToDb(currentMatchId, state);
      if (result.success) {
        lastSavedKeyRef.current = saveKey; // Mark as saved
        markMatchAsSynced(currentMatchId);
        setSyncError(null);
      }
    } catch (err) {
      console.error('[App] Auto-save error:', err);
      markMatchAsUnsynced(currentMatchId);
    }
  }, 1000); // 1 second debounce

  return () => clearTimeout(saveTimeout);
}, [saveKey, currentMatchId, user, state]);
```

### 4. **Reset Guards on Match Load/Create** (lines ~425, ~389, ~415)
Ensures autosave guards are reset when loading or creating matches:

```typescript
// In handleResumeMatch (loading existing match)
isInitialLoadRef.current = true;
lastSavedKeyRef.current = null;

// In handleStartNow (creating new match)
isInitialLoadRef.current = true;
lastSavedKeyRef.current = null;

// In handleSchedule (creating scheduled match)
isInitialLoadRef.current = true;
lastSavedKeyRef.current = null;
```

## Four-Layer Protection

### Layer 1: Initial Load Guard
```typescript
if (isInitialLoadRef.current) {
  console.log('[App] Skipping autosave during initial load');
  isInitialLoadRef.current = false;
  lastSavedKeyRef.current = saveKey;
  return;
}
```
**Prevents:** Overwriting database values with default state during initial render

### Layer 2: Change Detection
```typescript
if (saveKey === lastSavedKeyRef.current) {
  return;
}
```
**Prevents:** Saving when nothing actually changed

### Layer 3: Debouncing
```typescript
const saveTimeout = setTimeout(async () => {
  // save logic
}, 1000);
```
**Prevents:** Rapid-fire saves during continuous user actions

### Layer 4: Double-Check During Debounce
```typescript
if (saveKey === lastSavedKeyRef.current) {
  return;
}
```
**Prevents:** Saving if the state was already saved while waiting

## What Gets Saved

Setup fields are preserved correctly on every save:
- ✅ `team_a_name` - Team names preserved
- ✅ `team_b_name` - Team names preserved
- ✅ `overs` - Overs limit preserved
- ✅ `format` / `match_type` - Format preserved
- ✅ `team_a_logo_url` / `team_b_logo_url` - Logos preserved

Scoring fields updated on every autosave:
- ✅ `status` - Match status
- ✅ `has_activity` - Whether match has started
- ✅ `legal_balls` - Count of legal deliveries
- ✅ Scores, wickets, current players, etc.

## Console Output

### Before Fix:
```
[saveMatchToDb] Attempting to upsert match...
[saveMatchToDb] Successfully saved match...
[saveMatchToDb] Attempting to upsert match...
[saveMatchToDb] Successfully saved match...
[saveMatchToDb] Attempting to upsert match...
[saveMatchToDb] Successfully saved match...
... (repeats infinitely)
```

### After Fix:
```
[App] Skipping autosave during initial load
[App] 💾 Autosave triggered for match: abc-123
[saveMatchToDb] Attempting to upsert match...
[saveMatchToDb] Successfully saved match...
... (only when actual scoring actions occur)
```

## Testing Checklist

After deploying, verify:

- [ ] **No console spam** - Console should be quiet after initial load
- [ ] **Network tab quiet** - No repeated POST requests to matches table
- [ ] **Setup preserved** - Team names and overs stay correct after saving
- [ ] **Scoring works** - Autosave triggers after runs/wickets
- [ ] **Debouncing works** - Rapid scoring doesn't spam saves (max 1 save per second)
- [ ] **Load works** - Resuming a match loads correct data without immediate resave
- [ ] **New match works** - Creating a new match doesn't spam saves

## Expected Behavior

1. **Creating a new match:** No autosave initially (draft status)
2. **Starting match (toss/first ball):** Changes to "live", autosave activates
3. **During scoring:** Autosave debounces (1 second after last action)
4. **Completing match:** Final save, then autosave stops (completed status)
5. **Resuming match:** Loads data, skips initial autosave, then normal autosave

## Performance Impact

### Before:
- ∞ saves per second (infinite loop)
- Heavy network usage
- Potential database overload
- Risk of data corruption

### After:
- 0-1 saves per second (debounced)
- Minimal network usage
- Database friendly
- Data integrity preserved

## Build Status
✅ Build successful
✅ No TypeScript errors
✅ Ready for deployment

## Monitoring

After deployment, monitor browser console for:
1. `[App] 💾 Autosave triggered` - Should only appear when scoring
2. No repeated saves for same matchId
3. No console errors related to autosave

If issues persist, check:
- Browser console for error messages
- Network tab for repeated requests
- Match state in local storage vs database
