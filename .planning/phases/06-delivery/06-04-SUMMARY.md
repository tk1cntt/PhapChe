---
phase: 06-delivery
plan: 04
subsystem: delivery
tags: [delivery, customer-portal, specialist-actions, workflow]
dependency_graph:
  requires:
    - src/lib/delivery/delivery-service.ts
    - src/app/api/vault/[vaultFileId]/download/route.ts
    - src/app/admin/components/ui.tsx
  provides:
    - src/app/customer/requests/[requestId]/page.tsx
    - markDeliveredAction
    - closeDeliveredAction
  affects:
    - customer delivery UI boundary
    - specialist delivery mutation forms
tech_stack:
  added: []
  patterns:
    - Next.js server components with Promise params
    - server actions wrapping backend delivery services
    - existing Card/Button/Badge/PageHeader visual language
key_files:
  created:
    - src/app/customer/requests/[requestId]/page.tsx
  modified:
    - src/app/specialist/requests/[requestId]/actions.ts
    - src/app/specialist/requests/[requestId]/page.tsx
decisions:
  - Customer delivery page uses only getCustomerDeliveryRequest DTO and vault download route links.
  - Specialist deliver/close UI is status-gated, while delivery service remains authority for validation.
  - Server actions are void-compatible for current Next form action typing and keep planned Vietnamese messages as constants.
metrics:
  tasks: 3
  completed_at: 2026-05-31T14:30:00Z
  duration: unknown
---

# Phase 06 Plan 04: Delivery UI Wiring Summary

## One-liner

Customer final-document page and specialist deliver/close forms now expose Phase 06 delivery workflow without leaking internal document data.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create customer final-document request page | 168deb6 | src/app/customer/requests/[requestId]/page.tsx |
| 2 | Add internal deliver and close server actions | 0354525 | src/app/specialist/requests/[requestId]/actions.ts |
| 3 | Place deliver and close controls in specialist request detail | 6da4c5c | src/app/specialist/requests/[requestId]/actions.ts, src/app/specialist/requests/[requestId]/page.tsx |

## What Changed

- Added customer route `/customer/requests/[requestId]` using `requireAppSession()` and `getCustomerDeliveryRequest(session, requestId)`.
- Rendered Vietnamese customer copy: `Yêu cầu pháp lý`, `Tài liệu cuối cùng`, `Chưa có tài liệu`, `Tải xuống`, and `Liên kết tải xuống có hiệu lực trong 15 phút.`.
- Customer page shows request title, status badge, matter type, created date, final document rows, template version, and download links via `/api/vault/${vaultFileId}/download`.
- Customer page avoids internal imports and avoids rendering drafts, generated content, input snapshots, reviewer data, checklist data, vault file lists, or storage keys.
- Added `markDeliveredAction(formData)` and `closeDeliveredAction(formData)` to call `markRequestDelivered()` and `closeDeliveredRequest()` through backend services.
- Close action trims reason and does not call service when reason is blank.
- Added specialist `Giao và đóng hồ sơ` card: approved requests show `Giao cho khách hàng`; delivered requests show required `Lý do đóng hồ sơ` textarea and `Đóng hồ sơ` submit.

## Verification

| Command | Result | Notes |
| ------- | ------ | ----- |
| `npm run typecheck -- --pretty false` | Failed | Existing unrelated TypeScript errors remain in admin templates, intake, reviewer pages, draft service/tests, foundation e2e, and upload service. Plan-file errors found during Task 3 were fixed. |
| `npm test -- src/lib/delivery/delivery-service.test.ts` | Failed | Project has no `test` script in `package.json`. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made specialist form actions compatible with current Next typing**
- **Found during:** Task 3
- **Issue:** `<form action={markDeliveredAction}>` and `<form action={closeDeliveredAction}>` rejected actions returning `Promise<SpecialistRequestActionResult>`.
- **Fix:** Changed exported form actions to `Promise<void>` and retained required Vietnamese messages as constants in actions file.
- **Files modified:** src/app/specialist/requests/[requestId]/actions.ts
- **Commit:** 6da4c5c

**2. [Rule 1 - Bug] Imported Button for new specialist controls**
- **Found during:** Task 3
- **Issue:** New specialist controls used `<Button>` without importing it.
- **Fix:** Added `Button` to existing admin UI import.
- **Files modified:** src/app/specialist/requests/[requestId]/page.tsx
- **Commit:** 6da4c5c

**3. [Rule 3 - Blocking] Scoped typecheck assessment to plan files**
- **Found during:** Task 1, Task 2, Task 3 verification
- **Issue:** Full project typecheck fails on pre-existing unrelated files outside this plan.
- **Fix:** Fixed plan-file typecheck errors when reported; remaining typecheck output contains only unrelated pre-existing errors.
- **Files modified:** None.
- **Commit:** 168deb6, 0354525, 6da4c5c

## Deferred Issues

- Full project typecheck has pre-existing unrelated TypeScript errors outside this plan.
- `npm test -- src/lib/delivery/delivery-service.test.ts` remains unavailable because `package.json` has no `test` script.

## Known Stubs

None introduced by this plan.

## Threat Flags

None. Plan threat model covered customer browser boundary, customer page to download route, and specialist form to server action boundary.

## Self-Check: PASSED

- Created files exist:
  - src/app/customer/requests/[requestId]/page.tsx
  - .planning/phases/06-delivery/06-04-SUMMARY.md
- Modified files exist:
  - src/app/specialist/requests/[requestId]/actions.ts
  - src/app/specialist/requests/[requestId]/page.tsx
- Commits exist:
  - 168deb6
  - 0354525
  - 6da4c5c
- Shared orchestrator artifacts were not modified by this agent.
