# Production Logout Fix - AbortError Handling Complete

## Problem
Users were experiencing unexpected logouts in production caused by unhandled promise rejections from `AbortError`.

### Root Cause
When React components unmount while async operations (fetch/Supabase calls) are in flight, modern browsers abort those requests. If these abort errors aren't caught, they bubble up as unhandled promise rejections, potentially causing the app to crash or behave unexpectedly.

**Common triggers:**
- User navigates away while data is loading
- Component unmounts during async fetch
- Network requests cancelled by browser during cleanup
- Session/auth checks interrupted during route changes

## Solution Applied

### 1. Global Unhandled Rejection Handler (`src/main.tsx`)

Added a global handler to prevent app crashes from AbortErrors:

```typescript
// Global handler for unhandled promise rejections
// Prevents app crashes from AbortErrors when components unmount
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const errorName = error?.name || '';
  const errorMessage = String(error?.message || '').toLowerCase();

  // Suppress AbortError from fetch/network calls during component cleanup
  // These are expected when components unmount while requests are in flight
  if (errorName === 'AbortError' || errorMessage.includes('aborted') || errorMessage.includes('abort')) {
    console.log('[UnhandledRejection] Suppressed AbortError (expected during cleanup)');
    event.preventDefault();
    return;
  }

  // Log other unhandled rejections (real errors that need attention)
  console.error('[UnhandledRejection] Unhandled promise rejection:', error);
});
```

**Benefits:**
- Prevents app crashes from expected cleanup errors
- Still logs real errors for debugging
- Non-invasive - doesn't affect normal error handling

### 2. AuthContext Fixes (`src/contexts/AuthContext.tsx`)

#### Fixed `fetchSubscription` function
Added try/catch with abort error checking:

```typescript
const fetchSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setSubscription(data);
    }
  } catch (err: any) {
    // Ignore abort errors (expected during cleanup)
    if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
      return;
    }
    console.warn('[Auth] Subscription fetch exception (non-blocking):', err);
  }
};
```

#### Fixed `fetchCaptchaSettings` in useEffect
Added abort error handling to fetch:

```typescript
const fetchCaptchaSettings = async () => {
  try {
    console.log('[Auth] Fetching captcha settings from Supabase...');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    // ... rest of logic
  } catch (err: any) {
    // Ignore abort errors (expected during cleanup)
    if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
      return;
    }
    console.warn('[Auth] Error fetching captcha settings (captcha will be optional):', err);
  }
};
```

#### Fixed `getSession` promise chain
Added catch handler to prevent unhandled rejection:

```typescript
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null);
  if (session?.user) {
    fetchProfile(session.user.id);
    fetchSubscription(session.user.id);
  }
  setLoading(false);
}).catch((err: any) => {
  // Ignore abort errors
  if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
    return;
  }
  console.error('[Auth] Error getting session:', err);
  setLoading(false);
});
```

#### Fixed `onAuthStateChange` callback
Wrapped async callback in try/catch:

```typescript
const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  (async () => {
    try {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        await fetchSubscription(session.user.id);
      } else {
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    } catch (err: any) {
      // Ignore abort errors
      if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
        return;
      }
      console.error('[Auth] Error in auth state change:', err);
      setLoading(false);
    }
  })();
});
```

### 3. PublicHomePage Fixes (`src/pages/PublicHomePage.tsx`)

#### Fixed weather fetch
Added abort error check to catch block:

```typescript
fetch(`https://api.open-meteo.com/v1/forecast?...`)
  .then(res => res.json())
  .then(data => {
    // ... process weather data
  })
  .catch((err) => {
    // Ignore abort errors (expected during cleanup)
    if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
      return;
    }
    setWeather({ temp: '—', icon: '☁️' });
  });
