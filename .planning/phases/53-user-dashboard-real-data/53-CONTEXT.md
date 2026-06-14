# Phase 53: User Dashboard Real Data

**Phase**: 53  
**Slug**: user-dashboard-real-data  
**Created**: 2026-06-14  
**Auto Mode**: true

---

## Domain

Connect user dashboard (`src/app/[locale]/dashboard/page.tsx`) to real Prisma queries. Replace placeholder "Dashboard coming soon" with full dashboard matching `layout/user-dashboard.html`.

**Scope**: Stats cards, welcome banner, recent cases panel, deadline/SLA panel, recent documents panel, activity timeline, requests table, floating chat button.

---

## Canonical References

| Ref | Full Path |
|-----|-----------|
| Template | `layout/user-dashboard.html` |
| Page route | `src/app/[locale]/dashboard/page.tsx` |
| Admin real data pattern | `src/app/api/admin/requests/route.ts` |
| Stat card component | `src/components/admin/AdminStatCard.tsx` |
| Prisma schema | `prisma/schema.prisma` |
| Session lib | `src/lib/security/session.ts` |

---

## Decisions

### Stats Data Source

- **Q**: How to get stat counts for 4 cards (total requests, in_progress, completed, vault docs)?
- **Decision**: Prisma queries with counts
  - Total requests: `prisma.legalRequest.count({ where: { workspaceId } })`
  - In progress: Count where status IN `['in_progress', 'pending_review', 'assigned']`
  - Completed: Count where status IN `['approved', 'delivered', 'closed']`
  - Vault docs: `prisma.vaultFile.count({ where: { workspaceId } })`

### Welcome Message

- **Q**: Should welcome banner show dynamic or hardcoded status?
- **Decision**: Dynamic from database
  - Query active request count, pending doc count from database
  - Construct message: "{N} hồ sơ đang được xử lý, {M} tài liệu cần xác nhận và {K} phản hồi mới từ chuyên viên pháp lý."

### Recent Cases

- **Q**: How to filter recent cases for the case list panel?
- **Decision**: Filter by workspace + active statuses
  - Query: `prisma.legalRequest.findMany({ where: { workspaceId, status: { in: ['in_progress', 'pending_review', 'revision_required'] } }, take: 5, orderBy: { updatedAt: 'desc' } })`
  - Include: assigned specialist/reviewer names, matter type, status badge

### Deadlines/SLA

- **Q**: What is the source for deadline items?
- **Decision**: `slaDeadline` field from LegalRequest
  - Query requests with `slaDeadline` in next 7 days OR overdue
  - Calculate: `hoursRemaining = (slaDeadline - now) / (1000 * 60 * 60)`
  - Progress bar: `elapsedPercent = ((now - createdAt) / (slaDeadline - createdAt)) * 100`
  - Badge colors: >72h = green, 24-72h = orange, <24h = red

### Recent Documents

- **Q**: How to query recent documents for vault panel?
- **Decision**: `vaultFiles` ordered by `updatedAt`
  - Query: `prisma.vaultFile.findMany({ where: { workspaceId }, take: 5, orderBy: { updatedAt: 'desc' }, include: { uploadedBy: { select: { name: true } } } })`
  - Show: filename, size, updated date, permission status

### Activity Timeline

- **Q**: What is the source for activity timeline?
- **Decision**: `AuditLog` filtered by user/workspace
  - Query: `prisma.auditLog.findMany({ where: { workspaceId }, take: 10, orderBy: { createdAt: 'desc' } })`
  - Include: action description, actor name, timestamp
  - Relative time: "12 phút trước", "2 giờ trước", "Hôm qua"

---

## Code Context

### Reusable Patterns from Admin Real Data

**API endpoint pattern** (`src/app/api/admin/requests/route.ts`):
```typescript
// Authorization check
const session = await requireAppSession();

// Build where clause
const where = { workspaceId: session.workspaceId };

// Parallel queries for stats
const [requests, total, stats] = await Promise.all([...]);

// Transform for frontend
const data = requests.map(req => ({...}));
```

**Stat card component** (`src/components/admin/AdminStatCard.tsx`):
```typescript
interface AdminStatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'red';
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}
```

### Page Structure

```
src/app/[locale]/dashboard/
├── page.tsx              # Server component - fetch initial data
├── DashboardClient.tsx    # Client component - receives data, renders panels
└── components/
    ├── StatCard.tsx       # Reuse/adapt AdminStatCard pattern
    ├── WelcomeBanner.tsx
    ├── RecentCases.tsx
    ├── DeadlineSLA.tsx
    ├── RecentDocuments.tsx
    ├── ActivityTimeline.tsx
    └── RequestsTable.tsx  # Can reuse admin table pattern
```

---

## Deferred Ideas

- Add real-time updates via polling (Phase 54+)
- Add notification badge count to floating chat button (Phase 54+)

---

## Success Criteria

1. User sees 4 stat cards with real counts from database
2. User sees welcome banner with dynamic workspace status message
3. User sees recent cases panel (5 items) with status badges
4. User sees deadline/SLA panel with progress bars
5. User sees recent documents panel from vault
6. User sees activity timeline with relative timestamps
7. User sees requests table with real data
8. User sees floating chat button

---

## Auto-Discuss Log

```
[--auto] Selected all gray areas: Stats data source, Welcome message, Recent cases, Deadlines/SLA, Recent documents, Activity timeline
[auto] Stats data source — Q: "How to get stat counts?" → Selected: "Prisma queries with counts" (recommended)
[auto] Welcome message — Q: "Dynamic or hardcoded?" → Selected: "Dynamic from DB" (recommended)
[auto] Recent cases — Q: "Filter criteria?" → Selected: "workspace + active statuses" (recommended)
[auto] Deadlines — Q: "Source for deadlines?" → Selected: "slaDeadline field" (recommended)
[auto] Recent documents — Q: "Query method?" → Selected: "vaultFiles ordered by updatedAt" (recommended)
[auto] Activity timeline — Q: "Source?" → Selected: "AuditLog filtered by user" (recommended)
```
