---
phase: 16
slug: fix-14-failed-routes-discovered-by-validated-screenshot-capt
status: approved
created: 2026-06-06
---

# Phase 16 — UI Design Contract

## Purpose

Repair the 14 failed routes from validated screenshot quick task `260606-pfi` without introducing a new visual direction. The UI contract is: pages must render intentional, readable states using the existing Ant Design design system; no broken runtime overlays, blank pages, or accidental 404/500 screenshots.

## Design Principles

1. **Repair, not redesign** — preserve the Phase 14 Ant Design layout direction.
2. **Intentional states only** — if a user lacks access or data is empty, show a clear AntD page/card state instead of crashing or raw Next 404.
3. **Role-aware screens** — admin, specialist, reviewer, and customer views may differ by permission, but each valid role scenario must render a complete screen.
4. **Screenshot honesty** — screenshots are evidence only after validation passes.

## Layout Contract

### Global structure

- Continue using existing route shells and Ant Design components (`Card`, `Flex`, `Typography`, `Table`, `Tag`, `Button`).
- Do not introduce a new layout framework.
- Keep existing left navigation/admin shell behavior where already present.

### Page headers

Each repaired page should have:

- A visible `Typography.Title` or equivalent heading.
- A short explanatory paragraph for operational/legal context where existing pages already use one.
- No blank body on valid route scenarios.

### Tables

For queue/dashboard/detail lists:

- Use AntD `Table` with consistent `rowKey`, `pagination={false}` unless existing page uses another pattern.
- Table render functions must live in Client Components when required by Next/AntD boundary rules.
- Server Components should pass serializable DTOs only: strings, numbers, booleans, arrays, plain objects. Convert `Date` to formatted string or ISO string before passing to client.

## State Contract

### Empty state

Use an AntD `Card` or `Table.locale.emptyText` with clear copy:

- Specialist queue: `Chưa có yêu cầu nào được giao cho bạn.`
- Reviewer queue: `Chưa có tài liệu cho duyệt.`
- Ops/dashboard: `Chưa có dữ liệu vận hành.` or existing equivalent.
- Vault/templates/admin lists: clear Vietnamese message explaining no data exists.

### Access denied state

For role mismatch scenarios that are intentionally denied:

- Show a visible card/message such as `Bạn không có quyền xem nội dung này.`
- Do not render raw 500, blank page, or Next error overlay.
- Do not weaken backend authorization just to make pages render.

### Not found state

For invalid IDs:

- A deliberate not-found UI is acceptable only when the validation scenario intentionally uses invalid data.
- For seeded valid scenarios, dynamic routes must render content/empty/access-denied state, not raw accidental 404.

### Error state

For recoverable load failures:

- Show a card with concise error text and, where useful, a link back to list page.
- Do not expose raw legal content, secrets, stack traces, DB connection strings, or internal IDs beyond safe identifiers already expected in ops/audit views.

## Typography Contract

- Keep existing heading sizes and AntD Typography usage.
- Vietnamese copy should be readable and user-facing.
- Do not introduce mixed English/Vietnamese labels unless the existing ops/audit context already uses technical labels like `metadataSummary`, `Correlation ID`, `Specialist`, or `Reviewer`.

## Color Contract

- Use existing AntD Tag color semantics:
  - `blue` for info/active/process states
  - `orange` for warning/pending states
  - `cyan` for approved/accent states
  - `red` for destructive/error/rejected states
  - `default` for neutral states
- Avoid ad-hoc new brand colors unless already present in existing files.

## Interaction Contract

- Existing buttons/links should remain keyboard accessible.
- Detail links should point to valid role-appropriate routes when data exists.
- Forms/actions on template routes should not be redesigned in this phase; only repair render/access issues needed for validation.

## Route-Specific Contracts

### `/specialist/requests`

- Shows specialist queue with assigned requests or clear empty state.
- Table rows include request title, customer, matter type, status, date, and action link when data exists.
- Must not pass render functions from Server Component to Client Component.

### `/reviewer/requests`

- Shows reviewer queue with pending document versions or clear empty state.
- Notice tags for approval/revision query params remain visible if applicable.
- Must not pass render functions from Server Component to Client Component.

### `/admin/ops` and `/admin/ops/[requestId]`

- Ops dashboard/timeline should render summary cards/tables or intentional empty/denied states.
- Audit/timeline content must stay safe: identifiers, action, reason, correlation ID, metadataSummary; no raw legal content.
- Must eliminate `Element type is invalid` runtime failure.

### Admin template/users/vault routes

- Authorized admin scenario should render list/detail/create/classification UI or intentional empty state.
- If route requires coordinator/super admin, validate with appropriate demo user/session.

### Customer/request detail routes

- Valid customer-owned request scenario should render detail/delivery/status UI.
- Invalid ownership should render intentional denied/not-found state without runtime error.

## Validation Evidence Contract

Final validation artifacts should include:

- Route-by-route result for the original 14 failed routes.
- Screenshot path for each PASS route.
- Reason for any intentionally non-captured route.
- No screenshots for pages with HTTP 500, blank body, runtime overlay, or accidental 404.

## Non-Goals

- No new visual redesign.
- No new dashboard widgets or workflow features.
- No broad visual regression framework unless planner deems a small script update necessary.
- No weakening auth/permissions.

## Approval

This UI-SPEC is approved for planning. Planner should treat it as a repair contract, not a redesign brief.
