# Phase 26: Customer Dashboard - Research

**Researched:** 2026-06-10
**Domain:** Next.js 14 App Router with TypeScript, Ant Design 6, Tailwind CSS, Prisma/SQLite
**Confidence:** HIGH

## Summary

Phase 26 builds the customer-facing dashboard (`user-dashboard.html` template) which is the main landing page after authentication. The dashboard aggregates data from multiple database tables (LegalRequest, VaultFile, AuditEvent, Workspace) and displays 4 stat cards, welcome banner, case list, deadline/SLA panel, recent documents, activity timeline, and a full requests table. All data must come from SQLite via Prisma queries. The UI uses a sidebar layout (262px) + main content area with independent scroll.

**Primary recommendation:** Create a new `src/app/[locale]/customer/page.tsx` implementing the dashboard with 8 reusable components. Use existing Sidebar/Topbar patterns and Lucide React icons. Data comes from Prisma queries filtering by workspace scope.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Layout structure
- **D-01:** Sidebar (262px) + Main content area with topbar
- **D-02:** Main content scrolls independently (`overflow: auto` on `.content`)
- **D-03:** Responsive: min-width 1400px for desktop view matching template

### Component architecture
- **D-04:** UserLayout component wrapping all user portal pages (sidebar + topbar)
- **D-05:** StatCard component for 4 stat cards with icon/variant props (blue, green, orange, purple)
- **D-06:** WelcomeCard component with gradient background and quick action buttons
- **D-07:** CaseListPanel component with CaseItem children
- **D-08:** DeadlinePanel component with progress bars and SLA indicators
- **D-09:** DocumentPanel component with file type badges (PDF/DOC)
- **D-10:** ActivityTimeline component with relative timestamps
- **D-11:** RequestsTable component with 7-column grid layout
- **D-12:** FloatingChatButton component with notification badge

### Data source
- **D-13:** All sample data from SQLite database via Prisma queries
- **D-14:** Stat values computed from database counts: 12 ho so, 3 dang xu ly, 8 hoan tat, 36 vault
- **D-15:** Welcome message reads workspace status from database
- **D-16:** Requests table reads from `request` table with workspace filter
- **D-17:** Activity timeline reads from `audit_event` table filtered by current workspace

### Styling approach
- **D-18:** Match template CSS exactly: Inter font, CSS variables for colors, custom shadows
- **D-19:** Use Tailwind CSS utilities where possible, custom CSS for complex components
- **D-20:** Badge component with color variants: green (Da duyet), orange (Can phan hoi), blue (Dang review), red (Qua han)
- **D-21:** Progress bar with 3 states: ok (green), warn (orange), danger (red)
- **D-22:** Floating chat button: red gradient with yellow border (`border: 3px solid #facc15`)

### Test coverage
- **D-23:** Whitebox: Unit tests for StatCard, WelcomeCard, CaseListPanel, DeadlinePanel, DocumentPanel, ActivityTimeline, RequestsTable, FloatingChatButton
- **D-24:** Blackbox: Integration tests for API endpoints returning dashboard data
- **D-25:** Abnormal: Empty workspace state, no requests state, no activity state
- **D-26:** Error: Error boundary fallback UI, loading skeleton
- **D-27:** E2E: Full dashboard render with all components visible

