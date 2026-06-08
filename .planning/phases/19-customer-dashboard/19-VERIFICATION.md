---
phase: 19
slug: customer-dashboard
status: passed
verified: 2026-06-08
---

# Phase 19 Verification — customer-dashboard

## Verdict

**status: passed**

Phase 19 achieved its goal: customers can view a protected dashboard of their own requests at `/customer/requests`, navigate to status detail, and avoid premature final-document exposure for non-delivered requests.

## Must-Haves Verification

| Must-have | Evidence | Status |
|---|---|---|
| `/customer/requests` route exists | `src/app/customer/requests/page.tsx` exists | Passed |
| Server-side auth/session enforced | `page.tsx` contains `const session = await requireAppSession();` | Passed |
| Workspace scoping enforced | `page.tsx` contains `workspaceId: session.activeWorkspaceId ?? ''` | Passed |
| Owner scoping enforced | `page.tsx` contains `createdById: session.userId` | Passed |
| Newest-first ordering | `page.tsx` contains `orderBy: { createdAt: 'desc' }` | Passed |
| Customer-safe fields shown | `page.tsx` selects id/title/status/createdAt/updatedAt/intake matter type only | Passed |
| Empty state links to intake | `page.tsx` contains `Bạn chưa có yêu cầu nào` and `/intake` | Passed |
| Every request can open status detail | `CustomerRequestsTable.tsx` links `/requests/${record.id}` with `Xem trạng thái` | Passed |
| Delivered result link only for delivered/closed | `CustomerRequestsTable.tsx` checks `record.status === 'delivered' || record.status === 'closed'` | Passed |
| Status detail links back to dashboard | `src/app/requests/[requestId]/page.tsx` contains `/customer/requests` and `Xem tất cả yêu cầu của tôi` | Passed |
| UI testcase exists | `e2e/customer-dashboard.spec.ts` exists | Passed |
| UI testcase passes | `npx playwright test e2e/customer-dashboard.spec.ts` passed | Passed |

## Automated Checks Run

```text
npm run typecheck
```

Result: passed.

```text
npx playwright test e2e/customer-dashboard.spec.ts
```

Result: passed — 1 test.

## Security Threat Verification

| Threat | Result |
|---|---|
| Cross-tenant leak | Mitigated by `workspaceId` filter |
| Cross-user leak | Mitigated by `createdById` filter |
| Premature document exposure | Mitigated by delivered/closed conditional link and E2E assertion that non-delivered request has no `Xem tài liệu` link |
| Internal metadata disclosure | Mitigated by narrow Prisma select and customer-only table columns |
| Frontend-only filtering | Mitigated by server-side Prisma query in route page |

## Human Verification

None required. Automated E2E covers the new customer dashboard flow.

## VERIFICATION PASSED
