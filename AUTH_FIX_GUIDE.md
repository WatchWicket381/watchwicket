# Authentication Fix Guide - WatchWicket ScoreBox

## CRITICAL FINDING

**NO USERS EXIST IN THE DATABASE**
- auth.users table: 0 users
- profiles table: 0 profiles

This means **no one has successfully signed up yet**. The issue is likely email confirmation blocking new signups.

## Root Cause Analysis

### Issue: Email Confirmation Required (Default Supabase Setting)

By default, Supabase requires email confirmation for new signups. This means:

1. User signs up with email/password
2. Supabase sends a confirmation email
3. User MUST click the link in the email
4. Only then can they login

**Problem**: If email sending isn't configured properly, users can't confirm their emails and therefore can't login.

## Immediate Fix Steps

### Step 1: Disable Email Confirmation (Recommended for Testing)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rwegwyuvjloexnknqkqw
2. Navigate to **Authentication** → **Providers** → **Email**
3. **DISABLE** "Confirm email" toggle
4. Save changes

This allows users to signup and login immediately without email confirmation.

### Step 2: Test Authentication

#### Option A: Use the Built-in Diagnostic Tool

1. Navigate to: `http://localhost:5173/auth-debug` (or your domain + `/auth-debug`)
2. Click "Test Connection" - should show ✓ for all checks
3. Click "Test Sign Up" - should create a user successfully
4. Click "Test Sign In" - should login successfully

#### Option B: Manual Testing

1. Go to your app
2. Click "Sign In / Sign Up"
3. Click "Sign up"
4. Enter email and password
5. Complete signup
6. Try to login with the same credentials

### Step 3: Verify the Fix

Run these SQL queries in Supabase SQL Editor:

```sql
-- Check if users were created
SELECT id, email, created_at, confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Check if profiles were created
SELECT id, email, full_name, created_at
FROM profiles
ORDER BY created_at DESC;
```

If you see users appearing, authentication is working!

## Database Status (Before Fix)

### Connection Status
- ✅ Supabase connected: `rwegwyuvjloexnknqkqw.supabase.co`
- ✅ Database accessible
- ✅ RLS enabled on all tables

### Tables Status
- ✅ `profiles` table exists with INSERT/SELECT/UPDATE policies
- ✅ `matches` table exists with all required policies
- ✅ `subscriptions` table exists

### RLS Policies (Fixed)
- ✅ profiles: INSERT policy added (users can create their own profile)
- ✅ profiles: SELECT policy (users can read their own profile)
- ✅ profiles: UPDATE policy (users can update their own profile)
- ✅ matches: All CRUD policies working

## Alternative Solutions

### Solution 1: Configure Email Sending (Production Ready)

If you want email confirmation (recommended for production):

1. Go to Supabase Dashboard → **Settings** → **Auth**
2. Configure SMTP settings or use Supabase's email service
3. Set the "Site URL" to your production domain
4. Test email sending

### Solution 2: Use Google OAuth Only

If you don't want to deal with email/password:

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your OAuth credentials
4. Users can signup/login with Google (no email confirmation needed)

## Testing Checklist

- [ ] Email confirmation disabled in Supabase Dashboard
- [ ] Test signup with new email address
- [ ] Verify user appears in `auth.users` table
- [ ] Verify profile appears in `profiles` table
- [ ] Test login with created account
- [ ] Test match creation after login
- [ ] Test scoring a match

## Diagnostic URLs

- **Auth Debug Tool**: `http://localhost:5173/auth-debug` or `https://yourdomain.com/auth-debug`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/rwegwyuvjloexnknqkqw
- **Main App**: `http://localhost:5173/` or your production domain

## Quick Test Commands

```bash
# Build the app
npm run build

# Start dev server (if not already running)
npm run dev

# Check env vars are loaded
cat .env
```

## Success Criteria

After fixing, you should be able to:
1. ✅ Create new account without errors
2. ✅ Login immediately after signup
3. ✅ See your profile in the app
4. ✅ Create a new match
5. ✅ Score runs, wickets, etc.
6. ✅ Save match to database

## Still Having Issues?

If authentication still doesn't work after disabling email confirmation:

1. Check browser console for errors (F12)
2. Check Network tab for failed requests
3. Try the `/auth-debug` page for detailed diagnostics
4. Verify `.env` file has correct values:
   - `VITE_SUPABASE_URL=https://rwegwyuvjloexnknqkqw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=eyJhbGc...` (long JWT token)

## Technical Details

### What Was Fixed in Code

1. **Added INSERT policy to profiles table** - Line 15-24 in latest migration
   - Users can now create their own profile on first login
   - Previously could only read/update but not create

2. **Added Auth Debug page** - `/src/pages/AuthDebug.tsx`
   - Comprehensive testing tool
   - Real-time diagnostics
   - Tests connection, signup, login

3. **Verified all RLS policies**
   - matches table: ✅ All policies present
   - profiles table: ✅ All policies present (INSERT added)
   - subscriptions table: ✅ All policies present

### Auth Flow

1. User submits signup form
2. AuthContext.signUp() calls Supabase
3. Supabase creates user in auth.users
4. IF email confirmation disabled → immediate session created
5. AuthContext.ensureProfileExists() creates profile
6. User is logged in and can use the app

### Database Schema

```sql
-- profiles table
id uuid PRIMARY KEY (matches auth.uid())
email text NOT NULL
full_name text
avatar_url text
google_id text
created_at timestamptz
updated_at timestamptz

-- RLS Policies
- Users can insert own profile (auth.uid() = id)
- Users can read own profile (auth.uid() = id)
- Users can update own profile (auth.uid() = id)
```

## Contact

If you continue to have issues, the problem is likely in the Supabase Dashboard configuration, not the code. Focus on the "Confirm email" setting in Authentication → Providers → Email.
