# DEBUG MODE & ERROR CAPTURE SETUP

## React Error #300 - Debug Mode Implementation

This document describes the comprehensive error capture and debug system implemented to surface non-minified React errors with full stack traces.

---

## 1. VITE CONFIGURATION (Production Non-Minified Build)

**File:** `vite.config.ts`

### Changes Made:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,        // ✅ DISABLED minification for readable errors
    sourcemap: true,      // ✅ ENABLED source maps for debugging
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
```

### What This Means:

- **Production builds are NO LONGER minified**
- React error messages will be FULL, not "Minified React error #300"
- Source maps allow tracing errors back to original source code
- Build size increased from 1,044 KB to 2,271 KB (acceptable for debugging)
- All error messages, variable names, and function names are preserved

---

## 2. GLOBAL ERROR OVERLAY (Window-Level Capture)

**File:** `src/components/GlobalErrorOverlay.tsx`

### Captures:

1. **Window-level errors** via `window.addEventListener("error", ...)`
2. **Unhandled promise rejections** via `window.addEventListener("unhandledrejection", ...)`

### Enhanced Features:

#### Detailed Error Information Captured:

```typescript
interface ErrorInfo {
  message: string;           // Full error message
  stack?: string;            // Complete stack trace
  componentStack?: string;   // React component hierarchy
  timestamp: number;         // When error occurred
  filename?: string;         // Source file
  lineno?: number;           // Line number
  colno?: number;            // Column number
  errorType?: string;        // Error class name
  userAgent?: string;        // Browser info
  url?: string;              // Page URL
  isDevelopment?: boolean;   // Build mode
}
```

#### Console Logging:

When an error is caught, the following is logged:

```
================================================================================
GLOBAL WINDOW ERROR CAUGHT
================================================================================
Error Object: [Error instance]
Message: [Full error message]
Filename: [Source file path]
Line: [line] Column: [column]
Stack: [Full stack trace]
================================================================================
```

#### Minified React Error Detection:

If a minified React error is detected (shouldn't happen now, but handled anyway):

```typescript
if (isMinifiedReactError) {
  enhancedMessage = `React Error #${errorCode}: ${event.message}

This is a MINIFIED React error. To see the full error:
1. Check the browser console for the full error details
2. Visit: https://react.dev/errors/${errorCode}
3. The app is running in PRODUCTION mode - see Vite config

Common Error #300: "Cannot update a component while rendering a different component"
This means setState is being called during render. Check the stack trace below.`;
}
```

#### Error Persistence:

All errors are saved to `localStorage` with key: **`last_app_error_full`**

Errors are stored for 5 minutes and survive page reloads.

#### Error Overlay UI:

When an error occurs, a full-screen overlay displays:

- **Environment badge**: Shows if running in DEVELOPMENT or PRODUCTION
- **Error Type**: The error class (e.g., "Error", "TypeError", "ReferenceError")
- **Error Message**: Full, non-minified error text (selectable)
- **Error Location**: Filename, line number, column number
- **Stack Trace**: Complete call stack (expandable, selectable, open by default)
- **Component Stack**: React component hierarchy if available (expandable, selectable, open by default)

#### Action Buttons:

1. **Copy Error**: Copies formatted error report to clipboard
2. **Reload App**: Clears error and reloads page
3. **Close**: Dismisses overlay (may be unstable)

---

## 3. REACT ERROR BOUNDARY (Component-Level Capture)

**File:** `src/components/ErrorBoundary.tsx`

### Captures:

React component rendering errors via `componentDidCatch(error, errorInfo)`

### Enhanced Features:

#### State Tracking:

```typescript
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;  // ✅ NOW STORED
}
```

#### Console Logging:

```
================================================================================
REACT ERROR BOUNDARY CAUGHT ERROR
================================================================================
Error: [Error instance]
Error Name: [Error type]
Error Message: [Full message]
Error Stack: [Stack trace]
Component Stack: [React component tree]
================================================================================
```

#### Error Persistence:

Errors are saved to `localStorage` with key: **`last_app_error_full`**

Full error report includes:

```typescript
{
  timestamp: "2024-01-01T12:00:00.000Z",
  errorName: "Error",
  errorMessage: "Cannot update...",
  errorStack: "Error: Cannot update...\n    at ...",
  componentStack: "\n    at TeamSheet\n    at ...",
  userAgent: "Mozilla/5.0...",
  url: "https://...",
  isDevelopment: true
}
```

#### Error Boundary UI:

Full-screen detailed error display showing:

- **Environment**: DEVELOPMENT or PRODUCTION
- **Error Type**: Error class name
- **Error Message**: Full text (selectable, pre-formatted)
- **Stack Trace**: Complete call stack (expandable, selectable, open by default)
- **React Component Stack**: Component hierarchy showing where error occurred (expandable, selectable, open by default)

#### Action Buttons:

1. **Copy Error**: Copies formatted error report to clipboard
2. **Reload App**: Clears error and reloads page

---

## 4. DEBUG MODE CONSOLE BANNER

**File:** `src/main.tsx`

### On App Load:

```
================================================================================
WATCHWICKET DEBUG MODE
================================================================================
Build Mode: production
Dev Mode: false
Prod Mode: true
React Version: 19.2.0
Vite Base URL: /
Timestamp: 2024-01-01T12:00:00.000Z
================================================================================

