# Phase 17: Fix Remaining Routes After Phase 16 Client Component Conversion - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning
**Source:** Phase 16 execution status report + validation-results.json

<domain>
## Phase Boundary

Fix 8 remaining routes that still fail after Phase 16 client component conversion. Phase 16 successfully converted 6/14 routes to Client Component + API route pattern.

</domain>

<decisions>
## Implementation Decisions

### Phase 16 Results - PASS (6 routes)
- ✅ /admin/routing
- ✅ /admin/templates
- ✅ /admin/templates/new
- ✅ /admin/vault
- ✅ /reviewer/requests
- ✅ /specialist/requests

### Phase 16 Results - FAIL (8 routes)
- **D-01:** /admin/ops - Sign-in failed, session issue
- **D-02:** /admin/ops/[requestId] - HTTP 500, OpsRequestTimelinePage component missing
- **D-03:** /admin/templates/[templateId] - 404 (sample-template-id not found)
- **D-04:** /admin/users - Console warning (deprecated Space direction prop)
- **D-05:** /customer/requests/[requestId] - 404 (sample-request-id not found)
- **D-06:** /requests/[requestId] - 404 (sample-request-id not found)
- **D-07:** /reviewer/requests/[requestId]/review/[documentVersionId] - 404
- **D-08:** /specialist/requests/[requestId] - 404 (sample-request-id not found)

### Root Causes
- **D-09:** Dynamic routes use placeholder IDs (sample-request-id, sample-template-id, etc.) instead of real seeded IDs from database
- **D-10:** OpsRequestTimelinePage component not imported/exported correctly in /admin/ops/[requestId]
- **D-11:** /admin/users has antd Space component deprecated warning

### Approach
- **D-12:** Fix validation harness to query real IDs from Prisma database
- **D-13:** Create/use OpsTimelineTable client component for /admin/ops/[requestId]
- **D-14:** Fix antd Space deprecated warning in /admin/users
- **D-15:** Update validation harness with real seeded request/template/document IDs
- **D-16:** Re-run validation against all 14 routes

</decisions>

<canonical_refs>
## Canonical References

### Phase 16 artifacts
- `.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs` — Validation harness
- `.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/phase-16-validation-results.json` — Current validation results

### Failing route source files
- `src/app/admin/ops/[requestId]/page.tsx` — OpsTimelinePage missing component
- `src/app/admin/users/page.tsx` — Space deprecated warning
- `src/app/specialist/requests/[requestId]/page.tsx` — Dynamic route with placeholder ID
- `src/app/customer/requests/[requestId]/page.tsx` — Dynamic route with placeholder ID
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` — Dynamic route

### Working patterns from Phase 16
- `src/app/admin/ops/page.tsx` — Working ops dashboard (Client Component + API)
- `src/app/specialist/requests/page.tsx` — Working specialist queue (Client Component)
- `src/app/reviewer/requests/page.tsx` — Working reviewer queue (Client Component)

### Database
- `prisma/schema.prisma` — Real seeded IDs needed for validation
- `prisma/seed.ts` — Seeded demo data

</canonical_refs>

<specifics>
## Specific Fixes Required

### 1. Validation Harness Fix (HIGH PRIORITY)
- Query Prisma for real seeded IDs
- Replace placeholder IDs with real request/template/document IDs
- Example: `cmq0xjppi00004wrq1mlc5qs6` from seed

### 2. OpsTimelineTable Component (HIGH PRIORITY)
- /admin/ops/[requestId] fails with HTTP 500
- OpsRequestTimelinePage component error - likely not exported
- Similar to SpecialistRequestsTable pattern

### 3. /admin/users Console Warning (LOW PRIORITY)
- `Warning: [antd: Space] direction is deprecated. Please use orientation instead.`
- Fix in Space component usage

### 4. Dynamic Routes with Placeholder IDs
- All dynamic routes return 404 because placeholder IDs don't exist
- Need to seed real data OR update validation harness with real IDs

</specifics>

<deferred>
## Deferred Ideas

- None — focus on completing the 14-route validation goal from Phase 16

</deferred>

---

*Phase: 17-fix-remaining-routes-after-phase-16-client-component-convers*
*Context gathered: 2026-06-07 via Phase 16 validation results*