```

#### Fixed loadMatches async function
Wrapped entire function in try/catch:

```typescript
useEffect(() => {
  const loadMatches = async () => {
    try {
      console.log('[PublicHomePage] Loading public matches...');
      const data = await getLivePublicMatches();
      // ... process matches
      setMatches(data || []);
      setLoading(false);
    } catch (err: any) {
      // Ignore abort errors (expected during cleanup)
      if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
        return;
      }
      console.error('[PublicHomePage] Error loading matches:', err);
      setMatches([]);
      setLoading(false);
    }
  };

  loadMatches();
}, []);
```

### 4. TeamSheet Fixes (`src/tabs/TeamSheet.tsx`)

Enhanced existing try/catch with abort error check:

```typescript
useEffect(() => {
  async function loadProfiles() {
    setIsLoadingProfiles(true);
    try {
      const allProfiles = await listPlayerProfiles();
      setProfiles(Array.isArray(allProfiles) ? allProfiles : []);
    } catch (err: any) {
      // Ignore abort errors (expected during cleanup)
      if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
        setIsLoadingProfiles(false);
        return;
      }
      console.error("Error loading profiles:", err);
      setProfiles([]);
    } finally {
      setIsLoadingProfiles(false);
    }
  }
  loadProfiles();
}, []);
```

## Error Handling Pattern

**Standard pattern used throughout:**

```typescript
catch (err: any) {
  // Ignore abort errors (expected during cleanup)
  if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
    return; // or cleanup and return
  }
  // Handle real errors
  console.error('[Component] Real error:', err);
}
```

**Why this works:**
- Checks both `err.name === 'AbortError'` (standard property)
- Also checks message content (belt and suspenders approach)
- Early return prevents error propagation
- Real errors still get logged and handled

## Security Verification

### Environment Variables
Confirmed that `src/supabaseClient.ts` correctly uses environment variables:

```typescript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Verified:**
- ✅ No hardcoded Supabase URLs
- ✅ No hardcoded project references
- ✅ All URLs read from `VITE_SUPABASE_URL`
- ✅ All keys read from `VITE_SUPABASE_ANON_KEY`
- ✅ Properly configured for Netlify environment

### Session Persistence
Confirmed that `signOut()` is NEVER called on network errors:
- ✅ No error handlers trigger logout
- ✅ Network failures don't affect session
- ✅ Abort errors don't trigger logout
- ✅ Session remains valid across route changes

## Files Modified

1. **`src/main.tsx`** - Added global unhandledrejection handler
2. **`src/contexts/AuthContext.tsx`** - Fixed 4 async functions
3. **`src/pages/PublicHomePage.tsx`** - Fixed 2 async functions
4. **`src/tabs/TeamSheet.tsx`** - Enhanced 1 try/catch block

## Testing Checklist

After deploying, verify:

- [ ] **No unexpected logouts** - Users stay logged in during navigation
- [ ] **Console is clean** - No unhandled promise rejection errors
- [ ] **Navigation works** - Can quickly navigate between pages without errors
- [ ] **Loading states work** - Data loads correctly even after rapid navigation
- [ ] **Network errors handled** - Offline scenarios don't crash the app
- [ ] **Session persists** - Refresh doesn't log user out
- [ ] **Auth state stable** - Auth callbacks complete without errors

## Expected Behavior

### Before Fix:
- ❌ Random logouts in production
- ❌ Console errors: "Unhandled promise rejection: AbortError"
- ❌ App instability during navigation
- ❌ Session loss on quick page changes

### After Fix:
- ✅ Stable sessions across navigation
- ✅ Clean console (only expected logs)
- ✅ Smooth navigation without errors
- ✅ Graceful handling of interrupted requests
- ✅ No unexpected logouts

## Technical Details

### What is AbortError?

`AbortError` is a DOMException thrown when:
1. A fetch request is cancelled via `AbortController.abort()`
2. Browser cancels requests during navigation/unmount
3. Network operation is interrupted by user action

**This is EXPECTED behavior**, not a bug. The fix ensures we handle it gracefully.

### Why Global Handler?

While we added try/catch to specific functions, the global handler provides:
1. **Safety net** for any missed cases
2. **Non-invasive** - doesn't change existing code
3. **Selective** - only suppresses AbortErrors, not real errors
4. **Informative** - logs what it suppresses

## Build Status

✅ Build successful
✅ No TypeScript errors
✅ All async functions properly wrapped
✅ Environment variables correctly configured
✅ Ready for production deployment

## Monitoring

After deployment, monitor for:
1. **Console logs** - Should see fewer errors
2. **Session stability** - Users should stay logged in
3. **Auth metrics** - No spike in login attempts
4. **Error tracking** - Real errors still reported

If issues persist, check:
- Browser console for remaining unhandled rejections
- Network tab for failed requests
- Application logs for auth failures
- Error tracking service for new error patterns

## Next Steps

1. Deploy to Netlify
2. Monitor production console
3. Verify no logout issues
4. Confirm session persistence
5. Check error tracking for any new patterns

## Prevention

To prevent this in the future:
1. **Always wrap async useEffect functions** in try/catch
2. **Always check for AbortError** in catch blocks
3. **Test navigation scenarios** during development
4. **Monitor console** for unhandled rejections
5. **Use error boundaries** for component-level errors
