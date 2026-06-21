# Phase 75: User Dashboard Enhancement - Research

**Researched:** 2026-06-21
**Domain:** Next.js Dashboard UI Enhancement
**Confidence:** HIGH

## Summary

Phase 75 enhances the existing User Dashboard with clickable stat cards, floating chat badge with dynamic unread count, loading states, error states, and i18n verification. The dashboard already has real data fetching via server-side Prisma queries and 9 sub-components. This phase adds interactivity and polish to match SPEC requirements.

**Primary recommendation:** Add `href` prop to StatCard for Next.js Link navigation, create `/api/messages/unread-count` endpoint for floating chat badge, and integrate existing LoadingSkeleton from phase 73.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** StatCard nhận `onClick` prop hoặc `href` prop để navigate
- **D-02:** Click vào "Tổng hồ sơ" → navigate `/cases`
- **D-03:** Click vào "Đang xử lý" → navigate `/cases?status=in_progress`
- **D-04:** Click vào "Hoàn tất" → navigate `/cases?status=completed`
- **D-05:** Click vào "Tài liệu" → navigate `/vault` (hoặc `/admin/vault` tùy role)
- **D-06:** Client-side fetch unread count on mount via `GET /api/messages/unread-count`
- **D-07:** Badge hiển thị chỉ khi count > 0
- **D-08:** Initial state là "0" (không hiển thị badge)
- **D-09:** Sử dụng skeleton components từ phase 73 foundation
- **D-10:** Mỗi panel có dedicated skeleton variant
- **D-11:** Component `EmptyState` từ phase 73 với icon + message + optional action
- **D-12:** Recent cases empty: "Chưa có hồ sơ nào"
- **D-13:** Recent documents empty: "Chưa có tài liệu nào"
- **D-14:** Mỗi panel có error boundary riêng
- **D-15:** Retry button gọi lại data fetching
- **D-16:** Error message tiếng Việt: "Không thể tải dữ liệu. Vui lòng thử lại."
- **D-17:** Client-side pagination với state trong DashboardClient
- **D-18:** Page size: 10 items per page
- **D-19:** Pagination controls: Previous, page numbers, Next
- **D-20:** Sử dụng custom CSS classes (không Tailwind)
- **D-21:** Teal primary color: #087f78
- **D-22:** CSS file: `src/components/dashboard/dashboard.css`
- **D-23:** Namespace: `DashboardClient`
- **D-24:** Keys: greeting, subtitle, createRequest, stat labels, panel titles

### Deferred Ideas