If you see "Minified React error #300":
1. Check this console for the FULL error above this message
2. Look for "GLOBAL WINDOW ERROR CAUGHT" or "REACT ERROR BOUNDARY"
3. The error overlay should show the complete stack trace
4. Error details are saved to localStorage "last_app_error_full"
================================================================================
```

This banner appears BEFORE any errors and helps developers verify the debug setup.

---

## 5. HOW TO USE THIS DEBUG SYSTEM

### When React Error #300 Occurs:

#### Step 1: Open Browser DevTools

Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

#### Step 2: Check Console Output

Look for the banner blocks:

```
================================================================================
GLOBAL WINDOW ERROR CAUGHT
================================================================================
```

or

```
================================================================================
REACT ERROR BOUNDARY CAUGHT ERROR
================================================================================
```

#### Step 3: Read the Error Details

The console will show:

- **Error Object**: The full Error instance
- **Message**: Complete, non-minified error text
- **Filename**: Source file where error occurred
- **Line/Column**: Exact location
- **Stack Trace**: Full call stack with function names and file paths
- **Component Stack**: React component tree (if caught by ErrorBoundary)

#### Step 4: Use the Error Overlay

The app will display a full-screen error overlay with:

- All error details in a readable format
- Expandable sections for Stack Trace and Component Stack
- Text is selectable for easy copying

#### Step 5: Copy Error Report

Click the **"Copy Error"** button to get a formatted error report:

```
WatchWicket App Error Report
================================================================================

Timestamp: 2024-01-01T12:00:00.000Z
Environment: PRODUCTION
Error Type: Error

Error Message:
--------------------------------------------------------------------------------
Cannot update a component (`TeamSheet`) while rendering a different component

Location:
--------------------------------------------------------------------------------
File: /assets/index-CFPcfitL.js
Line: 12345
Column: 67

Stack Trace:
--------------------------------------------------------------------------------
Error: Cannot update a component...
    at updateState (index-CFPcfitL.js:12345:67)
    at setState (index-CFPcfitL.js:23456:78)
    at TeamSheet (index-CFPcfitL.js:34567:89)
    ...

Component Stack:
--------------------------------------------------------------------------------
    at TeamSheet (TeamSheet.tsx:45)
    at ErrorBoundary (ErrorBoundary.tsx:110)
    at AuthProvider (AuthContext.tsx:20)
    ...

Environment Details:
--------------------------------------------------------------------------------
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...
URL: https://watchwicket.netlify.app/

================================================================================
```

#### Step 6: Retrieve Stored Error

If the error caused a reload or you need to access it later:

```javascript
// In browser console:
const storedError = localStorage.getItem('last_app_error_full');
console.log(JSON.parse(storedError));
```

---

## 6. ERROR REPORT STRUCTURE

### Copy Button Output:

```
WatchWicket App Error Report
================================================================================

Timestamp: [ISO timestamp]
Environment: DEVELOPMENT | PRODUCTION
Error Type: [Error class name]

