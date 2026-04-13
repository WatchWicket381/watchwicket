# 🔥 FIX: Why You're Still Seeing knqkqw

## 🎯 The Problem

Your `.env` file currently has **OLD credentials for the knqkqw project**:

```env
VITE_SUPABASE_URL=https://rwegwyuvjloexnknqkqw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZWd3eXV2amxvZXhua25xa3F3...
```

That's why the app is connecting to knqkqw instead of your jwkobz project!

---

## ✅ The Solution (3 steps)

### Step 1: Get Your jwkobz anon key

1. Go to: https://supabase.com/dashboard/project/jwkobz/settings/api
2. Copy the **"anon public"** key (the long JWT token)
3. Keep it ready for step 2

📖 **Detailed guide:** See `GET_YOUR_JWKOBZ_KEYS.md`

---

### Step 2: Update .env File

1. Open `.env` in project root
2. **Replace** the anon key:
   ```env
   # Before:
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZWd3eXV2amxvZXhua25xa3F3...

   # After (use YOUR actual jwkobz key):
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a29ieiI...
   ```

3. **Update** the URL:
   ```env
   # Before:
   VITE_SUPABASE_URL=https://rwegwyuvjloexnknqkqw.supabase.co

   # After:
   VITE_SUPABASE_URL=https://jwkobz.supabase.co
   ```

4. **Save** the file

---

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

**⚠️ CRITICAL:** You MUST restart for .env changes to take effect!

---

## 🎨 How to Verify It Worked

After restarting, you should see:

### ✅ Purple Banner Shows jwkobz
Look at the bottom of the app:
```
┌─────────────────────────────────────────────────────┐
│ 🔌 Supabase: jwkobz       ▲ click for details     │
└─────────────────────────────────────────────────────┘
```

### ✅ Console Shows jwkobz Connection
Open browser console (F12), you should see:
```
======================================================================
🔌 SUPABASE CONNECTION INITIALIZED
======================================================================
📍 Project Reference: jwkobz
🌐 Full Host: jwkobz.supabase.co
======================================================================
```

### ❌ If You Still See knqkqw

1. **Check .env file** - Did you save it?
2. **Restart server** - Did you actually restart (Ctrl+C then `npm run dev`)?
3. **Clear browser cache** - Hard refresh with Ctrl+Shift+R
4. **Check the key** - Is it the correct anon key from jwkobz?

---

## 🗄️ After .env is Fixed: Run Migration

Once the banner shows "jwkobz", run the database migration:

1. Go to: https://supabase.com/dashboard/project/jwkobz/sql
2. Copy contents of `JWKOBZ_MIGRATION.sql`
3. Paste and click "Run"
4. Should see: "Status: READY FOR MATCH CREATION"

📖 **Full guide:** See `JWKOBZ_SETUP_GUIDE.md`

---

## 🧪 Test Match Creation

After migration is complete:

```javascript
// In browser console (F12)
window.testMatchCreation()

// Expected:
// ✅ ALL TESTS PASSED - Match creation is working!
```

Then try creating a real match in the app!

---

## 📂 Files to Help You

| File | Purpose |
|------|---------|
| `GET_YOUR_JWKOBZ_KEYS.md` | How to find your jwkobz keys |
| `JWKOBZ_MIGRATION.sql` | Database setup (run in Supabase SQL Editor) |
| `JWKOBZ_SETUP_GUIDE.md` | Complete setup instructions |
| `URGENT_SETUP_JWKOBZ.md` | Quick start guide |

---

## 🎯 Quick Checklist

- [ ] Get jwkobz anon key from Supabase dashboard
- [ ] Update VITE_SUPABASE_ANON_KEY in .env file
- [ ] Update VITE_SUPABASE_URL to https://jwkobz.supabase.co
- [ ] Save .env file
- [ ] Restart dev server (Ctrl+C, then npm run dev)
- [ ] Verify purple banner shows "jwkobz"
- [ ] Run JWKOBZ_MIGRATION.sql in Supabase
- [ ] Test: window.testMatchCreation()
- [ ] Create test match in app

---

**TL;DR:** Your .env has knqkqw credentials. Replace with your jwkobz credentials, restart server, verify purple banner shows "jwkobz".
