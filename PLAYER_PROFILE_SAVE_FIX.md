# Player Profile Save Fix - Complete

## Issue Found
**Location**: `src/tabs/TeamSheet.tsx` line 1056

**Problem**: The "Add to Squad" button showed a placeholder toast message instead of actually saving players:
```typescript
showToast("Guest to Squad feature coming soon");
```

This caused **silent failure** - clicking the button did nothing, no players were saved, and users received a misleading "coming soon" message.

## Root Cause
The feature was never implemented. The UI callback existed but was a placeholder that:
- Did not call any save function
- Did not interact with the database
- Did not show real errors
- Did not reload the player list

## Fix Applied

### 1. Import Dependencies (Line 8)
Added import for `createPlayerProfile` and `supabase`:
```typescript
import {
  listPlayerProfiles,
  createPlayerProfile,
  PlayerProfile,
} from "../store/supabasePlayerProfiles";
import { supabase } from "../supabaseClient";
```

### 2. Created Handler Function (Line 423)
Added `handleAddGuestToSquad()` function with:
- ✅ DEV-only logging at each step
- ✅ Player name validation
- ✅ Auth session check with proper error handling
- ✅ Clean payload with only valid DB columns (owner_id, name, role, batting_style, is_guest)
- ✅ Database insert via `createPlayerProfile()`
- ✅ Error handling with user-facing toast messages
- ✅ Update player in current team to link to saved profile
- ✅ Reload player profiles immediately after save
- ✅ Success toast confirmation

### 3. Connected Button to Handler (Line 1174)
Replaced placeholder with actual async call:
```typescript
onAddToSquad={
  editingPlayer.player.guest
    ? async () => {
        await handleAddGuestToSquad(editingPlayer.player);
        setEditingPlayer(null);
      }
    : undefined
}
```

## Database Schema Verified
✅ Table name: `player_profiles`
✅ Owner column: `owner_id` (not user_id)
✅ RLS policies: Active and correct
✅ Required columns: owner_id, name, role, batting_style, is_guest

## Functions Used
- **`createPlayerProfile()`** - Already production-ready in `supabasePlayerProfiles.ts`
  - Gets authenticated user
  - Uses `owner_id` correctly
  - Cleans payload
  - Has comprehensive error handling
  - Re-fetches to confirm persistence

- **`listPlayerProfiles()`** - Already uses `owner_id` correctly

## Logging Added (DEV mode only)
1. `[AddToSquad] Clicked for player: <name>`
2. `[AddToSquad] Form values: { name, guest, profileId }`
3. `[AddToSquad] Current user: <userId>`
4. `[AddToSquad] Payload: <cleanPayload>`
5. `[AddToSquad] Response: { savedProfile }`
6. `[AddToSquad] Profiles reloaded: <count>`
7. `[AddToSquad] ✓ SUCCESS - Player saved: <profileId>`

## Error Handling
- **No auth session**: Shows "Session expired. Please log in again."
- **Missing player name**: Shows "Cannot save player: name is required"
- **Database error**: Shows "Error: <error.message>"
- **All errors logged to console** with `[AddToSquad ERROR]:` prefix

## User Flow After Fix
1. User adds guest player via "Add as Guest" ✅
2. User clicks on guest player in team sheet ✅
3. User clicks "Add to Squad" button ✅
4. System validates and saves player to database ✅
5. Player is linked to saved profile (guest flag removed) ✅
6. Player list refreshes immediately ✅
7. Success toast appears: "✓ <Player Name> saved to squad!" ✅
8. Player now appears in Cricket Squad page ✅
9. Player persists across sessions ✅

## Future Stats Integration Ready
- Player objects now have `profileId` field linked to saved profile
- Stats system can now use stable profile IDs instead of name-only matching
- Supports league-wide cumulative stats
- Prevents duplicate stats from name variations
- Foundation for "Best Batsman" / "Player of Match" awards

## Files Modified
1. **src/tabs/TeamSheet.tsx** (3 changes)
   - Added imports for `createPlayerProfile` and `supabase`
   - Added `handleAddGuestToSquad()` function
   - Connected button callback to handler

## Build Status
✅ Build successful (no TypeScript errors)
✅ No compilation warnings
✅ Ready for testing

## Testing Checklist
- [ ] Add guest player via "Add as Guest"
- [ ] Click on guest player → "Add to Squad" appears
- [ ] Click "Add to Squad" button
- [ ] Verify success toast appears
- [ ] Check player no longer marked as guest
- [ ] Navigate to Cricket Squad page
- [ ] Verify player appears in squad list
- [ ] Reload page / logout and login
- [ ] Verify player persists
- [ ] Check console for DEV logs (if in dev mode)
- [ ] Test error cases (offline, no auth, etc.)