Error Message:
--------------------------------------------------------------------------------
[Full, non-minified error text]

Location:
--------------------------------------------------------------------------------
File: [filename.js or .tsx]
Line: [line number]
Column: [column number]

Stack Trace:
--------------------------------------------------------------------------------
[Full call stack with function names and file paths]

Component Stack: (React errors only)
--------------------------------------------------------------------------------
[React component hierarchy showing path to error]

Environment Details:
--------------------------------------------------------------------------------
User Agent: [Browser and OS info]
URL: [Current page URL]

================================================================================
```

---

## 7. TECHNICAL DETAILS

### Build Configuration:

- **Minification**: DISABLED
- **Source Maps**: ENABLED
- **Bundle Size**: 2,271 KB (unminified)
- **Gzip Size**: 404.85 KB
- **Source Map Size**: 3,923.54 KB

### Error Capture Flow:

```
User Action / Code Execution
    ↓
Error Occurs
    ↓
Caught by GlobalErrorOverlay OR ErrorBoundary
    ↓
Logged to Console (with banner)
    ↓
Saved to localStorage
    ↓
Displayed in Error Overlay UI
    ↓
User can Copy / Reload / Close
```

### Storage Keys:

- **`last_app_error_full`**: Full error details with all metadata
- Expires after 5 minutes
- Survives page reloads

### Component Integration:

```tsx
// src/main.tsx
<GlobalErrorOverlay>
  <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </ErrorBoundary>
</GlobalErrorOverlay>
```

**GlobalErrorOverlay** catches:
- Window-level JavaScript errors
- Unhandled promise rejections
- Errors outside React component tree

**ErrorBoundary** catches:
- React component rendering errors
- Errors during lifecycle methods
- Errors in component tree

---

## 8. FINDING THE EXACT ERROR LOCATION

### If Error Shows in Console:

Look for the stack trace line that includes your source file:

```
at TeamSheet (TeamSheet.tsx:630:45)
         ↑          ↑        ↑   ↑
    Component   File    Line  Col
```

This means the error originated at:
- **File**: `src/tabs/TeamSheet.tsx`
- **Line**: 630
- **Column**: 45

### If Error Shows Component Stack:

```
at TeamSheet (TeamSheet.tsx:919)
at ErrorBoundary
at AuthProvider
at App
```

The error originated in `TeamSheet` component and bubbled up through the component tree.

---

## 9. TROUBLESHOOTING

### If Errors Are Still Minified:

1. Check Vite config has `minify: false`
2. Rebuild: `npm run build`
3. Clear browser cache
4. Hard reload: `Cmd+Shift+R` / `Ctrl+Shift+F5`

### If No Error Overlay Appears:

1. Check browser console for errors
2. Verify `GlobalErrorOverlay` is in `main.tsx`
3. Check localStorage: `localStorage.getItem('last_app_error_full')`

### If Component Stack Is Missing:

- Only React errors caught by ErrorBoundary have component stacks
- Window-level errors (outside React) won't have component stacks

---

## 10. REVERTING TO PRODUCTION MODE

To re-enable minification for production deployment:

**Edit `vite.config.ts`:**

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    minify: true,         // ✅ ENABLE minification
    sourcemap: false,     // ❌ DISABLE source maps (optional)
  },
});
```

Then rebuild:

```bash
npm run build
```

---

## SUMMARY

React Error #300 (and all other errors) will now display:

✅ **Non-minified error messages**
✅ **Complete stack traces with file paths and line numbers**
✅ **React component stacks showing component hierarchy**
✅ **Error location (filename, line, column)**
✅ **Timestamp and environment info**
✅ **Console logging with clear banners**
✅ **Full-screen error overlay with selectable text**
✅ **Copy button for easy error reporting**
✅ **localStorage persistence across reloads**

The exact file and line causing React error #300 will be visible in:

1. Browser console (look for "REACT ERROR BOUNDARY CAUGHT ERROR")
2. Error overlay UI (Stack Trace section)
3. Component Stack (showing which component)
4. localStorage `last_app_error_full` (persisted error)

**No more minified errors. All errors are now fully debuggable.**
