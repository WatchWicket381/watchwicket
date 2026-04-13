# 🚀 START HERE: Fix knqkqw → Use jwkobz Instead

## 🔴 THE ISSUE

Your app is showing **knqkqw** project because the `.env` file had old credentials.

**I've updated the `.env` file with the correct URL for jwkobz, but YOU need to add YOUR anon key!**

---

## ⚡ DO THIS NOW (Takes 3 minutes)

### 1. Get Your jwkobz Anon Key

**Go here:** https://supabase.com/dashboard/project/jwkobz/settings/api

**Copy the key labeled:** `anon public` (the really long string starting with `eyJ...`)

⚠️ **Copy the "anon" key, NOT the "service_role" key!**

---

### 2. Update .env File

Open `.env` file in your project root.

**Find this line:**
```env
VITE_SUPABASE_ANON_KEY=YOUR_JWKOBZ_ANON_KEY_HERE_REPLACE_THIS
```

**Replace with your actual key:**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a29ieiI...
```

**Save the file!**

---

### 3. Restart Dev Server

```bash
# In terminal, stop server with Ctrl+C
# Then start again:
npm run dev
```

**YOU MUST RESTART!** The server doesn't reload .env automatically.

---

### 4. Check Purple Banner

Open the app and look at the **bottom of the screen**.

You should see:
```
🔌 Supabase: jwkobz
```

✅ If it says **jwkobz** → SUCCESS! Move to step 5.
❌ If it says **knqkqw** → Go back to step 2, you didn't save/restart correctly.

---

### 5. Run Database Migration

**Go here:** https://supabase.com/dashboard/project/jwkobz/sql

1. Open file `JWKOBZ_MIGRATION.sql` (in project root)
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
5. Should see: "Status: READY FOR MATCH CREATION"

---

### 6. Test Match Creation

Open browser console (F12) and run:
```javascript
window.testMatchCreation()
```

Expected output:
```
✅ ALL TESTS PASSED - Match creation is working!
```

---

### 7. Create a Real Match!

Try creating a match in your app. It should work now!

---

## 📁 Need More Help?

| File | What It Does |
|------|--------------|
| `GET_YOUR_JWKOBZ_KEYS.md` | Step-by-step guide to find your keys |
| `FIX_KNQKQW_ISSUE.md` | Explains why knqkqw was showing |
| `JWKOBZ_MIGRATION.sql` | Database setup (run in Supabase) |
| `JWKOBZ_SETUP_GUIDE.md` | Complete detailed guide |

---

## 🆘 Still Not Working?

### Purple banner still shows knqkqw?

1. Check `.env` file - is the anon key the CORRECT one from jwkobz?
2. Did you SAVE the .env file?
3. Did you RESTART the server (Ctrl+C, then `npm run dev`)?
4. Try hard refresh: Ctrl+Shift+R in browser

### Match creation still fails?

1. Check purple banner - must say "jwkobz"
2. Run `JWKOBZ_MIGRATION.sql` in Supabase SQL Editor
3. Run `window.testMatchCreation()` to see detailed error

### Can't find anon key?

See `GET_YOUR_JWKOBZ_KEYS.md` for screenshots and direct links.

---

## ✅ Success Checklist

- [ ] Got anon key from jwkobz Supabase dashboard
- [ ] Updated VITE_SUPABASE_ANON_KEY in .env
- [ ] Saved .env file
- [ ] Restarted dev server
- [ ] Purple banner shows "jwkobz" (not knqkqw)
- [ ] Ran JWKOBZ_MIGRATION.sql
- [ ] window.testMatchCreation() passed
- [ ] Created test match successfully

---

**BOTTOM LINE:** Update .env with your jwkobz anon key → Restart server → Verify banner shows jwkobz → Run migration → Done!
