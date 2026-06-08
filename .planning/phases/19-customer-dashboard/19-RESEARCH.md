# Phase 19: customer-dashboard - Research

**Researched:** 2026-06-08
**Status:** Ready for planning

## Research Goal

Plan a customer-facing dashboard at `/customer/requests` that lists only the logged-in customer's own legal requests, links each request to status detail, and exposes delivered-result links only for delivered/closed requests.

## Source Context

- Phase context: `.planning/phases/19-customer-dashboard/19-CONTEXT.md`
- Roadmap: `.planning/ROADMAP.md`
- State: `.planning/STATE.md`
- Requirements file: `.planning/REQUIREMENTS.md` is absent in the current workspace, so this phase is driven by CONTEXT decisions D-01 through D-20 and project constraints.

## Existing Implementation Patterns

### Customer delivery detail already exists

`src/app/customer/requests/[requestId]/page.tsx` already implements the delivered-result detail route. It:

- Calls `requireAppSession()`.
- Uses `getCustomerDeliveryRequest(session, requestId)` from `src/lib/delivery/delivery-service.ts`.
- Converts forbidden/not-found access errors to `notFound()`.
- Shows final documents only through the existing vault/signed URL flow.

Planning implication: the new dashboard must link delivered/closed requests to this page instead of duplicating download logic.

### Status detail already exists

`src/app/requests/[requestId]/page.tsx` already implements the post-intake status detail route. It:

- Calls `requireAppSession()`.
- Uses `canAccessRequest(session, requestId)` before loading request data.
- Displays Vietnamese status copy and Ant Design `Tag`/`Card` UI.

Planning implication: every dashboard row should link to `/requests/[requestId]`, and this page should gain a clear CTA back to `/customer/requests`.

### Table/list pattern already exists

`src/app/specialist/requests/SpecialistRequestsTable.tsx` provides a compact Ant Design table pattern with:

- `RequestStatus` label/tone mapping.
- `Tag`, `Button`, `Table` columns.
- `formatDate()` using `Intl.DateTimeFormat('vi-VN')`.
- Empty table copy through `locale.emptyText`.

Planning implication: the simplest route is to create a small customer-specific client table component, reusing the same status label values and adapting columns/actions for customers.

### Specialist list API has a security caveat

`src/app/api/specialist/requests/route.ts` scopes by `workspaceId` and `assignedSpecialistId`, but catches all errors and returns `[]` with HTTP 200.

Planning implication: avoid copying the catch-all error swallowing unless existing project conventions require it. Prefer a server component query for `/customer/requests/page.tsx` so access is enforced server-side and the page redirects/throws through `requireAppSession()` naturally.

## Recommended Architecture

### Use server component page + small client table

Recommended minimal structure:

- `src/app/customer/requests/page.tsx`: server component, calls `requireAppSession()`, queries `prisma.legalRequest.findMany()`, passes serialized rows to client table.
- `src/app/customer/requests/CustomerRequestsTable.tsx`: client component for Ant Design table/action rendering.
- `src/app/requests/[requestId]/page.tsx`: add CTA/link back to `/customer/requests`.
- `e2e/customer-dashboard.spec.ts`: Playwright coverage for login, intake-created request visibility, and status-detail navigation.

This avoids adding a new API route unless needed, keeps owner/workspace scoping server-side, and matches the existing specialist table pattern.

### Server-side query requirements

The dashboard query must include both workspace and owner filters:

```ts
where: {
  workspaceId: session.activeWorkspaceId ?? '',
  createdById: session.userId,
}
```

Select only customer-safe fields:

```ts
select: {
  id: true,
  title: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  intakeSubmission: { select: { matterTypeKey: true } },
}
```

Order newest first:

```ts
orderBy: { createdAt: 'desc' }
```

Do not select or render internal notes, reviewer comments, specialist assignment fields, tags/folder mutation controls, unapproved drafts, or other users' requests.

## UI Requirements for Planning

The dashboard should provide:

- Route: `/customer/requests`.
- Header in Vietnamese, e.g. `Yêu cầu của tôi`.
- Copy explaining users can track submitted legal requests.
- Primary CTA to `/intake`, especially in empty state.
- Columns/cards showing:
  - Request title.
  - Vietnamese status tag.
  - Matter type or `Chưa có loại vụ việc`.
  - Created date.
  - Updated date if selected reliably.
  - Actions:
    - `Xem trạng thái` -> `/requests/{id}` for every row.
    - `Xem tài liệu` -> `/customer/requests/{id}` only when status is `delivered` or `closed`.

Use existing Ant Design primitives: `Card`, `Table`, `Tag`, `Button`, `Flex`, `Typography` or matching current style.

## Testing Requirements

Project instructions require every UI feature and every fix to have testcase coverage. Phase 19 must include Playwright E2E.

Recommended E2E scope:

- File: `e2e/customer-dashboard.spec.ts`.
- Reuse `e2e/helpers.ts` login helpers.
- Create a request through existing intake flow or seed/setup helper consistent with existing tests.
- Assert `/customer/requests` shows the created request title.
- Click `Xem trạng thái` and assert navigation reaches `/requests/[requestId]` and renders status page content.
- If delivered seed data exists, assert delivered/closed request shows `Xem tài liệu`; otherwise assert non-delivered intake request does not show final-document action.

## Security Threat Considerations

Plans must include a `<threat_model>` block. Threats to account for:

- Cross-tenant data leak: dashboard lists requests from another workspace.
- Cross-user data leak: dashboard lists another customer's requests in same workspace.
- Premature document exposure: non-delivered requests expose delivery/download link.
- Internal information disclosure: customer dashboard exposes assignment/reviewer/internal workflow metadata.
- Frontend-only filtering: server returns unauthorized rows and UI hides them.

Mitigations:

- Query with `workspaceId` and `createdById` in server-side Prisma call.
- Select only customer-safe fields.
- Render delivery action only for `delivered`/`closed` and delegate actual document access to existing delivery page/service.
- E2E checks visible behavior; implementation review should inspect query and selected fields.

## Validation Architecture

Nyquist validation should sample the actual user journey, not just file existence:

1. Static/code checks:
   - `src/app/customer/requests/page.tsx` contains `requireAppSession()`.
   - `src/app/customer/requests/page.tsx` filters by `createdById: session.userId`.
   - `src/app/customer/requests/page.tsx` filters by `workspaceId: session.activeWorkspaceId` or equivalent.
   - `CustomerRequestsTable.tsx` links `/requests/${record.id}` for status detail.
   - Delivery link conditional checks `delivered` or `closed`.
2. E2E checks:
   - Intake-created request appears on `/customer/requests`.
   - Status-detail navigation works.
   - Non-delivered request does not expose final-document link.
3. Regression checks:
   - `/customer/requests` does not blank-page/runtime error.
   - `/requests/[requestId]` still renders after CTA addition.

## Planning Notes

A single executable plan is sufficient for this phase. Splitting into multiple plans would add overhead without meaningful parallelism because the page, table, CTA, and e2e test are tightly connected.

## RESEARCH COMPLETE
