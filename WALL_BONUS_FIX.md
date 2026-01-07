# Wall Bonus (W+1) Fix - Indoor Mode

## Problem
The Indoor "W+1" wall bonus button was advancing balls/overs and swapping strike, but runs stayed at 0. The striker and innings totals were not updating.

## Requirements (All Now Met)
✅ Pressing "W+1" adds +2 to innings total immediately
✅ Pressing "W+1" adds +2 to striker.runs immediately
✅ striker.balls increments by 1 (legal ball)
✅ Over/ball progression advances correctly (e.g., 5.1 → 5.2)
✅ Strike rotation behaves like 2 runs (EVEN = NO swap)
✅ Over-end swap logic still works normally

## Root Causes

### Bug 1: Runs Not Added in UI Handler
**File:** `src/tabs/LiveScore.tsx:329-332`

**Before (BROKEN):**
```typescript
} else if (pendingWallBonus) {
  display = "W+1";
}
```

The function only set the display label but never added the 2 runs to `totalRuns`. The `totalRuns` variable stayed at its initial value (0 if no runs selected), so the engine received a delivery with 0 runs.

**After (FIXED):**
```typescript
} else if (pendingWallBonus) {
  totalRuns = runs + 2; // Wall bonus: player runs + wall adds 1 = 2 total runs
  isLegal = true;
  display = "W+1";
}
```

Now `totalRuns = 2` is properly set and passed to the scoring engine.

---

### Bug 2: Incorrect Strike Rotation Logic
**File:** `src/engine/MatchEngine.ts:207-219`

**Before (BROKEN):**
```typescript
// Striker rotation: swap for odd runs (1, 3, 5) OR for Wall Bonus (physically 1 run taken despite 2 runs credited)
const shouldSwap = (runsForRotation === 1 || runsForRotation === 3 || runsForRotation === 5) || delivery.wallBonus;
```

The logic incorrectly swapped strike for W+1, based on the misconception that "physically 1 run taken" means swap strike. However:
- W+1 credits **2 runs total** to the striker
- 2 runs = EVEN number
- Cricket rule: EVEN runs = NO strike swap

**After (FIXED):**
```typescript
// Striker rotation: swap for odd runs (1, 3, 5)
// Wall Bonus (W+1) gives 2 runs = EVEN, so NO swap (strike stays)
const shouldSwap = (runsForRotation === 1 || runsForRotation === 3 || runsForRotation === 5);
```

Removed the `|| delivery.wallBonus` condition. Now W+1 is treated as a normal 2-run delivery for strike rotation purposes.

---

## How W+1 Works Now

### User Flow
1. User presses "W+1" button in Indoor mode
2. `setPendingWallBonus(true)` is called
3. User confirms the delivery
4. `confirmPendingDelivery()` sets `totalRuns = 2` and `isLegal = true`
5. `score()` function creates delivery object: `{ runs: 2, isLegal: true, wallBonus: true, display: "W+1" }`
6. `addDelivery()` in engine processes it as a normal legal 2-run delivery

### Engine Processing (MatchEngine.ts:addDelivery)
```typescript
// Add runs to innings total
inn.totalRuns += delivery.runs;  // +2

// Add runs to striker (if not a wicket)
if (newState.strikerId && !delivery.isWicket) {
  const batter = battingTeam.find(p => p.id === newState.strikerId);
  if (batter) {
    batter.runs += delivery.runs;  // +2
    batter.balls += 1;  // +1 ball faced
  }
}

// Strike rotation (2 runs = even = no swap)
const shouldSwap = (runsForRotation === 1 || runsForRotation === 3 || runsForRotation === 5);
// wallBonus removed from condition, so shouldSwap = false for 2 runs
```

### Display
- Over summary shows: "W+1"
- Scoreboard shows: striker +2 runs, team +2 runs, +1 ball
- Strike stays with same batter (no swap)

---

## Testing Regression

### Manual Test Case
**Initial state:** 0/0 (0.0 overs), Striker A on strike

**Action:** Press W+1 once

**Expected Result:**
- Team score: 2/0
- Striker A: 2 runs (1 ball)
- Overs: 0.1
- Strike: Still with Striker A (no swap)

**Action:** Press W+1 five more times (complete the over)

**Expected Result:**
- Team score: 12/0 (1.0 overs)
- Striker A: 12 runs (6 balls)
- Strike: Swaps to other batter at over-end (normal over-end rotation)

---

## Files Modified

1. **src/tabs/LiveScore.tsx**
   - `confirmPendingDelivery()` function (line 329-332)
   - Added: `totalRuns = runs + 2` when wallBonus is true

2. **src/engine/MatchEngine.ts**
   - Strike rotation logic (line 207-219)
   - Removed: `|| delivery.wallBonus` from shouldSwap condition
   - Updated comment to clarify W+1 = 2 runs = no swap

---

## Cricket Logic Summary

### Wall Bonus Rule (Indoor Cricket)
- Ball hits boundary marker/wall without bouncing
- Player physically runs 1 (crosses once)
- Umpire awards +1 bonus for hitting wall
- **Total credited: 2 runs to the striker (off the bat)**
- Treated as legal delivery (ball count increments)

### Strike Rotation Rules
- ODD runs (1, 3, 5): Batters swap strike
- EVEN runs (0, 2, 4, 6): Strike stays with same batter
- Over-end (every 6 legal balls): Always swap strike
- W+1 = 2 runs = EVEN = Strike stays

---

## Result
W+1 now correctly adds 2 runs to both striker and team total immediately, increments ball count, and keeps strike with the same batter (as 2 is an even number). All requirements met.
