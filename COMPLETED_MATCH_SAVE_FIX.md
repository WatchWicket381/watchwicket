# Completed Match Save Error Fix

## Problem
Users were seeing a misleading "Sync Error / Network issue" message when trying to save completed matches. The actual issue was that completed matches are immutable (by design) but the error handling was masking the real cause.

## Root Causes

### 1. Misleading Error Messages
**Files:** `src/App.tsx:444-448, 478-485`

**Before (BROKEN):**
```typescript
if (!result.success) {
  setSyncError(
    "We couldn't save this match due to a network issue..."
  );
  return;
}
```

The code always displayed a "network issue" message for ANY save failure, even when the real issue was:
- Database trigger blocking updates to completed matches
- Permission errors
- Data validation errors

**After (FIXED):**
```typescript
if (!result.success) {
  const isNetworkError = !navigator.onLine || result.error?.includes('fetch');
  const errorMessage = isNetworkError
    ? "We couldn't save this match due to a network issue..."
    : `Save failed: ${result.error || 'Unknown error'}`;

  console.error('[handleMatchComplete] Supabase error:', result.error);
  setSyncError(errorMessage);
  return;
}
```

Now the code:
- Checks if the user is actually offline (`navigator.onLine`)
- Checks if the error is a fetch/network error
- Shows the REAL Supabase error message if it's not a network issue
- Logs the actual error to console for debugging

---

### 2. Duplicate Saves on Completed Matches
**File:** `src/store/supabaseMatches.ts:55-91`

**Problem:**
The `saveMatchToDb()` function would always attempt to save, even if the match was already completed. This triggered the database immutability trigger which blocks updates to completed matches.

**Before (BROKEN):**
```typescript
// No check if match is already completed
const matchData = {
  ...
  updated_at: new Date().toISOString(), // ALWAYS updates timestamp
  completed_at: newCompletedAt,
};

const { error } = await supabase
  .from('matches')
  .upsert(matchData, { onConflict: 'id' }); // Tries to update completed matches
```

**After (FIXED):**
```typescript
const existingMatch = await supabase
  .from('matches')
  .select('completed_at, status')
  .eq('id', matchId)
  .maybeSingle();

const existingCompletedAt = existingMatch?.data?.completed_at || null;
const existingStatus = existingMatch?.data?.status;

// IMMUTABILITY CHECK: If match is already completed, block all updates
if (existingCompletedAt || existingStatus === 'completed') {
  console.log('[saveMatchToDb] Match already completed. Blocking update to preserve immutability.');
  return { success: false, error: 'Cannot modify completed match. Match is immutable once completed.' };
}
```

Now:
- Checks if the match already has `completed_at` set
- Checks if the match status is already 'completed'
- **Returns early** with a clear error message if the match is completed
- Prevents the database trigger from being hit
- Preserves data integrity

---

### 3. Auto-Save Attempts on Completed Matches
**Multiple locations in `src/App.tsx`**

#### a) Back to Matches Handler
**Location:** `src/App.tsx:379-399`

**Before (BROKEN):**
```typescript
async function handleBackToMatches() {
  if (currentMatchId && user) {
    // ...
    try {
      await saveMatchToDb(currentMatchId, state); // Tries to save even if completed!
    } catch (err) {
      console.error('Error saving match on back:', err);
    }
  }
}
```

**After (FIXED):**
```typescript
async function handleBackToMatches() {
  if (currentMatchId && user) {
    // ...
    const isCompleted = state.status === 'completed' || state.status === 'Completed';

    if (!isCompleted) {
      try {
        await saveMatchToDb(currentMatchId, state);
      } catch (err) {
        console.error('Error saving match on back:', err);
      }
    }
  }
}
```

#### b) Discard Match Handler
**Location:** `src/App.tsx:408-434`

**Before (BROKEN):**
```typescript
async function handleDiscardMatch() {
  // No check if completed
  const abandonedState = { ...state, status: 'abandoned' as const };
  await saveMatchToDb(currentMatchId, abandonedState); // Tries to update completed match!
}
```

**After (FIXED):**
```typescript
async function handleDiscardMatch() {
  const isCompleted = state.status === 'completed' || state.status === 'Completed';

  if (isCompleted) {
    alert("Cannot discard a completed match. Completed matches are immutable.");
    return;
  }

  // ... rest of discard logic
}
```

#### c) Auto-Save Effect (Already Correct)
**Location:** `src/App.tsx:214-239`

This was already implemented correctly:
```typescript
async function autoSaveMatch() {
  if (!currentMatchId || !user) return;

  const isCompleted = state.status === 'completed' || state.status === 'Completed';

  saveMatchLocally(currentMatchId, state, user.id, false);

  if (isCompleted) {
    return; // ✅ Already blocks auto-save for completed matches
  }

  // ... save to DB
}
```

---

## Database Immutability Protection

### Trigger Function
**File:** `supabase/migrations/20251214110634_add_completed_match_protection.sql`

