---
quick_id: 260609-vps
slug: fix-intake-page-500-error-when-creating-
description: Fix intake page 500 error when creating request - POST /ja/intake/api/create-draft
date: 2026-06-09
status: in-progress
must_haves:
  - truth: "API endpoint /intake/api/create-draft returns 200 with requestId"
  - artifact: "src/app/intake/api/create-draft/route.ts"
  - key_link: "src/lib/intake/intake-service.ts"
---

## Tasks

### Task 1: Investigate and fix the 500 error in create-draft API

**Files:**
- `src/app/intake/api/create-draft/route.ts`
- `src/lib/intake/intake-service.ts`
- `src/lib/security/session.ts`
- `src/lib/security/rbac.ts`

**Action:**
1. Analyze the error chain from intake-service.ts `createDraftIntake` function
2. The issue is likely in the Prisma transaction with `matterType.upsert` - the schema has `workspaceId String?` but the upsert uses `workspaceId_key` composite unique which requires non-null workspaceId
3. Add error logging to capture the actual error message
4. Ensure proper error handling that returns the actual error to the client

**Verify:**
- API returns proper error message instead of 500 when something fails
- Draft creation succeeds when all conditions are met
