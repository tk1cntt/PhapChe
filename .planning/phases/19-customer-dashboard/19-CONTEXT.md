# Phase 19: customer-dashboard - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning
**Mode:** auto

<domain>
## Phase Boundary

Build a customer-facing request dashboard at `/customer/requests` so logged-in customers can view and manage the legal requests they created, track processing status, and access delivered final documents. This phase connects the existing intake/status/delivery flow into a customer-owned dashboard. It does not add new workflow states, internal assignment behavior, search/filtering beyond the minimum list, or new document delivery mechanics.

</domain>

<decisions>
## Implementation Decisions

### Customer Dashboard Scope
- **D-01:** Add `/customer/requests` as the canonical customer request dashboard route.
- **D-02:** The dashboard lists only `LegalRequest` records where `createdById` matches the current logged-in user and `workspaceId` matches `session.activeWorkspaceId`.
- **D-03:** The dashboard is for customer self-service visibility: tracking requests, opening status detail, and reaching delivered results. Internal ops/reviewer/specialist actions remain outside this phase.

### Dashboard Data
- **D-04:** Each row/card must show request title, status, matter type if available, created date, and last updated date if available from the model; if no reliable updated timestamp exists, planner may use created date only and document the limitation.
- **D-05:** Status labels/colors should reuse the existing Vietnamese `RequestStatus` label/tone mapping used by request detail and delivery pages.
- **D-06:** Requests should be ordered newest first.
- **D-07:** Empty state should be customer-friendly and actionable: explain that no requests exist yet and provide a link/button to `/intake`.

### User Actions
- **D-08:** Every request must provide a primary action to open status detail at `/requests/[requestId]`.
- **D-09:** Requests with status `delivered` or `closed` should provide an additional action to open delivered results at `/customer/requests/[requestId]`.
- **D-10:** Requests that are not delivered/closed should not expose final-document download actions; they should point users to the status detail instead.
- **D-11:** Add a clear navigation/CTA path from the post-intake status page `/requests/[requestId]` back to `/customer/requests` so users can find all of their requests after submission.

### Security And Workflow Integrity
- **D-12:** All data access must be enforced server-side or API-side using `requireAppSession`, workspace scoping, and owner scoping; frontend filtering alone is not acceptable.
- **D-13:** The customer dashboard must not leak internal notes, reviewer comments, unapproved drafts, assignment metadata, folder/tag mutation controls, or other customers' requests.
- **D-14:** Do not hard-code workflow transitions in the frontend. The dashboard only displays backend status and links to existing status/delivery pages.
- **D-15:** Customer final documents remain accessible only through the existing delivery mechanism and signed URL flow on `/customer/requests/[requestId]`.

### UI And Test Expectations
- **D-16:** Follow the existing Ant Design route-group style: `Card`, `Table` or simple responsive cards, `Tag`, `Button`, `Flex`, and Vietnamese copy.
- **D-17:** Prefer the simplest implementation that matches current patterns. A small customer table/client component is acceptable if Ant Design table render functions require client boundaries.
- **D-18:** Add at least one Playwright e2e testcase for the new `/customer/requests` dashboard.
- **D-19:** The e2e test must verify that after an intake-created request exists, the dashboard shows that request and provides navigation to status detail; if seeded delivered data is available, also verify delivered-result link visibility.
- **D-20:** The implementation must avoid blank pages/runtime component errors on both `/customer/requests` and the linked detail pages.

### Claude's Discretion
- Exact desktop layout may be table or card list, as long as it is readable and consistent with existing Ant Design screens.
- Exact empty-state wording and spacing are left to planner/executor.
- Whether to implement data loading as a server component query or a small `/api/customer/requests` route is left to planner/executor, constrained by existing patterns and security rules.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and requirements context
- `.planning/ROADMAP.md` — Phase 19 roadmap entry and dependency context.
- `.planning/REQUIREMENTS.md` — Existing DLV requirements and security/workflow constraints.
- `.planning/PROJECT.md` — Product intent, Legal-as-a-Service constraints, security, traceability, and workflow integrity.
- `.planning/STATE.md` — Current milestone state and recent request/status quick-task context.

