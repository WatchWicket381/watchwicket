# Scoring Bug Fix - Runs Not Registering

## Problem
Deliveries were registering (balls/overs updating) but runs were NOT being added to:
- Batter's runs and balls
- Innings total runs
- Team total score

The UI remained stuck at 0 runs despite clicking scoring buttons.

## Root Cause
The `addDelivery()` function in `src/engine/MatchEngine.ts` was **directly mutating the state object** instead of creating a new immutable copy. This is a critical React anti-pattern:

### Before (BROKEN):
```typescript
export function addDelivery(state: MatchState, delivery: Delivery): MatchState {
  // Directly mutating the original state
  state.hasActivity = true;
  const inn = currentInning(state);
  inn.totalRuns += delivery.runs;  // ❌ Mutation!

  // ... more mutations ...

  return { ...state };  // ❌ Shallow copy after mutations
}
```

**Why this broke:**
1. The function received `state` and mutated it directly
2. Even though `return { ...state }` creates a shallow copy, it happens AFTER all mutations
3. The shallow copy still references the same nested arrays/objects
4. React compares references - sees the same object reference = no re-render
5. Values changed in memory but UI never updated

## Solution
Create a **deep copy** at the START of the function, mutate the copy, then return it:

### After (FIXED):
```typescript
export function addDelivery(state: MatchState, delivery: Delivery): MatchState {
  if (!state.strikerId || !state.nonStrikerId || !state.bowlerId) {
    return state;
  }

  // ✅ Deep copy first!
  const newState = JSON.parse(JSON.stringify(state));
  newState.hasActivity = true;

  const inn = currentInning(newState);
  inn.totalRuns += delivery.runs;  // ✅ Mutating the copy

  // ... all mutations now on newState ...

  newState.updatedAt = new Date().toISOString();
  return newState;  // ✅ Return the new state object
}
```

## Also Fixed
- `setNextBatter()` - now creates deep copy
- `setNextBowler()` - now creates deep copy

## Testing Checklist
✅ Dot ball (0 runs) - adds ball but not runs
✅ Singles (1, 2, 3 runs) - runs update for striker and team total
✅ Boundaries (4, 6) - runs and boundaries count
✅ Extras (wides, no-balls) - runs added to total, not batter
✅ Wickets - -3 runs in Indoor mode, normal in other modes
✅ Striker rotation - works correctly on odd runs
✅ Over completion - striker swaps at over end
✅ Current run rate (CRR) - calculates correctly
✅ Required run rate (RRR) - updates based on runs
✅ Projections - update with current scoring rate

## Performance Note
Using `JSON.parse(JSON.stringify(state))` is acceptable here because:
1. Cricket scoring is not high-frequency (human clicking speed)
2. State object is relatively small (2 teams, match data)
3. Correctness is more important than micro-optimization
4. This ensures complete immutability without manual cloning

## Result
Runs now correctly update immediately on screen for:
- Striker runs and balls faced
- Team total runs
- All derived stats (CRR, RRR, projections)
- React properly detects state changes and re-renders UI
