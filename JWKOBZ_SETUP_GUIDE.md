# WatchWicket ScoreBox - jwkobz Setup Guide

## 🎯 Overview

This guide will help you configure WatchWicket ScoreBox to work with YOUR jwkobz Supabase project. All hardcoded credentials have been removed, and the app now uses environment variables exclusively.

---

## ✅ What Has Been Fixed

### 1. **Hardcoded Credentials Removed**
- ❌ Old: App used hardcoded pwvyktaerjmgdujwkobz project
- ✅ New: App ONLY uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`

### 2. **On-Screen Debug Banner Added**
- Purple banner at bottom of screen shows which Supabase project is active
- Click banner to see full connection details
- Confirms jwkobz is being used in production

### 3. **Match Creation Fixed**
- Uses minimal two-step insert strategy (never fails on optional fields)
- Always sends `overs` as a number (default: 15)
- Comprehensive error logging with exact column names
- Enhanced diagnostics for troubleshooting

### 4. **Database Migration Created**
- Safe, idempotent SQL migration for jwkobz
- Adds all required columns with proper defaults
- Fixes `overs` column NOT NULL issue
- Sets up RLS policies and indexes

---

## 🚀 Setup Instructions

### **STEP 1: Configure Environment Variables**

1. Open your `.env` file in the project root
2. Add your jwkobz Supabase credentials:

```env
VITE_SUPABASE_URL=https://jwkobz.supabase.co
VITE_SUPABASE_ANON_KEY=your_jwkobz_anon_key_here
VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_key_if_needed
```

3. Save the file

### **STEP 2: Run the Database Migration**

1. Log in to your jwkobz Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file: `JWKOBZ_MIGRATION.sql` (in project root)
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

You should see output like:
```
WATCHWICKET SCOREBOX - JWKOBZ DATABASE SETUP COMPLETE
Table: public.matches
Columns: 25
RLS Enabled: true
Policies: 5
Indexes: 8
Status: READY FOR MATCH CREATION
```

### **STEP 3: Restart Dev Server**

```bash
npm run dev
```

### **STEP 4: Verify Connection**

1. Open the app in your browser
2. Look at the **purple banner at the bottom** of the screen
3. It should say: **"Supabase: jwkobz"**
4. Click the banner to see full details
5. Check browser console - should show:
   ```
   🔌 SUPABASE CONNECTION INITIALIZED
   📍 Project Reference: jwkobz
   ✅ Client initialized successfully
   ```

### **STEP 5: Test Match Creation**

#### Option A: Use Test Function (Recommended)

1. Open browser console (F12)
2. Type: `window.testMatchCreation()`
3. Press Enter
4. You should see:
   ```
   🧪 MATCH CREATION TEST - Starting...
   ✓ Authentication verified
   ✓ TEST 1 PASSED: Minimal insert successful
   ✓ TEST 2 PASSED: Full insert successful
   ✅ ALL TESTS PASSED - Match creation is working!
   ```

#### Option B: Create Real Match

1. Sign in to the app
2. Click "Create / Start Match"
3. Configure match settings
4. Click "Start Match"
5. Should navigate to scoreboard without errors

---

## 📊 Columns Inserted by App

When creating a match, the app inserts these columns:

### Required (must have defaults or app provides them):
- `id` - UUID, auto-generated
- `user_id` - UUID, from authenticated user
- `status` - Text, default 'draft'
- `overs` - Integer, default 15 ⚠️ **CRITICAL**

### Always Provided by App:
- `match_type` - Text (INDOOR/T20/ODI)
- `team_a_name` - Text
- `team_b_name` - Text
- `format` - Text (INDOOR/T20/ODI)
- `match_data` - JSONB (full match state)
- `has_activity` - Boolean
- `legal_balls` - Integer
- `is_public` - Boolean
- `updated_at` - Timestamp

### Optional (can be null):
- `team_a_logo_url` - Text
- `team_b_logo_url` - Text
- `completed_at` - Timestamp
- `league_id` - UUID
- `fixture_id` - UUID
- `match_location` - Text
- `match_date` - Date
- `match_time` - Time
- `deleted_at` - Timestamp

---

## 🔍 Troubleshooting

### Problem: "Missing required environment variables"

**Solution:**
- Check `.env` file exists in project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after editing `.env`

### Problem: "null value in column 'overs' violates not-null constraint"

**Solution:**
- Run `JWKOBZ_MIGRATION.sql` in your Supabase SQL Editor
- This adds the `overs` column with default value 15
- Clears any existing NULL values

### Problem: "column 'match_data' does not exist"

**Solution:**
- Run `JWKOBZ_MIGRATION.sql` to add missing columns
- Migration is idempotent - safe to run multiple times

### Problem: Match creation fails with error code 42703

**Meaning:** Column doesn't exist in database

**Solution:**
- Run `JWKOBZ_MIGRATION.sql`
- Check console logs for exact column name
- Notify support if column is not in migration

### Problem: Match creation fails with error code 23502

**Meaning:** NOT NULL constraint violated

**Solution:**
- Run `JWKOBZ_MIGRATION.sql` to add defaults
- Check console logs for exact column name
- Contact support if issue persists

### Problem: Error code 42501 (Insufficient privilege)

**Meaning:** RLS policy blocking operation

**Solution:**
- Run `JWKOBZ_MIGRATION.sql` to set up RLS policies
- Verify you're signed in
- Check you're using correct user account

---

## 🧪 Verification Queries

### Check if migration was successful:

```sql
-- Check matches table exists and has all columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
ORDER BY column_name;
```

Expected: Should return 25 columns

### Test insert (replace YOUR_USER_ID with actual user ID):

```sql
-- Test minimal insert
INSERT INTO public.matches (
  id,
  user_id,
  status,
  overs
) VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID'::uuid,
  'draft',
  15
) RETURNING id, status, overs;
```

Expected: Returns new row with generated ID

### Check RLS policies:

```sql
-- List all policies on matches table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'matches';
```

Expected: Should return 5 policies

---

## 📝 Migration File: JWKOBZ_MIGRATION.sql

**Location:** Project root directory

**Purpose:** Makes jwkobz database compatible with WatchWicket ScoreBox

**Features:**
- ✅ Safe and idempotent (can run multiple times)
- ✅ Creates matches table if missing
- ✅ Adds all missing columns
- ✅ Fixes overs column NOT NULL issue
- ✅ Sets up RLS policies
- ✅ Creates performance indexes
- ✅ Adds updated_at trigger
- ✅ Provides verification output

**Run this in:** Supabase Dashboard → SQL Editor

---

## 🎨 On-Screen Debug Banner

A purple banner appears at the bottom of the app showing:

**Collapsed:**
```
🔌 Supabase: jwkobz  ▲ click for details
```

**Expanded:**
```
🔌 Supabase: jwkobz
   jwkobz.supabase.co | development (dev)
   All match operations target this project exclusively.
   Match creation uses: https://jwkobz.supabase.co/rest/v1/matches
```

This helps you verify the app is connected to YOUR project.

---

## 📞 Support

If you encounter issues:

1. Check browser console for detailed error logs
2. Run `window.testMatchCreation()` in console for diagnostics
3. Verify purple debug banner shows "jwkobz"
4. Check `.env` file has correct credentials
5. Confirm migration was run successfully
6. Take screenshot of console errors

---

## ✨ Success Criteria

You'll know everything is working when:

- ✅ Purple banner shows "Supabase: jwkobz"
- ✅ Console shows connection to jwkobz on startup
- ✅ `window.testMatchCreation()` passes all tests
- ✅ You can create a new match without errors
- ✅ Match saves to jwkobz database
- ✅ Scoreboard loads successfully

---

## 🔐 Security Notes

- ✅ App uses anon key (public-safe)
- ✅ RLS policies protect user data
- ✅ Users can only access their own matches
- ✅ Public matches require explicit `is_public = true`
- ✅ No service role key in frontend
- ✅ Completed matches are immutable

---

**Last Updated:** 2026-01-29
**App Version:** WatchWicket ScoreBox
**Target Project:** jwkobz