### Existing customer-facing request flow
- `src/app/intake/page.tsx` — Intake entry route that creates customer requests.
- `src/app/intake/actions.ts` — Intake submit/action flow that creates or advances requests.
- `src/app/requests/[requestId]/page.tsx` — Existing post-intake request status detail page.
- `src/app/customer/requests/[requestId]/page.tsx` — Existing customer delivery/result detail page.
- `src/lib/delivery/delivery-service.ts` — Existing delivered-document visibility and signed delivery portal URL behavior.

### Existing list/table/API patterns
- `src/app/specialist/requests/page.tsx` — Existing queue page pattern with client fetch and loading state.
- `src/app/specialist/requests/SpecialistRequestsTable.tsx` — Existing Ant Design table pattern for legal request rows.
- `src/app/api/specialist/requests/route.ts` — Existing API route pattern for workspace-scoped request list rows.
- `src/app/reviewer/requests/page.tsx` — Existing reviewer list page pattern.

### Security and data model
- `src/lib/security/session.ts` — `requireAppSession()` and session role/workspace data.
- `src/lib/security/rbac.ts` — Existing request access checks and customer ownership behavior.
- `prisma/schema.prisma` — `LegalRequest`, `IntakeSubmission`, `VaultFile`, and status fields.
- `prisma/seed.ts` — Existing demo user/request fixture patterns for e2e/dev validation.

### Testing patterns
- `e2e/intake-flow.spec.ts` — Existing intake submit and request status e2e flow.
- `e2e/request-status.spec.ts` — Existing regression test for post-intake request detail rendering.
- `e2e/auth.spec.ts` — Existing sign-in test/helper usage pattern.
- `e2e/helpers.ts` — Shared Playwright login helpers.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/customer/layout.tsx` — Existing customer route group layout with breadcrumb/header; `/customer/requests` should live under this layout.
- `src/app/customer/requests/[requestId]/page.tsx` — Existing customer result detail page; dashboard should link here for delivered/closed requests rather than duplicating download logic.
- `src/app/requests/[requestId]/page.tsx` — Existing status detail page; dashboard should link here for all statuses.
- `src/app/specialist/requests/SpecialistRequestsTable.tsx` — Existing Ant Design table row structure and status tag mapping that can be adapted for customer rows.
- `src/app/api/specialist/requests/route.ts` — Existing workspace-scoped request list API shape that can inspire a customer-scoped version if planner chooses API + client table.
- `src/lib/delivery/delivery-service.ts` — Existing rule that only delivered/closed requests expose final documents.

### Established Patterns
- Next.js App Router route files live under `src/app/**/page.tsx`.
- Protected pages use `requireAppSession()` and Prisma/service queries scoped by session workspace and user role/ownership.
- Ant Design is the current UI library across customer/admin/specialist/reviewer routes.
- Dynamic request routes must use real IDs in e2e/validation, not placeholders.
- UI features and fixes need Playwright coverage per project instruction.

### Integration Points
- The new dashboard route should connect the post-intake flow (`/requests/[requestId]`) with customer delivery detail (`/customer/requests/[requestId]`).
- Customer list data should come from `LegalRequest` joined with `intakeSubmission` for `matterTypeKey` and optionally counts/flags for delivered documents.
- Breadcrumb labels may need a new entry for `/customer/requests` if existing navigation helper does not already handle it.
- E2E should reuse `loginAs` helper and existing intake submission flow to create a request for the logged-in user.

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants the missing dashboard where users can manage requests they created after the Intake → Request flow.
- Use the requirements already proposed in conversation: `CST-01` through `CST-05`.
- The desired flow is: `/intake` → `/requests/[requestId]` → `/customer/requests` → `/customer/requests/[requestId]` when results are delivered.
- Keep the dashboard customer-facing and simple; avoid adding admin-like filtering or workflow mutation actions in this phase.

</specifics>

<deferred>
## Deferred Ideas

- Advanced search/filter/sort facets for customer requests are deferred unless the planner can add very basic status grouping without extra complexity.
- Real-time notifications or live status updates are deferred; dashboard can load on page visit.
- In-dashboard document preview is deferred; final document access stays on `/customer/requests/[requestId]`.
- Customer-side cancel/edit request actions are deferred because workflow transitions must remain backend state-machine controlled and are not part of this phase.

</deferred>

---

*Phase: 19-customer-dashboard*
*Context gathered: 2026-06-08*
