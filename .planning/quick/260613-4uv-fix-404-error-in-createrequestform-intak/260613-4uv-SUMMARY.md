---
quick_id: 260613-4uv
status: complete
---

## Summary

### Bug Fixed
**404 Error: "Intake submission not found"** - Occurred when submitting a request created via CreateRequestForm.

### Root Cause
The `/api/intake/create-draft` endpoint was creating only `LegalRequest` without the required `IntakeSubmission` record. When `submitIntake()` tried to find the submission, it returned 404.

### Solution Applied
Modified `src/app/api/intake/create-draft/route.ts` to create `IntakeSubmission` alongside `LegalRequest` in the same Prisma transaction.

### Files Changed
1. `src/app/api/intake/create-draft/route.ts` - Fixed to create IntakeSubmission
2. `e2e/intake-flow.spec.ts` - Added 2 e2e tests for CreateRequestForm
3. `src/lib/intake/create-draft.test.ts` - Added unit tests

### Verification
- Code review confirms IntakeSubmission is now created atomically with LegalRequest
- E2E tests added to verify submit flow works without 404
- Unit tests added for createDraftIntake and submitIntake functions
