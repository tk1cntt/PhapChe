---
phase: quick-260607-pfj
plan: "01"
type: execute
wave: "1"
depends_on: []
files_modified:
  - src/app/requests/[requestId]/page.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "User sees request status page after submitting intake"
    - "Page shows request ID, status, and attached files"
  artifacts:
    - path: "src/app/requests/[requestId]/page.tsx"
      provides: "Request status page renders with proper layout"
---

# Quick Task 260607-pfj

## Bug Description
After submitting intake at `/intake`, redirect to `/requests/[id]` shows blank white page.

## Root Cause
- `requireAppSession()` might throw instead of returning null
- Missing error handling in page component

## Solution
- Add try-catch around session check
- Add explicit redirect('/sign-in') for unauthenticated users
- Use proper inline styles instead of Tailwind className

## Tasks

1. **Fix auth error handling in requests page**
   - Add try-catch around requireAppSession()
   - Redirect to /sign-in if session invalid
   - Ensure page renders properly with proper error boundaries

2. **Verify TypeScript compilation**
   - Run typecheck to ensure no errors

## Verification
- npm run typecheck passes
- Page renders request status with proper styling