### Claude's Discretion
- Exact spacing/padding values (template uses specific px values)
- Icon library choice (Lucide React recommended for consistency)
- Animation/transition timing

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CUST-DASH-01 | Display 4 stat cards (Tong ho so: 12, Dang xu ly: 3, Da hoan tat: 8, Tai lieu vault: 36) with matching icons and colors | StatCard component with FileText/Clock/CheckCircle/Folder icons, blue/orange/green/purple variants |
| CUST-DASH-02 | Display welcome banner with workspace status message | WelcomeCard component with gradient `#ffffff` to `#f0fdfa` |
| CUST-DASH-03 | Display case list with status badges (Dang review, Can phan hoi, Da duyet) | CaseListPanel with CaseItem children, Badge component with color variants |
| CUST-DASH-04 | Display deadline/SLA panel with progress bars | DeadlinePanel with progress bars (ok/warn/danger states) |
| CUST-DASH-05 | Display recent documents panel with file type badges (PDF, DOC) | DocumentPanel with file type badges |
| CUST-DASH-06 | Display activity timeline with relative timestamps (12 phut, 38 phut, 2 gio) | ActivityTimeline with relative time calculation |
| CUST-DASH-07 | Display full requests table with 7 columns (ma, loai, trang thai, phu_trach, cap_nhat, SLA, thao tac) | RequestsTable with 7-column grid layout |
| CUST-DASH-08 | Table shows 4 sample rows matching template data (REQ-2026-021, 019, 018, 016) | Prisma seed data matching template values |
| CUST-DASH-09 | Toolbar with search and filter buttons functional | Toolbar with search input and filter dropdowns |
| CUST-DASH-10 | Floating chat button visible with "2 Tin moi" notification badge | FloatingChatButton with red gradient and yellow border |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dashboard stat cards | API/Backend | Frontend | Prisma counts query, display only |
| Welcome message | API/Backend | Frontend | Database workspace status, static display |
| Case list display | API/Backend | Frontend | LegalRequest table query, filter by workspace |
| Deadline/SLA panel | API/Backend | Frontend | SLA calculation from request deadlines |
| Recent documents | API/Backend | Frontend | VaultFile table query, workspace-scoped |
| Activity timeline | API/Backend | Frontend | AuditEvent table query, relative timestamps |
| Requests table | API/Backend | Frontend | LegalRequest table with full 7-column data |
| Floating chat | Frontend | — | Static notification badge, no backend |
| Sidebar navigation | Frontend | — | Next.js routing, active state |
| Topbar | Frontend | — | Search, language, user avatar |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | latest (15.x) | App Router, SSR, routing | Required per project setup |
| Ant Design | 6.4.3 | UI components, Layout, Table | Existing codebase pattern |
| Tailwind CSS | latest | Utility classes for styling | Per D-19 for simple styling |
| Prisma | 6.19.0 | Database ORM | SQLite per schema.prisma |
| Lucide React | latest | Icons | Per Claude discretion, consistent with existing Sidebar.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.101.0 | Data fetching, caching | For dashboard stats and list queries |
| next-intl | 4.13.0 | i18n | Per Phase 25 dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lucide React | Heroicons | Lucide already in Sidebar.tsx, consistent |
| Custom CSS | Styled Components | Tailwind per D-19, simpler for utilities |

**Installation:**
```bash
# No new packages needed - all already in package.json
```

**Version verification:** Package versions verified from package.json

## Architecture Patterns

### System Architecture Diagram

```
Browser Request
       |
       v
[locale]/customer/page.tsx (Server Component)
       |
       +-- Prisma queries (workspace-scoped data)
       |    |
       |    +-- LegalRequest.count (workspace filter)
       |    +-- LegalRequest.findMany (with relations)
       |    +-- VaultFile.count (workspace filter)
       |    +-- AuditEvent.findMany (workspace filter, recent)
       |
       v
Client Components (React Query data)
       |
       +-- UserLayout (Sidebar + Topbar)
       +-- StatCards (4x)
       +-- WelcomeCard
       +-- CaseListPanel
       +-- DeadlinePanel
       +-- DocumentPanel
       +-- ActivityTimeline
       +-- RequestsTable
       +-- FloatingChatButton
       |
       v
Dashboard Render
```

### Recommended Project Structure
```
src/
├── app/
│   └── [locale]/
│       └── customer/
│           ├── page.tsx                    # Main dashboard page
│           └── components/
│               ├── StatCard.tsx           # 4 stat cards with variants
│               ├── WelcomeCard.tsx        # Welcome banner
│               ├── CaseListPanel.tsx      # Case list with CaseItem
│               ├── DeadlinePanel.tsx      # SLA deadlines with progress
│               ├── DocumentPanel.tsx      # Recent documents
│               ├── ActivityTimeline.tsx   # Activity with timestamps
│               ├── RequestsTable.tsx      # 7-column requests table
│               ├── FloatingChatButton.tsx # Notification badge
│               ├── UserLayout.tsx         # Shared layout wrapper
│               └── dashboard.css          # Custom CSS matching template
├── lib/
│   └── prisma.ts                         # Prisma client singleton
└── components/ui/
    ├── ErrorFallback.tsx                  # Existing error boundary
    ├── PageSkeleton.tsx                  # Existing skeleton
    └── CardSkeleton.tsx                  # Existing skeleton
```

