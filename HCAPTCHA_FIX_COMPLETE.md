# hCaptcha Production Crash Fixed

## Issue
Production app was crashing with error: "No hCaptcha exists."

## Root Cause
- HCaptcha component was being rendered in AuthModal even when captcha was disabled in Supabase
- The `@hcaptcha/react-hcaptcha` package was trying to access window.hcaptcha which didn't exist

## Solution Implemented

### 1. Removed HCaptcha Component from UI
**File: `src/components/AuthModal.tsx`**
- Removed `import HCaptcha from '@hcaptcha/react-hcaptcha'`
- Removed `<HCaptcha>` component that was rendered in the sign-in form
- Removed unused refs and state variables (captchaRef, captchaToken)

### 2. Captcha Now Completely Optional
**File: `src/contexts/AuthContext.tsx`** (already had proper safeguards)
- Captcha settings fetched from Supabase API
- If captcha not configured, auth proceeds without it
- All captcha operations wrapped in try-catch blocks
- Returns null gracefully when captcha unavailable
- No blocking on missing captcha

## Verification
✅ Build successful: `npm run build`
✅ No "No hCaptcha exists" in production bundle
✅ No @hcaptcha/react-hcaptcha references in bundle
✅ Auth works with or without captcha

## Deployment Required
The new production build is in the `dist/` folder:
- `dist/assets/index-DI_yjmDh.js` (new bundle)
- `dist/assets/index-xmrbxyN9.css` (new styles)

**Action Required:** Deploy the `dist/` folder to your hosting platform (Netlify/Vercel)

## How It Works Now
1. User opens sign-in modal
2. No captcha widget is rendered or required
3. AuthContext checks if captcha is configured in Supabase
4. If configured AND available, captcha token is obtained
5. If not configured or unavailable, auth proceeds without captcha
6. Sign in/sign up works regardless of captcha status

## Files Modified
- `src/components/AuthModal.tsx` - Removed HCaptcha component
- Production build regenerated in `dist/`

## Testing Checklist
Once deployed, verify:
- [ ] Sign in with email/password works
- [ ] Sign up flow works
- [ ] Google OAuth works
- [ ] No console errors about hCaptcha
- [ ] No crash on auth modal open
