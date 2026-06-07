---
phase: quick-260607-o5f
status: complete
completed: "2026-06-07"
commits:
  - 9f43145: "feat(intake): add client-side validation for ServiceSelection"
  - d78dd52: "feat(intake): fix UploadStep with custom request handler"
  - 511e65d: "fix(intake): improve submitIntakeAction error handling"
---

# Quick Task 260607-o5f: Fix Intake Bugs Summary

## Bugs Fixed

| Bug | Description | Status |
|-----|-------------|--------|
| 1. Validation not working | Empty form submission now shows inline error | ✅ Fixed |
| 2. Upload causes 500 | Dragger now uses customRequest to call API | ✅ Fixed |
| 3. Submit causes 500 | Action now has try-catch and proper validation | ✅ Fixed |

## Files Modified/Created

- `src/app/intake/components.tsx` - Added validation + customRequest for upload
- `src/app/intake/actions.ts` - Improved error handling
- `src/app/intake/page.tsx` - Pass requestId to UploadStep
- `src/app/intake/api/create-draft/route.ts` - NEW API endpoint
- `src/app/intake/api/attach-file/route.ts` - NEW API endpoint

## Tasks Completed

1. **Task 1:** Add client-side validation for ServiceSelection
   - Added useState for form validation
   - Empty selection now shows inline error message
   - Form validates before submitting

2. **Task 2:** Fix UploadStep Dragger with custom request handler
   - Added customRequest prop to Dragger
   - Uploads via new `/api/attach-file` endpoint
   - Shows upload progress and success/error states

3. **Task 3:** Improve submitIntakeAction error handling
   - Added try-catch wrapper
   - Returns user-friendly error messages instead of 500
   - Proper validation of required fields
