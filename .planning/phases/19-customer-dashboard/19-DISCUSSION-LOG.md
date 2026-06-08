# Phase 19: customer-dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 19-customer-dashboard
**Mode:** auto
**Areas discussed:** Customer Dashboard Scope, Dashboard Data, User Actions, Security And Workflow Integrity, UI And Test Expectations

---

## Customer Dashboard Scope

| Option | Description | Selected |
|--------|-------------|----------|
| `/customer/requests` dashboard | Add a customer-owned dashboard listing requests created by the logged-in user. | ✓ |
| Extend `/requests/[id]` only | Keep only per-request status pages and avoid a list page. | |
| Reuse admin dashboard | Expose admin request list to customer with filters. | |

**User's choice:** Auto-selected `/customer/requests` dashboard based on prior explicit request.
**Notes:** User said the current product lacks a dashboard for users/customers to manage their requests.

---

## Dashboard Data

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal request list | Show title, status, matter type, created date, and last updated date where available. | ✓ |
| Ops-style metrics | Add counts, SLA, workload, filters like admin ops. | |
| Delivery-only list | Show only delivered requests with final documents. | |

**User's choice:** Auto-selected minimal request list.
**Notes:** This matches the requested customer management dashboard without expanding into internal ops features.

---

## User Actions

| Option | Description | Selected |
|--------|-------------|----------|
| Status + delivered-result links | All rows link to `/requests/[id]`; delivered/closed rows also link to `/customer/requests/[id]`. | ✓ |
| Download directly in dashboard | Put signed download links directly in the list. | |
| Mutation actions | Let customer cancel/edit/advance requests from dashboard. | |

**User's choice:** Auto-selected status + delivered-result links.
**Notes:** Keeps signed download behavior centralized in the existing customer delivery detail page.

---

## Security And Workflow Integrity

| Option | Description | Selected |
|--------|-------------|----------|
| Server/API owner and workspace scoping | Query only current user's requests in current workspace and enforce via session. | ✓ |
| Frontend-only filtering | Fetch broad request list and filter in browser. | |
| Admin-style broad visibility | Let customer see all workspace requests. | |

**User's choice:** Auto-selected strict server/API owner and workspace scoping.
**Notes:** Required by project constraints: sensitive legal files, tenant/request permissions, workflow integrity.

---

## UI And Test Expectations

| Option | Description | Selected |
|--------|-------------|----------|
| Ant Design + Playwright e2e | Reuse existing AntD list/table patterns and add e2e coverage for dashboard. | ✓ |
| Custom CSS dashboard | Build a new custom visual system. | |
| No e2e | Rely on manual testing only. | |

**User's choice:** Auto-selected Ant Design + Playwright e2e.
**Notes:** Project instruction requires every UI feature to include a testcase.

---

## Claude's Discretion

- Planner/executor may choose server component or API + client table, as long as security is enforced server/API-side.
- Planner/executor may choose table or responsive card layout, as long as customer can read and navigate requests clearly.

## Deferred Ideas

- Advanced search/filter/sort facets.
- Real-time updates.
- In-dashboard document preview.
- Customer-side cancel/edit request actions.
