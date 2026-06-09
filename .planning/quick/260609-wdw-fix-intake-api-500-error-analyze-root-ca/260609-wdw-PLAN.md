---
quick_id: 260609-wdw
slug: fix-intake-api-500-error-analyze-root-ca
description: Fix intake API 500 error - analyze root cause and verify with browser testing
date: 2026-06-09
status: in-progress
must_haves:
  - truth: "API endpoint /intake/api/create-draft returns 200 with requestId when authenticated"
  - artifact: "src/lib/intake/intake-service.ts"
  - key_link: "src/app/intake/api/create-draft/route.ts"
---

## Root Cause Analysis

### Problem
POST to `/ja/intake/api/create-draft` returns HTTP 500

### Analysis

1. **Code Issue Found** (fixed in commit e37f78e):
   - Unsafe TypeScript cast: `tx.matterType as { upsert... }`
   - Cast bypasses type checking and can cause runtime errors

2. **Error Flow**:
   ```
   requireAppSession() → canAccessWorkspace() → prisma query
   ↓ (if any fails)
   throw Error → catch block → 500 response
   ```

3. **Potential Causes**:
   - No session/authentication
   - No active workspace membership
   - Database connection failure
   - Prisma transaction error

### Fix Applied (commit e37f78e)

```typescript
// BEFORE (unsafe)
const matterTypes = tx.matterType as { upsert(input: unknown): Promise<unknown> };
await matterTypes.upsert({...});

// AFTER (correct)
await tx.matterType.upsert({
  where: { workspaceId_key: { workspaceId, key: matterType.key } },
  ...
});
```

## Tasks

### Task 1: Verify API Route Error Handling

**Files:**
- `src/app/intake/api/create-draft/route.ts`
- `src/lib/intake/intake-service.ts`

**Action:**
1. Check current error handling returns actual error message
2. Verify fix from previous commit is applied
3. Document what error messages should appear for each failure case

**Verify:**
- API returns JSON with `error` and `details` fields on failure
