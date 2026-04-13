# 🚨 URGENT: Complete jwkobz Setup NOW

**Status:** App currently won't work - `.env` needs YOUR jwkobz credentials

---

## ⚡ DO THIS RIGHT NOW (2 minutes)

### Step 1: Get Your jwkobz Credentials

1. Go to: https://supabase.com/dashboard/project/jwkobz/settings/api
2. Copy these two values:
   - **Project URL** (looks like: `https://jwkobz.supabase.co`)
   - **anon public** key (the long JWT token)

### Step 2: Update .env File

1. Open `.env` in project root
2. Replace this line:
   ```
   VITE_SUPABASE_ANON_KEY=YOUR_JWKOBZ_ANON_KEY_HERE_REPLACE_THIS
   ```
   With your actual anon key from step 1

3. Verify URL is correct:
   ```
   VITE_SUPABASE_URL=https://jwkobz.supabase.co
   ```

4. Save the file

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Verify Connection

1. Open app in browser
2. Check purple banner at bottom - should say **"Supabase: jwkobz"**
3. Check browser console - should show:
   ```
   🔌 SUPABASE CONNECTION INITIALIZED
   📍 Project Reference: jwkobz
   ```

If you see **knqkqw** anywhere, the .env wasn't loaded - restart the server.

---

## 🗄️ Then: Run Database Migration

After .env is configured:

1. Go to: https://supabase.com/dashboard/project/jwkobz/sql
2. Open file: `JWKOBZ_MIGRATION.sql` (in project root)
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Should see: "Status: READY FOR MATCH CREATION"

---

## ✅ Test Match Creation

```javascript
// In browser console (F12)
window.testMatchCreation()

// Expected output:
// ✅ ALL TESTS PASSED - Match creation is working!
```

---

## ❌ If Still Showing knqkqw

Your .env file wasn't updated correctly. Check:

1. Did you save the .env file?
2. Did you restart the dev server?
3. Is the anon key the correct one from jwkobz?
4. Try hard refresh: Ctrl+Shift+R

---

## 📞 Quick Debug

Run this in browser console to see what project is active:

```javascript
console.log('Current Supabase Project:', import.meta.env.VITE_SUPABASE_URL);
```

Should print: `https://jwkobz.supabase.co`

If it shows something else, your .env wasn't loaded.

---

**BOTTOM LINE:** Update `.env` with your actual jwkobz anon key, restart server, verify purple banner shows "jwkobz".
