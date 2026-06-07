---
phase: quick-260607-o5f
status: complete
completed: "2026-06-07"
commits:
  - a8238f3: "fix(intake): rewrite step-by-step flow with client-side validation"
---

# Quick Task 260607-o5f: Fix Intake Bugs Summary

## Bugs Fixed

| Bug | Root Cause | Fix | Status |
|-----|------------|-----|--------|
| 1. Jump to last step immediately | All 4 forms rendered at once | Rewrite with step navigation via URL params (step=1,2,3) | ✅ Fixed |
| 2. Questions not validating | Ant Design rules don't work with native forms | Client-side validation with useState for errors | ✅ Fixed |
| 3. Upload file not showing | showUploadList: false, no refresh | Show upload list, update state after success | ✅ Fixed |
| 4. Submit HTTP 500 | Server action errors not handled | API endpoint with proper JSON error responses | ✅ Fixed |

## Root Cause Analysis

Previous fixes failed because they were partial patches:
- Added validation but form still submitted to server action
- Added customRequest but didn't fix the underlying multi-form rendering
- HTTP 500 came from unhandled server action errors

## Solution

Rewrote the entire intake flow with proper step-by-step navigation:

1. **Step 0: Service Selection** → Creates draft, redirects to step=1
2. **Step 1: Questions** → Validates required fields client-side, saves via API, redirects to step=2
3. **Step 2: Upload** → Uses customRequest with showUploadList=true, redirects to step=3
4. **Step 3: Review** → Shows summary, submit button calls API

## Files Modified

- `src/app/intake/page.tsx` - Step-based rendering with URL params
- `src/app/intake/components.tsx` - Client-side validation, proper upload handling
- `src/app/intake/api/save-answers/route.ts` - NEW API endpoint
- `src/app/intake/api/submit/route.ts` - NEW API endpoint

## Key Changes

### page.tsx
- Each step renders only its content (not all 4 forms)
- `ProgressSteps` shows correct current step
- Uses `useRouter` for navigation between steps

### components.tsx
- `QuestionStep` validates required fields before saving
- `UploadStep` shows upload list and updates state after success
- `ReviewSummary` calls submit API instead of form action

### API Endpoints
- `/api/save-answers` - Saves answers, returns JSON
- `/api/submit` - Submits intake, returns JSON with result.id