### Pattern 1: Dashboard Data Fetching
**What:** Server component fetches data with Prisma, passes to client components
**When to use:** Initial dashboard load for SEO and fast first paint
**Example:**
```typescript
// src/app/[locale]/customer/page.tsx
import { prisma } from '@/lib/prisma';
import { StatCard } from './components/StatCard';

export default async function CustomerDashboard() {
  // Workspace-scoped queries
  const [totalRequests, processingRequests, completedRequests, vaultFiles] = await Promise.all([
    prisma.legalRequest.count({ where: { workspaceId } }),
    prisma.legalRequest.count({ where: { workspaceId, status: { in: ['in_progress', 'pending_review'] } } }),
    prisma.legalRequest.count({ where: { workspaceId, status: 'delivered' } }),
    prisma.vaultFile.count({ where: { workspaceId } }),
  ]);
  
  return <StatCard title="Tong ho so" value={totalRequests} icon="file" variant="blue" />;
}
```

### Pattern 2: Workspace-Scoped Data
**What:** All queries filter by `workspaceId` for tenant isolation
**When to use:** Every database query in customer portal
**Example:**
```typescript
// Source: schema.prisma - workspaceId index on LegalRequest
prisma.legalRequest.findMany({
  where: { workspaceId: session.workspaceId },
  include: {
    assignedSpecialist: { select: { name: true } },
    assignedReviewer: { select: { name: true } },
  },
  orderBy: { updatedAt: 'desc' },
  take: 4, // For case list
});
```

### Anti-Patterns to Avoid
- **Hardcoded stat values:** Must compute from database counts, not static numbers
- **Missing workspace filter:** All queries must scope to current workspace
- **Ant Design Table for requests:** Template uses custom grid CSS, not Ant Table
- **CSS Modules:** Template uses global CSS variables matching, keep consistent

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamps | Custom date formatting | `date-fns` or `next-intl` | Handle locale-aware "2 gio truoc" correctly |
| Icon components | Custom SVG icons | Lucide React | Consistency with Sidebar.tsx, already installed |
| Error boundary | Custom error component | `src/components/ui/ErrorFallback.tsx` | Already exists, handles retry/go-home |
| Loading skeleton | Custom skeleton | `src/components/ui/CardSkeleton.tsx` | Already exists for card-based layouts |
| Sidebar navigation | Custom sidebar | Reuse Sidebar.tsx pattern | Already has active state logic |

**Key insight:** The template uses custom CSS (not Ant Design components) for the main layout. This is intentional per D-18/D-19 to match the exact template design. Use Ant Design only for complex components like Table dropdowns.

## Common Pitfalls

### Pitfall 1: Using Ant Design Layout Instead of Template CSS
**What goes wrong:** Dashboard looks different from template, fails UI verification
**Why it happens:** Ant Design Layout has different spacing, shadows, and defaults
**How to avoid:** Copy exact CSS from `user-dashboard.html` template head/style section
**Warning signs:** Rounded corners don't match (template: 15px, Ant: 8px), shadows different

### Pitfall 2: Missing Workspace Scope on Queries
**What goes wrong:** Customer sees other customers' data, security violation
**Why it happens:** Forgetting `where: { workspaceId }` on Prisma queries
**How to avoid:** Create a `getWorkspaceContext()` helper that extracts workspace from session
**Warning signs:** Tests pass with mock data but fail with real multi-tenant data

### Pitfall 3: Wrong Icon Names in Lucide
**What goes wrong:** Icons don't match template (template uses custom SVG paths)
**Why it happens:** Lucide has different icon names than template SVG paths
**How to avoid:** Map template icons: FileText, Clock, CheckCircle, Folder as Lucide icon names
**Warning signs:** Icon rendered is different shape than template

### Pitfall 4: Static Badge Colors Instead of Dynamic
**What goes wrong:** Badge colors don't reflect actual status values from database
**Why it happens:** Hardcoding badge colors for statuses not in template
**How to avoid:** Map status to badge color: delivered=green, in_progress=blue, pending_review=orange, closed=gray
**Warning signs:** All badges show same color regardless of request status

