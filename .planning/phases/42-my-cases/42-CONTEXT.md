---
phase: 42
slug: my-cases
status: context-gathered
date: 2026-06-13
---

# Phase 42: My Cases — Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Task Boundary

Connect My Cases page (`src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx`) to real Prisma queries instead of mock data.

## Scope

**In scope:**
- Replace mock `stats` and `requests` props with real API/Prisma queries
- Connect search/filter to server-side filtering
- Map Prisma `LegalRequest` model to existing `MyCaseRow` interface
- Keep existing UI components (MyCasesTable, MyCasesToolbar, StatCards)

**Out of scope:**
- Creating new UI components
- Changing layout/structure
- Adding export functionality
- Real-time updates (Phase 43 handles messaging)

</domain>

<decisions>
## Implementation Decisions

### Data Fetching Strategy
- **Use Prisma service layer** (`src/lib/requests/requests-service.ts` or similar)
- **Server Components** for initial data load (React Server Components)
- **Client-side search/filter** with debounce for better UX

### Search Implementation
- **Client-side filtering** with `useMemo` (existing pattern in MyCasesClient.tsx line 47-66)
- **Debounce** search input by 300ms
- **URL state** sync for search/filters (shareable URLs)

### Filter Options
- **Status filter**: Map to `LegalRequest.status` enum values
- **Search**: Search across `code`, `type`, `specialistName`
- **No type filter** in v1 (keep it simple)

### Stats Calculation
- **Aggregate from Prisma** with `$group` or count queries
- **4 stat cards**: Total, Processing, Completed, Overdue
- **Status mappings**:
  - Processing = `in_review`, `needs_response`
  - Completed = `approved`, `delivered`
  - Overdue = where deadline < now AND status NOT completed

### Pagination
- **Client-side pagination** with 20 items per page
- **Total count** from aggregation query

### Response Format
- Map `LegalRequest` to `MyCaseRow` interface
- Include SLA calculation from `dueDate`
- Include status badge mapping

</decisions>

<specifics>
## Existing Code to Reuse

**Mock UI already built:**
- `src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx` — Main component with filter logic
- `src/legacy/[locale]/customer/components/MyCasesTable.tsx` — Table with 7 columns
- `src/legacy/[locale]/customer/components/MyCasesToolbar.tsx` — Search and filter toolbar
- `src/app/[locale]/customer/components/StatCard.tsx` — Stat cards

**Existing interfaces:**
```typescript
interface MyCaseRow {
  id: string;
  code: string;
  statusText: string;
  type: string;
  typeEn: string;
  statusBadge: 'review' | 'pending' | 'approved' | 'overdue' | 'submitted';
  specialistName: string;
  specialistRole: string;
  updatedDate: string;
  updatedTime: string;
  slaText: string;
  slaVariant: 'green' | 'orange' | 'red' | 'blue';
  actionText: string;
  actionHref: string;
}
```

**Existing Prisma models:**
- `LegalRequest` with `status`, `assignedSpecialist`, `createdAt`, `updatedAt`, `dueDate`
- `User` for specialist info
- `Workspace` for tenant isolation

</specifics>

<canonical_refs>
## References

- `src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx` — Existing component with filter logic
- `src/legacy/[locale]/customer/components/MyCasesTable.tsx` — Table component
- `prisma/schema.prisma` — LegalRequest model
- `src/lib/security/rbac.ts` — `canAccessRequest` for access control

</canonical_refs>