None — discussion stayed within phase scope

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stat Card Click | Client (DashboardClient) | — | React state/navigation, no server needed |
| Floating Chat Badge | Client (DashboardClient) | API Server | Client fetches unread count on mount |
| Loading Skeletons | Client (DashboardClient) | — | Client-side loading states |
| Error States | Client (DashboardClient) | — | Per-panel error boundaries |
| Empty States | Client (sub-components) | — | Components already handle empty |
| Pagination | Client (CasesTable) | — | Client-side slice of props data |
| Unread Count API | API Server | — | New endpoint: /api/messages/unread-count |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | current | Server/client component separation | Already in use |
| Prisma | current | Database queries | Already in use |
| next-intl | current | Internationalization | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/components/shared/ui/LoadingSkeleton.tsx` | phase 73 | Skeleton loading states | Panel loading |
| `src/components/shared/ui/EmptyState.tsx` | phase 73 | Empty data display | Panels with no data |
| `src/components/shared/ui/ErrorBoundary.tsx` | phase 73 | Error catching | Panel error boundaries |
| `src/components/ui/Paging.tsx` | existing | Pagination controls | Cases table pagination |

## Package Legitimacy Audit

> **Required** whenever this phase installs external packages. Run the Package Legitimacy Gate protocol before completing this section.

This phase does not install any external packages. All functionality uses existing components from phase 73 and new API endpoint implementation.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard Page (Server Component)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ requireAppSession() → get userId, activeWorkspaceId             │    │
│  │ Promise.all([                                                    │    │
│  │   prisma.user.findUnique(...)          // User data             │    │
│  │   prisma.workspace.findUnique(...)     // Workspace             │    │
│  │   prisma.legalRequest.count(...)       // Stats counts          │    │
│  │   prisma.legalRequest.findMany(...)    // Cases (take:10)        │    │
│  │   prisma.vaultFile.findMany(...)        // Documents (take:10)  │    │
│  │   prisma.auditEvent.findMany(...)       // Activities (take:10) │    │
│  │ ])                                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DashboardClient (Client Component)                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Props: welcomeData, stats, allCases, recentDocuments, activities │    │
│  │                                                                          │
│  │ State:                                                                         │
│  │   • unreadCount (useState<number>)                                    │
│  │   • panel errors (useState per panel)                                  │
│  │   • isLoading (boolean)                                                │
│  │                                                                          │
│  │ useEffect:                                                            │
│  │   → GET /api/messages/unread-count → setUnreadCount                   │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │ StatsCardGrid│ │RecentCases   │ │DeadlineSLA   │
           │ (clickable)  │ │              │ │              │
           └──────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │RecentDocuments│ │ActivityTime │ │ CasesTable   │
           │              │ │line         │ │ (paginated)  │
           └──────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │ FloatingChatButton          │
                    │ <span>N</span> → badge      │
                    └──────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/[locale]/dashboard/
│   └── page.tsx                    # Server component (already exists)
├── components/dashboard/
│   ├── DashboardClient.tsx         # Client wrapper (modify: add state)
│   ├── StatCard.tsx                # Modify: add href prop
│   ├── WelcomeBanner.tsx           # Already exists
│   ├── RecentCases.tsx             # Already exists
│   ├── DeadlineSLA.tsx              # Already exists
│   ├── RecentDocuments.tsx          # Already exists
│   ├── ActivityTimeline.tsx         # Already exists
│   ├── CasesTable.tsx               # Already exists
│   ├── ToolbarCard.tsx              # Already exists
│   └── dashboard.css               # Already exists
├── app/api/messages/unread-count/
│   └── route.ts                    # NEW: unread count API
└── components/shared/ui/
    ├── LoadingSkeleton.tsx          # Phase 73 (use)
    ├── EmptyState.tsx               # Phase 73 (use)
    └── ErrorBoundary.tsx            # Phase 73 (use)
```

### Pattern 1: Clickable StatCard with href prop

**What:** StatCard accepts optional `href` prop and renders as Next.js Link when provided.

**When to use:** Navigation from dashboard stats to list pages.

**Example:**
```typescript
// src/components/dashboard/StatCard.tsx
interface StatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href?: string;  // NEW: optional navigation
}

export default function StatCard({ variant, title, value, description, icon, href }: StatCardProps) {
  const styles = variantStyles[variant];
  const cardContent = (
    <div className="stat-card">
      {/* existing card structure */}
    </div>
  );

  return href ? <Link href={href} className="stat-card-link">{cardContent}</Link> : cardContent;
}
```

### Pattern 2: Floating Chat with Client-side Fetch

**What:** Client fetches unread count on mount, displays badge only when count > 0.

**When to use:** Real-time badge counts without WebSocket/SSE.

**Example:**
```typescript
// src/components/dashboard/DashboardClient.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DashboardClient(props) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/messages/unread-count')
      .then(res => res.json())
      .then(data => setUnreadCount(data.unreadCount))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <div className="dashboard-page">
      {/* ... panels ... */}
      <a href="/messages" className="floating-chat">
        {unreadCount > 0 && (
          <span className="chat-icon-wrapper">{unreadCount}</span>
        )}
      </a>
    </div>
  );
}
```

### Pattern 3: Panel Error Boundary with Retry

**What:** Each panel wrapped in ErrorBoundary with Vietnamese error message and retry button.

**When to use:** Error states for individual dashboard panels.

