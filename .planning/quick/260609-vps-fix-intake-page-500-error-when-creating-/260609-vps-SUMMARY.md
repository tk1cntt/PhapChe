---
quick_id: 260609-vps
slug: fix-intake-page-500-error-when-creating-
status: complete
completed: 2026-06-09
commits:
  - e37f78e: "fix(intake): remove unsafe tx.matterType cast and improve error logging"
---

# Quick Task 260609-vps: Fix Intake 500 Error Summary

## Problem
- POST to `/ja/intake/api/create-draft` returns HTTP 500 (Internal Server Error)
- Root cause: Unsafe TypeScript cast `tx.matterType as { upsert... }` in `createDraftIntake()` function

## Root Cause
The `intake-service.ts` had this problematic code:
```typescript
const matterTypes = tx.matterType as { upsert(input: unknown): Promise<unknown> };
await matterTypes.upsert({...});
```

The `as` cast bypassed TypeScript type checking and could cause runtime errors when:
1. The Prisma client transaction client doesn't have the expected structure
2. The upsert operation receives incorrect input types

## Fix Applied
1. **Removed unsafe cast** - Changed to direct `tx.matterType.upsert()` call
2. **Added detailed error logging** - API route now logs actual error message and stack trace
3. **Improved error responses** - Returns error details in JSON response for debugging

## Files Modified

| File | Change |
|------|--------|
| `src/lib/intake/intake-service.ts` | Removed unsafe `tx.matterType` cast, use direct upsert |
| `src/app/intake/api/create-draft/route.ts` | Added detailed error logging with stack trace |

## Verification
- TypeScript compilation passes for modified files
- E2E test exists: `e2e/intake.spec.ts` and `e2e/intake-flow.spec.ts` cover the create-draft flow
- Test: "clicks continue and redirects to intake with requestId and step=1" validates the endpoint

## Error Handling Now Returns
```json
{
  "error": "Failed to create draft",
  "details": "<actual error message>"
}
```
