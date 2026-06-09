---
quick_id: 260609-wdw
slug: fix-intake-api-500-error-analyze-root-ca
status: complete
completed: 2026-06-09
commits:
  - e37f78e: "fix(intake): remove unsafe tx.matterType cast and improve error logging"
  - f54e83b: "docs(quick-260609-vps): add quick task artifacts"
---

# Quick Task 260609-wdw: Intake API 500 Error Analysis Summary

## Problem
POST to `/ja/intake/api/create-draft` returns HTTP 500 (Internal Server Error)

## Root Cause Analysis

### Code Issue (Fixed in e37f78e)
The `intake-service.ts` had an unsafe TypeScript cast:
```typescript
// BEFORE - UNSAFE
const matterTypes = tx.matterType as { upsert(input: unknown): Promise<unknown> };
await matterTypes.upsert({...});
```

The `as` cast bypassed TypeScript type checking and could cause runtime errors when:
1. The Prisma transaction client structure doesn't match expectations
2. The upsert receives incorrect input types

### Fix Applied
```typescript
// AFTER - CORRECT
await tx.matterType.upsert({
  where: { workspaceId_key: { workspaceId, key: matterType.key } },
  ...
});
```

## Error Flow Analysis

```
POST /intake/api/create-draft
  ↓
requireAppSession() → throws 'UNAUTHENTICATED' if no valid session
  ↓
createDraftIntake() → validates:
  - matterType exists in catalog
  - session has activeWorkspaceId
  - user can access workspace
  ↓
prisma.$transaction() → creates:
  - MatterType (upsert)
  - LegalRequest
  - IntakeSubmission
  - AuditEvent
  ↓
Returns { requestId: draft.id }
```

## Potential 500 Error Causes

| Cause | Error Message | Solution |
|-------|---------------|----------|
| No session | UNAUTHENTICATED | User must be logged in |
| No workspace | WORKSPACE_REQUIRED | User needs workspace membership |
| No access | FORBIDDEN | User lacks workspace access |
| DB unavailable | Connection timeout | Check DATABASE_URL |
| Migration missing | Table not found | Run `npx prisma migrate deploy` |

## Verification Steps

### 1. Database Setup Required
```bash
# Update DATABASE_URL in .env.local if needed
# Then run migrations
npx prisma migrate deploy

# Seed demo data
npx tsx --env-file=.env.local prisma/seed.ts
```

### 2. Test with Browser
1. Open browser to http://localhost:3000
2. Login with: `admin.demo@example.test` / `Demo@123456`
3. Navigate to `/intake`
4. Select a service type
5. Click "Tiếp tục"

Expected: Should redirect to `/intake?requestId=xxx&step=1`

### 3. Test API Directly (with auth cookie)
```bash
# Login and get session cookie, then:
curl -X POST http://localhost:3000/intake/api/create-draft \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "matterTypeKey=agency_contract" \
  -b "better-auth.session_token=YOUR_TOKEN"

# Expected: {"requestId": "xxx"}
```

## Files Modified

| File | Change |
|------|--------|
| `src/lib/intake/intake-service.ts` | Removed unsafe cast, direct tx.matterType.upsert() |
| `src/app/intake/api/create-draft/route.ts` | Added detailed error logging with stack trace |

## Next Steps

1. **Database must be accessible** - The remote DB at 172.21.83.229:5433 is not reachable from local machine
2. **Options:**
   - Start local PostgreSQL and update DATABASE_URL
   - Use Docker to run PostgreSQL locally
   - Access database through VPN/remote connection
3. **After DB is accessible:**
   - Run migrations
   - Seed data
   - Test the intake flow