The database has a trigger that prevents updates to completed matches:

```sql
CREATE OR REPLACE FUNCTION prevent_completed_match_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Block updates if OLD status is completed or completed_at is set
  IF OLD.status = 'completed' OR OLD.completed_at IS NOT NULL THEN
    -- Allow only visibility toggles, block everything else
    RAISE EXCEPTION 'Cannot modify completed match. Match is immutable once completed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This trigger:
- Blocks all updates to matches where `status = 'completed'` OR `completed_at IS NOT NULL`
- Only allows visibility setting changes (`allow_player_stats_view`, `allow_team_scorecard_view`)
- Raises an exception with a clear error message
- Ensures completed matches remain immutable for data integrity

---

## How Completed Match Saves Work Now

### First Save (Transition to Completed)
1. User completes a match (last wicket falls or overs expire)
2. `handleMatchComplete()` is called
3. Sets `state.status = 'Completed'`
4. Calls `saveMatchToDb(matchId, completedState)`
5. `saveMatchToDb()` checks if match already completed → **NO**
6. Sets `completed_at = new Date().toISOString()`
7. Upserts to database → **SUCCESS**
8. Match is now immutable in database

### Subsequent Save Attempts (Blocked)
1. User navigates back or app tries to auto-save
2. Code checks: `isCompleted = state.status === 'completed'`
3. If completed → **SKIP SAVE** (no network call)
4. If somehow save is attempted:
   - `saveMatchToDb()` checks existing match
   - Sees `completed_at` is already set
   - Returns early: `{ success: false, error: 'Cannot modify completed match...' }`
   - Error is displayed: **"Save failed: Cannot modify completed match. Match is immutable once completed."**
   - NOT displayed as "network issue"

### Viewing Completed Matches
1. User opens a completed match from history
2. Match data is loaded from database (READ operation)
3. No save attempts are made (auto-save checks status and skips)
4. User can view all data but cannot modify
5. **No errors shown** because no save is attempted

---

## Error Message Flow

### Network Error (Real)
```
User offline (navigator.onLine = false)
↓
Save attempt fails
↓
Error: "fetch failed" or similar
↓
Display: "We couldn't save this match due to a network issue..."
```

### Supabase Error (e.g., completed match)
```
User online (navigator.onLine = true)
↓
Save attempt to completed match
↓
saveMatchToDb() checks existing match → completed
↓
Returns: { success: false, error: 'Cannot modify completed match...' }
↓
Display: "Save failed: Cannot modify completed match. Match is immutable once completed."
```

### Other Supabase Errors
```
User online
↓
Save attempt fails (permissions, validation, etc.)
↓
Returns: { success: false, error: 'RLS policy violation' }
↓
Display: "Save failed: RLS policy violation"
↓
Console: Full error details logged
```

---

## Files Modified

1. **src/App.tsx**
   - `handleMatchComplete()` - Show actual Supabase errors
   - `handleBackToMatches()` - Skip save if completed
   - `handleDiscardMatch()` - Block discard if completed
   - Error handling in catch blocks - Distinguish network vs Supabase errors

2. **src/store/supabaseMatches.ts**
   - `saveMatchToDb()` - Check if match already completed before attempting update
   - Return early with clear error message if immutability check fails

---

## Testing Checklist

### ✅ Test Case 1: Complete a New Match
1. Start a new match
2. Play through to completion
3. Tap "Complete Match"
4. **Expected:** Match saves successfully, no errors
5. **Expected:** `completed_at` timestamp is set
6. **Expected:** Navigate back to matches list

### ✅ Test Case 2: View a Completed Match
1. Open a completed match from history
2. View scorecard, summary, etc.
3. Navigate back to matches
4. **Expected:** No save attempts
5. **Expected:** No errors shown

### ✅ Test Case 3: Try to Discard Completed Match
1. Open a completed match
2. Try to discard it
3. **Expected:** Alert: "Cannot discard a completed match. Completed matches are immutable."
4. **Expected:** Match is NOT discarded

### ✅ Test Case 4: Real Network Error
1. Turn off wifi/data
2. Start a new match
3. Try to complete it
4. **Expected:** Error: "We couldn't save this match due to a network issue..."
5. Turn wifi back on
6. **Expected:** Can retry save successfully

### ✅ Test Case 5: Attempt Double-Complete
1. Complete a match (first save succeeds)
2. App tries to save again (shouldn't happen, but if it does)
3. **Expected:** Error: "Save failed: Cannot modify completed match..."
4. **Expected:** NOT shown as "network issue"

---

## Result

Completed matches now:
- ✅ Save once and only once when transitioning to completed status
- ✅ Block all further save attempts with clear error messages
- ✅ Show actual Supabase errors instead of generic "network issue"
- ✅ Preserve data integrity through immutability
- ✅ Can be viewed without triggering save attempts
- ✅ Cannot be discarded or modified after completion
- ✅ Distinguish real network errors from database constraint errors

Build passed successfully.