**Example:**
```typescript
// In DashboardClient.tsx
import { ErrorBoundary } from '@/components/shared/ui/ErrorBoundary';

function PanelWithError({ children, onRetry }) {
  return (
    <ErrorBoundary
      translations={{
        title: 'Không thể tải dữ liệu. Vui lòng thử lại.',
        retry: 'Thử lại',
      }}
      onError={() => onRetry?.()}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading skeletons | Custom skeleton components | `LoadingSkeleton` from phase 73 | Already implemented with 4 variants (card, table-row, list-item, text-line) |
| Empty states | Custom empty UI | `EmptyState` from phase 73 | Already implemented with icon, title, description, action props |
| Error boundaries | Custom error catch | `ErrorBoundary` from phase 73 | Class component with getDerivedStateFromError and retry |
| Pagination | Custom pagination UI | `Paging` component | Already exists with page size options, ellipsis, prev/next |

**Key insight:** Phase 73 shared foundation provides all reusable UI states. This phase reuses existing components rather than rebuilding.

## Common Pitfalls

### Pitfall 1: StatCard Link Wrapping Breaks Layout

**What goes wrong:** Wrapping StatCard content in `<a>` tag creates nested anchor issues.

**Why it happens:** StatCard already has internal structure. Wrapping entire card in Link can cause styling conflicts.

**How to avoid:** Use Next.js `Link` component with `legacyBehavior` or apply `href` at card level only, not wrapping children.

**Warning signs:** Hover effect not working, cursor pointer missing, nested anchor HTML validation errors.

### Pitfall 2: Floating Chat Badge Flash

**What goes wrong:** Badge shows "0" briefly before fetch completes, causing visual flash.

**Why it happens:** Initial state set to 0, but component renders before useEffect runs.

**How to avoid:** Conditionally render badge only when `unreadCount > 0`, not render with "0" value.

**Warning signs:** Console shows badge element with "0" text.

### Pitfall 3: Per-Panel Error Boundary Prevents Parent Error Recovery

**What goes wrong:** If outer wrapper has error, inner panels can't render to recover.

**Why it happens:** Each panel has independent ErrorBoundary, but they don't coordinate state.

**How to avoid:** Use shared error state in DashboardClient, reset per panel independently.

**Warning signs:** User clicks retry but entire dashboard still shows error.

## Code Examples

### API Endpoint: GET /api/messages/unread-count

```typescript
// src/app/api/messages/unread-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const count = await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,  // Note: uses isRead field, not readAt
      },
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json({ unreadCount: 0 }, { status: 500 });
  }
}
```

### StatCard with href prop

```typescript
// src/components/dashboard/StatCard.tsx
'use client';

import Link from 'next/link';
// ... existing imports

interface StatCardProps {
  variant: 'blue' | 'green' | 'orange' | 'purple';
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href?: string;  // NEW
}