## Code Examples

Verified patterns from official sources:

### StatCard Component
```typescript
// Source: template user-dashboard.html lines 345-410
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: 'file' | 'clock' | 'check' | 'folder';
  variant: 'blue' | 'green' | 'orange' | 'purple';
}

export function StatCard({ title, value, description, icon, variant }: StatCardProps) {
  const iconMap = {
    file: FileText,
    clock: Clock,
    check: CheckCircle,
    folder: Folder,
  };
  const Icon = iconMap[icon];
  
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        <Icon />
      </div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </div>
  );
}
```

### Badge Component
```typescript
// Source: template user-dashboard.html lines 576-638
interface BadgeProps {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
```

### Progress Bar
```typescript
// Source: template user-dashboard.html lines 670-695
interface ProgressBarProps {
  value: number; // 0-100
  status: 'ok' | 'warn' | 'danger';
}

export function ProgressBar({ value, status }: ProgressBarProps) {
  return (
    <div className="progress">
      <span className={status} style={{ width: `${value}%` }} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded dashboard stats | Prisma count queries | Phase 26 | Real-time accurate counts |
| Session without workspace | Better Auth + workspace scope | Phase 25 | Multi-tenant isolation |
| Static CSS files | CSS-in-TSX or Tailwind | Ongoing | Better DX, matches template |

**Deprecated/outdated:**
- Ant Design Table for main layouts: Template uses custom grid CSS for precise control

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sample data (12 ho so, 3 processing, etc.) can be computed from existing seed data | Standard Stack | Seed data may not match template values exactly - may need additional seed data |
| A2 | Session contains workspaceId for filtering | Architecture | Phase 25 may not implement workspace scope in session |
| A3 | FloatingChatButton is decorative only, no backend integration | Architecture | If it needs real notifications, scope changes |

## Open Questions

1. **Where does the session/workspace context come from?**
   - What we know: Phase 25 implements Auth & i18n, Better Auth is used
   - What's unclear: How workspaceId is stored in session after login
   - Recommendation: Check Phase 25 output for session shape

2. **Should seed data match exact template values?**
   - What we know: Template shows 12 total requests, 3 processing, 8 completed, 36 vault files
   - What's unclear: If current seed creates different counts
   - Recommendation: Create Phase 26-specific seed data that matches template

3. **Floating chat button - real or mock?**
   - What we know: Template shows "2 Tin moi" badge
   - What's unclear: If this connects to real notification system
   - Recommendation: Mock static badge for Phase 26, note for future phase

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond existing project infrastructure)

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js | App Router | Yes | 15.x | — |
| Prisma | Database queries | Yes | 6.19.0 | — |
| SQLite | Data layer | Yes | — | — |
| Ant Design | UI components | Yes | 6.4.3 | — |
| Tailwind CSS | Styling | Yes | latest | — |
| Lucide React | Icons | Yes | latest | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | playwright.config.ts |
| Quick run command | `npx playwright test tests/customer-dashboard.spec.ts --grep "stat"` |
| Full suite command | `npx playwright test tests/customer-dashboard.spec.ts` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CUST-DASH-01 | 4 stat cards with exact values | E2E | `npx playwright test -g "stat cards"` | No |
| CUST-DASH-02 | Welcome banner visible | E2E | `npx playwright test -g "welcome"` | No |
| CUST-DASH-03 | Case list with 3 items | E2E | `npx playwright test -g "case list"` | No |
| CUST-DASH-04 | Deadline panel with progress | E2E | `npx playwright test -g "deadline"` | No |
| CUST-DASH-05 | Documents panel with badges | E2E | `npx playwright test -g "documents"` | No |
| CUST-DASH-06 | Activity timeline with timestamps | E2E | `npx playwright test -g "activity"` | No |
| CUST-DASH-07 | Requests table 7 columns | E2E | `npx playwright test -g "requests table"` | No |
| CUST-DASH-08 | 4 sample rows visible | E2E | `npx playwright test -g "sample rows"` | No |
| CUST-DASH-09 | Toolbar search functional | E2E | `npx playwright test -g "search"` | No |
| CUST-DASH-10 | Floating chat visible | E2E | `npx playwright test -g "floating chat"` | No |

### Unit Tests (Whitebox)
| Component | Test File | Coverage Target |
|-----------|----------|-----------------|
| StatCard | tests/unit/StatCard.test.tsx | 80%+ |
| WelcomeCard | tests/unit/WelcomeCard.test.tsx | 80%+ |
| CaseListPanel | tests/unit/CaseListPanel.test.tsx | 80%+ |
| DeadlinePanel | tests/unit/DeadlinePanel.test.tsx | 80%+ |
| DocumentPanel | tests/unit/DocumentPanel.test.tsx | 80%+ |
| ActivityTimeline | tests/unit/ActivityTimeline.test.tsx | 80%+ |
| RequestsTable | tests/unit/RequestsTable.test.tsx | 80%+ |
| FloatingChatButton | tests/unit/FloatingChatButton.test.tsx | 80%+ |

### Integration Tests (Blackbox)
| Endpoint | Test File | Coverage |
|----------|----------|----------|
| GET /api/dashboard/stats | tests/integration/dashboard-stats.test.ts | 100% |
| GET /api/requests | tests/integration/requests.test.ts | 100% |
| GET /api/audit-events | tests/integration/audit-events.test.ts | 100% |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep "stat" -x`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/customer-dashboard.spec.ts` — E2E tests for all 10 requirements
- [ ] `tests/unit/StatCard.test.tsx` — Unit tests for StatCard component
- [ ] `tests/unit/WelcomeCard.test.tsx` — Unit tests for WelcomeCard
- [ ] `tests/unit/CaseListPanel.test.tsx` — Unit tests for CaseListPanel
- [ ] `tests/unit/DeadlinePanel.test.tsx` — Unit tests for DeadlinePanel
- [ ] `tests/unit/DocumentPanel.test.tsx` — Unit tests for DocumentPanel
- [ ] `tests/unit/ActivityTimeline.test.tsx` — Unit tests for ActivityTimeline
- [ ] `tests/unit/RequestsTable.test.tsx` — Unit tests for RequestsTable
- [ ] `tests/unit/FloatingChatButton.test.tsx` — Unit tests for FloatingChatButton
- [ ] `tests/integration/dashboard-stats.test.ts` — API integration tests
- [ ] `tests/integration/requests.test.ts` — Requests API tests
- [ ] `tests/integration/audit-events.test.ts` — Audit events API tests
- [ ] `tests/abnormal/` — Edge case tests (empty workspace, no data)
- [ ] `tests/error/` — Error boundary tests
- [ ] `prisma/seed-customer-dashboard.ts` — Phase 26 seed data

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Better Auth (Phase 25) |
| V3 Session Management | yes | Better Auth session with workspaceId |
| V4 Access Control | yes | Workspace-scoped Prisma queries |
| V5 Input Validation | partial | Search input sanitization |
| V6 Cryptography | no | Not applicable to dashboard |

### Known Threat Patterns for Customer Dashboard

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on requests | Tampering | Workspace filter on all queries |
| Information disclosure | Information Disclosure | Tenant isolation via workspaceId |
| Search injection | Tampering | Sanitize search input before query |
| XSS in user content | Tampering | React auto-escapes, sanitize rich text |

## Sources

### Primary (HIGH confidence)
- `layout/user-dashboard.html` — Full template with CSS, HTML structure, sample data
- `prisma/schema.prisma` — Database schema with workspaceId on all models
- `src/app/components/Sidebar.tsx` — Existing navigation pattern
- `src/components/ui/ErrorFallback.tsx` — Existing error boundary
- `src/components/ui/PageSkeleton.tsx` — Existing skeleton loader
- `src/components/ui/CardSkeleton.tsx` — Existing card skeleton

### Secondary (MEDIUM confidence)
- `package.json` — Verified library versions

### Tertiary (LOW confidence)
- N/A — All sources verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Verified from package.json and existing components
- Architecture: HIGH — Matches project patterns (Sidebar.tsx, ErrorFallback.tsx)
- Pitfalls: HIGH — Based on actual template analysis and project constraints

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (30 days for stable phase scope)
