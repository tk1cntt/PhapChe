---
gsd_quick: true
quick_id: 260609-tnt
slug: fix-404-api-routes-en-api-audit-events-a
description: Fix 404 API routes: /en/api/audit/events and /en/api/vault
date: 2026-06-09
status: planned
must_haves:
  - /en/api/audit/events returns 200 with audit events
  - /en/api/vault returns 200 with vault data
---

# Quick Plan: fix-404-api-routes

## Task 1: Create [locale]/api/audit/events/route.ts

**files:**
- `src/app/[locale]/api/audit/events/route.ts` (new)

**action:**
Create a wrapper that calls the main API route handler. The issue is that `/en/api/...` routes don't exist - only `/api/...` exist.

```typescript
import { GET as getAuditEvents } from '@/app/api/audit/events/route';

export { getAuditEvents as GET };
```

**verify:**
- `curl http://localhost:3000/en/api/audit/events` returns 200

**done:**
- /en/api/audit/events accessible

---

## Task 2: Create [locale]/api/vault/route.ts

**files:**
- `src/app/[locale]/api/vault/route.ts` (new)

**action:**
Create a wrapper that calls the main API route handler.

```typescript
import { GET as getVaultData } from '@/app/api/vault/route';

export { getVaultData as GET };
```

**verify:**
- `curl http://localhost:3000/en/api/vault` returns 200

**done:**
- /en/api/vault accessible
