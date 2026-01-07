# TeamSheet Isolation Test - React Error #300

## PHASE 1 COMPLETE: Component Location + Usage Verified

**TeamSheet File:** `src/tabs/TeamSheet.tsx`

**Usage in App.tsx (Lines 914-923):**
```tsx
{tab === "teams" && (
  <TeamSheet
    state={state}
    setState={setState}
    isPro={isPro}
    onDiscardMatch={handleDiscardMatch}
    onSaveSetup={handleSaveSetup}
    onStartMatch={handleStartMatch}
    matchId={currentMatchId}
  />
)}
```

✅ **Confirmed:** TeamSheet is rendered as JSX (`<TeamSheet .../>`), NOT called as a function.

---

## PHASE 2 COMPLETE: Hard Isolation Applied

**Minimal TeamSheet Created:** `src/tabs/TeamSheet.tsx`

### What Was Changed:

The entire TeamSheet component body was replaced with a minimal, hook-safe version:

**Features of Minimal Version:**
1. ✅ Only imports React once: `import React, { useState, useEffect, useMemo } from "react"`
2. ✅ ALL hooks at top level (no conditions, no nested functions)
3. ✅ Simple UI: "TeamSheet Debug Mode" with "Open Squad Picker" button
4. ✅ Safe modal with player list using safe fallbacks
5. ✅ NO filtering logic that mutates state
6. ✅ NO derived setState
7. ✅ NO complex effects
8. ✅ NO portals
9. ✅ useMemo for derived data only (no state updates)

**Hooks Used (All Top-Level):**
```tsx
const [showSquadPicker, setShowSquadPicker] = useState(false);
const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  // Load profiles once on mount
}, []);

const safeProfiles = useMemo(() => {
  // Derive safe array (no state updates)
}, [profiles]);
```

**Debug Logging:**
```tsx
console.log("TeamSheet Debug Mode Render", {
  showSquadPicker,
  profilesCount: safeProfiles.length,
  isLoading
});
```

**Build Status:**
```
✓ 561 modules transformed
dist/assets/index-DavO88Jo.js   2,222.95 kB │ gzip: 398.12 kB
✓ built in 10.83s
```

---

## PHASE 3: Dependency Analysis

**React Version Check:**

**package.json:**
- `react`: `^19.2.0`
- `react-dom`: `^19.2.0`

**package-lock.json:**
- `node_modules/react`: `19.2.0`
- `node_modules/react-dom`: `19.2.0`
- Only **5 occurrences** of "react" in package-lock (single instance)

✅ **Confirmed:** NO duplicate React instances
✅ **Confirmed:** react and react-dom versions match (19.2.0)
✅ **Confirmed:** NO dependencies bundle their own React

---

## EXPECTED RESULTS

### If Minimal TeamSheet WORKS (No Error #300):

**Conclusion:** The original TeamSheet code has a hooks violation (**Scenario B**)

**Next Steps:**
1. Test minimal TeamSheet in browser
2. If it works, incrementally restore original features:
   - **Block 1:** Team Name inputs
   - **Block 2:** Logo upload controls
   - **Block 3:** Overs and Squad size editors
   - **Block 4:** Full player picker with filtering
   - **Block 5:** Player management (add/remove/captain/keeper)
3. After each block, test "Open Squad Picker"
4. The block that reintroduces the crash contains the violation
5. Fix by:
   - Removing setState during render
   - Removing conditional hooks
   - Replacing derived state with useMemo

### If Minimal TeamSheet STILL CRASHES (Error #300 Persists):

**Conclusion:** Duplicate React instance or invalid hook dispatcher (**Scenario A**)

**Next Steps:**
1. Check for aliased React imports
2. Check if any dependency is bundling React internally
3. Add to vite.config.ts:
   ```ts
   export default defineConfig({
     resolve: {
       dedupe: ['react', 'react-dom']
     }
   })
   ```
4. Run `npm dedupe`
5. Delete `node_modules` and `package-lock.json`
6. Run `npm install`
7. Rebuild

---

## TESTING INSTRUCTIONS

### Step 1: Test Minimal TeamSheet

1. Start the dev server (already running)
2. Open the app in browser
3. Navigate to a match
4. Click "Teams" tab
5. You should see "TeamSheet Debug Mode" header
6. Click "Open Squad Picker" button
7. Check browser console for:
   - ✅ "TeamSheet Debug Mode Render" log
   - ✅ Modal opens successfully
   - ✅ Player list displays
   - ❌ NO React Error #300

### Step 2: Check Console Output

**Expected Console Log:**
```
TeamSheet Debug Mode Render {
  showSquadPicker: false,
  profilesCount: X,
  isLoading: false
}
```

**When Opening Modal:**
```
TeamSheet Debug Mode Render {
  showSquadPicker: true,
  profilesCount: X,
  isLoading: false
}
```

### Step 3: Interpret Results

**If Modal Opens Without Error #300:**
→ Original code has hooks violation (proceed with incremental restoration)

**If Error #300 Still Occurs:**
→ Duplicate React instance issue (proceed with deduplication)

---

## WHAT'S DIFFERENT FROM ORIGINAL

### Original TeamSheet Issues (Likely Causes):

1. **`React.useRef` inside `renderTeam()` function** (Line 382 in original)
   - Hook called in nested function
   - Violated Rules of Hooks
   - Already attempted fix: moved refs to top level

2. **Possible setState during render** (needs verification)
   - Conditional logic that might update state during render
   - Derived state calculations that trigger updates

3. **Complex filtering logic** (Lines 630-660 in original)
   - Multiple useMemo chains
   - Derived arrays based on state

4. **PlayerSelectorErrorBoundary wrapper** (Line 947 in original)
   - Error boundary around modal
   - Could be interfering with React's hook tracking

### Minimal Version Solutions:

1. ✅ All hooks at top level
2. ✅ No setState during render
3. ✅ Simple useMemo for safe derived data
4. ✅ No error boundaries inside component
5. ✅ Direct rendering without complex wrappers

---

## CURRENT STATUS

**File:** `src/tabs/TeamSheet.tsx`

**State:** ✅ Minimal isolated version deployed

**Build:** ✅ Successful (2,222.95 kB)

**Dependencies:** ✅ Single React instance (19.2.0)

**Next Action:** 🧪 **USER TESTING REQUIRED**

---

## IF MINIMAL VERSION WORKS

The user should report back which scenario applies. If the minimal version works, we can begin incrementally restoring features to identify the exact line/block causing the issue.

**Restoration Order (Incremental Testing):**

1. Add team name inputs
2. Add logo upload controls
3. Add overs/squad size editors
4. Add basic player picker (no filtering)
5. Add advanced filtering logic
6. Add player management functions
7. Add duplicate prevention checks
8. Add error boundaries

After EACH addition, test "Open Squad Picker" to isolate the problematic code.

---

## IF MINIMAL VERSION FAILS

Then we have a duplicate React instance or build configuration issue. The fix requires:

1. Update `vite.config.ts` to deduplicate React
2. Clean install dependencies
3. Verify no bundled React in node_modules

---

**Status:** ⏳ Awaiting user test results with minimal TeamSheet
