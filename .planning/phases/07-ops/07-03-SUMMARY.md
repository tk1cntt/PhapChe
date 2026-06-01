---
phase: 07-ops
plan: 03
subsystem: ops
tags:
  - frontend
  - audit
  - rbac
  - security
requires:
  - 07-01
provides:
  - Request-specific safe ops timeline UI
affects:
  - src/app/admin/ops/[requestId]/page.tsx
tech_stack:
  added: []
  patterns:
    - Next.js App Router async Server Component
    - AdminShell/PageHeader/Card/Table/Badge admin UI primitives
    - Safe DTO rendering via getOpsRequestTimeline
decisions:
  - Timeline page delegates request scoping and admin authorization to requireAppSession and getOpsRequestTimeline.
  - Page renders only safe timeline DTO fields and uses generic error copy on failures.
metrics:
  duration: "not recorded"
  completed: "2026-06-01T00:00:00Z"
  tasks: 2
  files_changed: 2
key_files:
  created:
    - src/app/admin/ops/[requestId]/page.tsx
  modified: []
---

# Phase 07 Plan 03: Ops Request Timeline Summary

Admins can open a request-specific ops timeline that shows safe audit/workflow chronology without exposing raw legal, document, review, vault, or intake content.

## Completed Tasks

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Build request-specific safe timeline page | 8808eaa | src/app/admin/ops/[requestId]/page.tsx |
| 2 | Block timeline sensitive-content leakage at page layer | 2d88014 | src/app/admin/ops/[requestId]/page.tsx |

## What Changed

- Added `/admin/ops/[requestId]` as an async Server Component.
- Page awaits `params`, reads `requestId`, calls `requireAppSession`, then calls `getOpsRequestTimeline(session, requestId)`.
- Rendered `AdminShell`, `PageHeader`, safety note, `Quay lại vận hành` link, and a timeline table.
- Timeline table includes Time, Actor, Kind, Action/status change, Target identifier, Reason, Correlation ID, and `metadataSummary`.
- Empty state uses the required copy: `Chưa có sự kiện audit` and `Timeline sẽ hiển thị khi hồ sơ có workflow transition hoặc audit event an toàn.`
- Error/unauthorized state uses generic operational copy and does not dump errors, stack traces, request internals, or raw objects.

## Verification

| Command | Result | Notes |
|---|---|---|
| `test -f 'src/app/admin/ops/[requestId]/page.tsx'` plus required-string source checks | Passed | Page exists and includes required imports/copy/fields. |
| Source scan for forbidden Prisma import/query strings | Passed | No direct Prisma import/query in the page. |
| Source scan for sensitive field names and object dumps | Passed | No `generatedContent`, `generalComment`, `checklist`, `storageKey`, raw content markers, `JSON.stringify`, or `error.stack`. |
| `npx tsc --noEmit --pretty false` scoped to `src/app/admin/ops/[requestId]/page.tsx` | Passed | No TypeScript errors from the new page. |
| `npm run typecheck` | Failed | Pre-existing unrelated TypeScript errors remain outside this plan. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scoped typecheck result to the timeline page because repository-wide typecheck fails outside this plan**
- **Found during:** Task 1 verification
- **Issue:** `npm run typecheck` fails in unrelated pre-existing files such as admin templates, intake upload handling, reviewer pages, document draft service, and foundation tests.
- **Fix:** Confirmed `npx tsc --noEmit --pretty false` reports no errors for `src/app/admin/ops/[requestId]/page.tsx`.
- **Files modified:** None
- **Commit:** N/A

## Deferred Issues

- Repository-wide `npm run typecheck` still fails due to unrelated pre-existing errors outside this plan. These were not changed because the plan scope is limited to `src/app/admin/ops/[requestId]/page.tsx`.

## Known Stubs

None.

## Threat Flags

None. The new route is the planned Phase 7 ops timeline surface and renders only safe DTO fields from the existing ops service.

## Self-Check: PASSED

- Found created file: `src/app/admin/ops/[requestId]/page.tsx`
- Found created file: `.planning/phases/07-ops/07-03-SUMMARY.md`
- Found commit: `8808eaa`
- Found commit: `2d88014`