// StatsCardGrid - receives stats data from parent with i18n
export function StatsCardGrid({ data }: { data: StatsData }) {
  const t = useTranslations('StatCard');

  return (
    <div className="stats-grid">
      <StatCard
        variant="blue"
        title={t('totalRequests')}
        value={data.totalRequests}
        description={t('totalRequestsDesc')}
        href="/cases"  // NEW
        icon={<SVG />}
      />
      {/* ... other cards with appropriate hrefs */}
    </div>
  );
}
```

### Floating Chat with Badge

```typescript
// In DashboardClient.tsx
export default function DashboardClient({ ...props }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/messages/unread-count')
      .then(res => res.json())
      .then(data => setUnreadCount(data.unreadCount))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <div className="dashboard-page">
      {/* ... panels ... */}
      <a href="/messages" className="floating-chat">
        {unreadCount > 0 && (
          <span className="chat-icon-wrapper">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </a>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded floating chat "N" | Dynamic unread count from API | Phase 75 | Real-time badge without page refresh |
| Non-clickable stat cards | href prop with Next.js Link | Phase 75 | Navigation without router.push |
| No loading states | LoadingSkeleton from phase 73 | Phase 75 | Better perceived performance |
| Generic error display | Per-panel ErrorBoundary with retry | Phase 75 | Easier debugging, better UX |

**Deprecated/outdated:**
- Hardcoded unread count: Replace with API fetch in phase 75

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `isRead` field on Message model is correct (not `readAt`) | API Endpoint | Prisma query may return wrong count if field name differs |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Which vault route should "Tài liệu" stat card link to?**
   - What we know: D-05 says `/vault` or `/admin/vault` depending on role
   - What's unclear: What is the actual route for user vault view?
   - Recommendation: Default to `/vault` for users; admin variant not needed for MVP

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Dev server | Yes | current | — |
| Prisma | Database queries | Yes | current | — |
| next-intl | i18n | Yes | current | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --run src/components/dashboard` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| U-DASH-01 | Stat cards show real counts | unit | `vitest run StatCard.test.tsx` | verify via props |
| U-DASH-02 | Welcome banner shows user name | unit | `vitest run WelcomeBanner.test.tsx` | verify via props |
| U-DASH-03 | Recent cases panel shows 5 cases | unit | `vitest run RecentCases.test.tsx` | verify via props |
| U-DASH-04 | Deadline progress bars color-coded | unit | `vitest run DeadlineSLA.test.tsx` | verify SLA logic |
| U-DASH-05 | Recent documents panel shows 5 docs | unit | `vitest run RecentDocuments.test.tsx` | verify via props |
| U-DASH-06 | Activity timeline shows actions | unit | `vitest run ActivityTimeline.test.tsx` | verify via props |
| U-DASH-07 | Floating chat shows unread count | unit + integration | `vitest run DashboardClient.test.tsx` + API test | partial |
| U-DASH-08 | Stat cards navigate on click | unit | `vitest run StatCard.test.tsx` | NEW test needed |

### Sampling Rate
- **Per task commit:** `npm run test -- --run src/components/dashboard`
- **Per wave merge:** `npm run test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/dashboard/StatCard.test.tsx` — tests for href prop and click navigation
- [ ] `src/components/dashboard/DashboardClient.test.tsx` — tests for floating chat badge
- [ ] `src/app/api/messages/unread-count/route.test.ts` — API endpoint tests

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireAppSession()` in API endpoint |
| V3 Session Management | yes | Session cookie from NextAuth pattern |
| V4 Access Control | yes | User can only see own unread messages |
| V5 Input Validation | no | GET endpoint has no user input |

### Known Threat Patterns for Next.js Dashboard

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on unread count | Information Disclosure | User can only query own messages via session |
| XSS via badge count | Tampering | React escapes numeric content automatically |

## Sources

### Primary (HIGH confidence)
- `src/components/dashboard/StatCard.tsx` — Existing StatCard implementation
- `src/components/dashboard/DashboardClient.tsx` — Existing client wrapper
- `src/components/dashboard/CasesTable.tsx` — Pagination implementation
- `src/components/ui/Paging.tsx` — Paging component
- `src/components/shared/ui/LoadingSkeleton.tsx` — Phase 73 skeleton
- `src/components/shared/ui/EmptyState.tsx` — Phase 73 empty state
- `src/components/shared/ui/ErrorBoundary.tsx` — Phase 73 error boundary
- `prisma/schema.prisma` — Message model with `isRead` field
- `src/messages/vi.json` — Vietnamese translations (lines 137-206)
- `src/messages/en.json` — English translations (lines 136-205)

### Secondary (MEDIUM confidence)
- `.planning/phases/75-user-dashboard/75-CONTEXT.md` — Implementation decisions
- `.planning/phases/75-user-dashboard/75-SPEC.md` — Phase specification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components from phase 73 exist and are verified
- Architecture: HIGH - Server/client separation already implemented
- Pitfalls: HIGH - Known patterns identified from similar implementations

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (30 days for stable patterns)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| U-DASH-01 | Dashboard shows 4 stat cards with real counts from Prisma | Server queries return stats.count, StatsCardGrid renders with value prop |
| U-DASH-02 | Welcome banner shows user name, organization and workspace | welcomeData.userName from session, workspace from activeWorkspace |
| U-DASH-03 | Recent cases panel shows 5 most recent cases | Server query returns take:10, RecentCases slices to 5 |
| U-DASH-04 | Deadline/SLA panel shows upcoming deadlines with color-coded progress bars | DeadlineSLA has getDeadlineStatus() with ok/warn/danger states |
| U-DASH-05 | Recent documents panel shows latest vault files | recentDocuments prop with transformed data |
| U-DASH-06 | Activity timeline shows recent actions from audit log | recentActivities prop with Vietnamese action text |
| U-DASH-07 | Floating chat button shows unread message count | NEW: /api/messages/unread-count + useEffect in DashboardClient |
| U-DASH-08 | Clicking stat cards navigates to relevant page | NEW: href prop on StatCard + Next.js Link |
