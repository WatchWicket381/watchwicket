# 🔑 How to Get Your jwkobz Supabase Keys

## Step-by-Step Guide (with exact URLs)

---

### 1️⃣ Open Your jwkobz Project API Settings

**Direct Link:** https://supabase.com/dashboard/project/jwkobz/settings/api

(If that doesn't work, go to: Supabase Dashboard → Select "jwkobz" project → Settings → API)

---

### 2️⃣ Copy Project URL

Look for the section **"Project URL"** or **"API URL"**

You should see:
```
https://jwkobz.supabase.co
```

**This is already in your .env file - don't change it!**

---

### 3️⃣ Copy anon/public Key

Scroll down to find **"Project API keys"**

Look for the key labeled **"anon"** or **"anon public"**

It looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a29ieiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk...
```

(Very long string starting with `eyJ`)

**Click the "Copy" button** next to this key.

⚠️ **DO NOT copy the "service_role" key** - that's secret and should never be in frontend code!

---

### 4️⃣ Update Your .env File

1. Open `.env` file in your project root
2. Find this line:
   ```env
   VITE_SUPABASE_ANON_KEY=YOUR_JWKOBZ_ANON_KEY_HERE_REPLACE_THIS
   ```
3. Replace `YOUR_JWKOBZ_ANON_KEY_HERE_REPLACE_THIS` with the key you copied
4. Save the file

Final result should look like:
```env
VITE_SUPABASE_URL=https://jwkobz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a29ieiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk...
```

---

### 5️⃣ Restart Dev Server

```bash
# In your terminal, stop the current server (Ctrl+C or Cmd+C)
# Then start it again:
npm run dev
```

**IMPORTANT:** You MUST restart the server for .env changes to take effect!

---

### 6️⃣ Verify It's Working

Open your app and look for:

✅ **Purple banner at bottom** shows: `🔌 Supabase: jwkobz`

✅ **Browser console** (F12) shows:
```
🔌 SUPABASE CONNECTION INITIALIZED
📍 Project Reference: jwkobz
```

❌ If you see **knqkqw** or **rwegwyuvjloexnknqkqw** anywhere:
- Your .env file wasn't updated correctly
- OR you didn't restart the server
- OR your browser is cached (try Ctrl+Shift+R to hard refresh)

---

## 🎯 Visual Guide - What You're Looking For

When you open https://supabase.com/dashboard/project/jwkobz/settings/api

You'll see a page with sections like:

```
┌─────────────────────────────────────────────────────┐
│ Configuration                                        │
├─────────────────────────────────────────────────────┤
│ Project URL                                         │
│ https://jwkobz.supabase.co                         │
│ [Copy button]                                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Project API keys                                     │
├─────────────────────────────────────────────────────┤
│ anon public                                         │
│ This key is safe to use in a browser              │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...           │
│ [Copy button] ← COPY THIS ONE!                     │
│                                                      │
│ service_role secret                                 │
│ This key has the ability to bypass Row Level...   │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...           │
│ [Copy button] ← DO NOT USE THIS ONE                │
└─────────────────────────────────────────────────────┘
```

**Copy the "anon public" key, NOT the "service_role" key!**

---

## 🆘 Still Need Help?

If you can't find the keys:

1. Make sure you're logged into Supabase
2. Make sure you have access to the jwkobz project
3. Try this direct link: https://app.supabase.com/project/jwkobz/settings/api

If the link says "Project not found", you may need to:
- Check the project reference is actually "jwkobz"
- Verify you have access to this project in your Supabase account

---

**Once your .env is updated and server restarted, proceed to run JWKOBZ_MIGRATION.sql!**
