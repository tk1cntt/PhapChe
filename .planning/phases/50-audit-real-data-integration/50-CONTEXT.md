---
phase: "50"
status: "in-progress"
date: "2026-06-13"
---

# Phase 50: Audit Real Data Integration

## Domain

Connect `/vi/admin/audit` to real audit/security events from Prisma database.

## Goal

User sees audit stat cards, security summary, activity timeline, and audit table with correlation IDs - matching `layout/admin-audit.html`.

## Success Criteria

1. User sees audit stat cards from audit log data
2. User sees security notice and security summary from real metrics
3. User sees activity timeline from audit events
4. User sees audit table with correlation IDs and action badges
5. UI matches `layout/admin-audit.html`

## Decisions

### API Endpoint Pattern

- [auto] **Use /api/admin/audit pattern** — following established admin API structure
  - `src/app/api/admin/audit/route.ts` with GET handler
  - Require admin session with `requireAppSession()`
  - Return `AuditEvent[]` with actor, workspace relations

### Component Structure

- [auto] **Clone from legacy source** — Reference `src/legacy/[locale]/admin/audit/page.tsx` as template
  - Create `AdminAuditClient.tsx` in `src/components/admin/`
  - Create child components: `AdminAuditStats.tsx`, `AdminAuditTimeline.tsx`, `AdminAuditTable.tsx`
  - Page at `src/app/[locale]/admin/audit/page.tsx` uses AdminLayout from layout.tsx (no duplicate)

### Pagination Pattern

- [auto] **Use usePaginationParams hook** — matching other admin pages (Users, Requests, Operations)
  - Default pageSize: 10
  - URL sync for page/pageSize
  - Debounced search

### Data Fetching

- [auto] **Prisma queries via service layer** — `src/lib/ops/audit-service.ts` or similar
  - Query `AuditEvent` model with relations
  - Filter by workspace, action, date range
  - Include pagination in service response

## Canonical Refs

- `src/legacy/[locale]/admin/audit/page.tsx` — source template
- `src/legacy/[locale]/admin/audit/audit.css` — styling reference
- `src/components/admin/AdminOperationsClient.tsx` — component pattern
- `src/components/admin/AdminOperationsTable.tsx` — table pattern
- `src/app/api/admin/operations/route.ts` — API endpoint pattern

## Deferred Ideas

None for this phase.
