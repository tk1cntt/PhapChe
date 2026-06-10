# UI/UX Admin Dashboard - Architecture Advisory Report

**Created:** 2026-06-10
**Consultant:** Claude (Independent System Architecture Consultant)
**Project:** PhapChe Legal-as-a-Service Platform
**Status:** Pending Decision

---

## Executive Summary

Báo cáo này phân tích và đề xuất cải thiện UI/UX cho Admin Dashboard của PhapChe platform. Dựa trên phân tích source code hiện tại và đánh giá theo 4 bước, khuyến nghị sử dụng **Incremental Approach** với TanStack Query + Skeleton Loading.

---

## 1. Current State Analysis

### 1.1 Tech Stack
- **Framework:** Next.js 15
- **UI Library:** Ant Design 5
- **Database:** Prisma + SQLite
- **i18n:** next-intl
- **Data Fetching:** useEffect + fetch (current)

### 1.2 Strengths
| Strength | Description |
|----------|-------------|
| Consistent Layout | Sidebar + header + content structure |
| Custom Theme | Teal primary (#0F766E) |
| Component Patterns | Consistent page title, cards, tables |
| i18n Support | next-intl integration |

### 1.3 Weaknesses

| Priority | Issue | Impact |
|----------|-------|--------|
| 🔴 Critical | No pagination on tables | Performance with large datasets |
| 🔴 Critical | No error handling with retry | UX fails when API errors |
| 🟡 Medium | Hard-coded Vietnamese labels | Inconsistent i18n |
| 🟡 Medium | No search/filter | Poor data discovery |
| 🟡 Medium | No user profile in header | Missing personalization |
| 🟢 Minor | No skeleton loaders | Perceived performance |
| 🟢 Minor | Empty states without illustrations | Boring UX |

---

## 2. Architecture Options (Neutral Listing)

### 2.1 Layout Options

| Option | Description | Typical Stack |
|--------|-------------|---------------|
| **A. Sidebar Navigation** | Vertical menu left, icon + text, collapsible | Ant Design Menu |
| **B. Top Navigation** | Horizontal menu top, hamburger mobile | Material-UI AppBar |
| **C. Hybrid** | Header horizontal + sidebar icon-only expandable | Ant Design Layout |
| **D. Command Palette** | Global ⌘K search, minimal nav | cmdk, Radix UI |

### 2.2 Data Fetching Options

| Option | Description | Features |
|--------|-------------|----------|
| **I. useEffect + fetch (Current)** | Manual fetch, useState | Simple, no caching |
| **II. TanStack Query** | Auto caching, background refetch | Cache, dedup, pagination |
| **III. SWR** | Stale-while-revalidate | Auto revalidation |
| **IV. Apollo Client** | GraphQL normalized cache | Complex graphs |

### 2.3 Pagination Options

| Option | Description | Best For |
|--------|-------------|----------|
| **1. Server-Side** | LIMIT/OFFSET or cursor-based | 10k+ records |
| **2. Client-Side** | Load all → paginate in memory | <1k records |
| **3. Virtual Scrolling** | Render visible rows only | 10k+ rows |
| **4. Infinite Scroll** | Auto-load more on scroll | Social feeds |

### 2.4 Loading State Options

| Option | Description |
|--------|-------------|
| **α. Spinner/Spin** | Circular loader |
| **β. Skeleton Screens** | Content placeholders |
| **γ. Progress Bar** | Linear progress |
| **δ. Content Fading** | Skeleton → fade in |

---

## 3. Criteria Analysis (Attribute Mapping)

### 3.1 Evaluation Criteria & Weights

| Criteria | Weight |
|----------|--------|
| Performance | 25% |
| Developer Experience | 20% |
| Maintainability | 20% |
| UX Quality | 20% |
| Time-to-Market | 15% |

### 3.2 Analysis by Criteria

#### Performance
| Option | Score | Notes |
|--------|-------|-------|
| Server-Side Pagination | ⭐⭐⭐⭐⭐ | Query only needed data |
| Virtual Scrolling | ⭐⭐⭐⭐ | Render visible only |
| Client-Side Pagination | ⭐⭐ | Load all data |

#### Developer Experience
| Option | Score | Notes |
|--------|-------|-------|
| TanStack Query | ⭐⭐⭐⭐⭐ | Devtools, TypeScript support |
| SWR | ⭐⭐⭐⭐ | Simple |
| useEffect + fetch | ⭐⭐⭐ | Simple but manual |

#### UX Quality
| Option | Score | Notes |
|--------|-------|-------|
| Skeleton Screens | ⭐⭐⭐⭐⭐ | Best perceived performance |
| Command Palette | ⭐⭐⭐⭐ | Power users love it |
| Hybrid Navigation | ⭐⭐⭐⭐ | Desktop + Mobile |

### 3.3 Trade-off Analysis

#### TanStack Query vs useEffect + fetch
| Trade-off | Detail |
|-----------|--------|
| **+** | Bundle size ~12KB gzipped |
| **+** | Learning curve for team |
| **-** | Lose simplicity of useEffect |
| **+** | Gain: caching, dedup, pagination helpers |

#### Server vs Client Pagination
| Trade-off | Detail |
|-----------|--------|
| **+** | Better performance for large datasets |
| **-** | Need API support for cursor/offset |
| **-** | Must manage page state in URL |
| **+** | Handle 1M+ records |

---

## 4. Context Analysis

### 4.1 PhapChe Context

| Context | Detail | Implication |
|---------|--------|-------------|
| C1: Tech Stack | Next.js 15, Ant Design 5, Prisma | TanStack Query is complementary |
| C2: Team Expertise | TypeScript, React - strong | Can adopt quickly |
| C3: MVP Phase | Need to ship fast, validate workflow | Focus on core first |
| C4: Data Scale | ~25 requests, 5 users | Pagination not urgent yet |
| C5: Usage | Internal tool, power users | UX improvements have high impact |
| C6: Time Constraint | Quick wins appreciated | Short feedback loops needed |

### 4.2 Scoring Matrix

| Option | Perf | DX | Maint | UX | TTM | **Total** |
|--------|------|-----|-------|-----|-----|-----------|
| TanStack + Skeleton | 4 | 5 | 4 | 5 | 3 | **21** |
| useEffect + Skeleton | 2 | 3 | 3 | 5 | 5 | **18** |
| TanStack + Error Boundary | 4 | 5 | 4 | 4 | 3 | **20** |
| SWR + Skeleton | 3 | 4 | 3 | 5 | 4 | **19** |

---

## 5. Initial Recommendation

### 5.1 "Pro Admin Lite" Package

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Fetching    │  TanStack Query v5                        │
│  Pagination       │  Server-side (Prisma cursor)               │
│  Loading States   │  Skeleton screens                         │
│  Error Handling   │  Error Boundary + Toast                   │
│  Navigation       │  Keep current sidebar, add collapse       │
│  Search/Filter    │  Debounced search + column filters        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Rationale
1. Complementary to existing stack
2. Reasonable time-to-market (1-2 weeks)
3. High impact, low risk
4. Prepare for scale
5. Good TypeScript support

---

## 6. Adversarial Review (Devil's Advocate)

### 6.1 Failure Scenarios

| # | Scenario | Description | Probability |
|---|----------|-------------|-------------|
| 1 | **Over-engineering Trap** | Team refactors everything at once → months without new features | 40% |
| 2 | **Query Key Chaos** | No convention for query keys → cache bugs hard to debug | 30% |
| 3 | **Skeleton Maintenance** | Custom skeleton per page → 20+ components → maintenance burden | 35% |
| 4 | **Premature Optimization** | Server pagination needs API changes → breaking changes → regressions | 25% |
| 5 | **Bundle Explosion** | TanStack + 5 components → 50KB+ → slow initial load | 20% |

### 6.2 Overlooked Architecture Risks

| Risk | Detail |
|------|--------|
| Query key versioning | Schema changes → old cache → stale data |
| Optimistic update complexity | Conflict resolution becomes complex |
| SWR behavior difference | Mixing with React Query causes confusion |
| AntD + TanStack conflict | Both have separate loading state handling |

---

## 7. Final Recommendation (Adjusted)

### 7.1 Incremental Approach

**Phase 1 (Week 1): Quick Wins - No new dependencies**
```
┌─────────────────────────────────────────────────────────────────┐
│  1. Add Error Boundary around each page                         │
│  2. Replace Spin → Skeleton for Users page (as template)       │
│  3. Add retry button in error state                            │
│  4. Extract loading/error logic to shared component            │
└─────────────────────────────────────────────────────────────────┘
```

**Phase 2 (Week 2): TanStack Query Adoption - Incremental**
```
┌─────────────────────────────────────────────────────────────────┐
│  1. Install @tanstack/react-query@5                            │
│  2. Migrate Users page (has skeleton) → use Query             │
│  3. Define query key convention: ['users', workspaceId, page]  │
│  4. Add React Query devtools in development                   │
└─────────────────────────────────────────────────────────────────┘
```

**Phase 3 (Week 3+): Pagination & Polish**
```
┌─────────────────────────────────────────────────────────────────┐
│  1. Add pagination API endpoints (if needed)                    │
│  2. Add search/filter with TanStack Query                     │
│  3. Add optimistic updates for mutations                      │
│  4. Review and standardize across all pages                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Requirements Document

```markdown
# UI/UX Admin Dashboard - Requirements v2.0

## Phase 1: Quick Wins (Week 1)

### REQ-UI-001: Error Boundary
- Each admin page wrapped in Error Boundary
- Fallback: Error message + Retry button
- Errors logged to console

### REQ-UI-002: Skeleton Loading
- All pages with loading state use skeleton
- Skeleton must match actual layout
- Use Ant Design Skeleton component

### REQ-UI-003: Shared Loading Components
- Create `<PageSkeleton />` for tables
- Create `<CardSkeleton />` for cards
- No hard-coded skeleton in individual pages

## Phase 2: TanStack Query (Week 2)

### REQ-UI-010: TanStack Query Setup
- Install `@tanstack/react-query@5`
- Configure: staleTime: 30s, gcTime: 5min
- Add QueryClientProvider in layout

### REQ-UI-011: Query Key Convention
```
Format: ['entity', workspaceId?, options]
Examples:
- ['users', workspaceId, { page, filter }]
- ['requests', workspaceId, { status }]
- ['audit-events', { limit, cursor }]
```

### REQ-UI-012: Devtools
- Enable React Query devtools in development
- Production: completely disabled

## Phase 3: Pagination & Search (Week 3+)

### REQ-UI-020: Server-Side Pagination
- Tables have pagination with page size: 10, 25, 50
- Page state synced to URL query params
- Support cursor-based pagination for large datasets

### REQ-UI-021: Search & Filter
- Global search bar in header
- Column filters in table header
- Debounced search: 300ms delay

## Non-Functional Requirements

### NFR-001: Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size increase < 50KB (gzipped)

### NFR-002: Accessibility
- Keyboard navigation for all interactive elements
- ARIA labels for icons
- Focus management when opening/closing modals

### NFR-003: Responsive
- Desktop-first (1024px+)
- Tablet: Collapsed sidebar
- Mobile: Hamburger menu, horizontal scroll tables

## Acceptance Criteria

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-001 | Users page skeleton displays during load | E2E test |
| AC-002 | Error boundary catches React errors | Unit test |
| AC-003 | TanStack Query caches users data | Network tab inspection |
| AC-004 | Pagination syncs with URL | Manual test |
| AC-005 | Search debounce works | Performance test |
```

---

## 9. Files Analyzed

| File | Purpose |
|------|---------|
| `src/app/admin/layout.tsx` | Main admin layout with sidebar/header |
| `src/app/providers/antd-provider.tsx` | Ant Design theme config |
| `src/lib/navigation/breadcrumb-labels.ts` | Breadcrumb labels |
| `src/app/[locale]/admin/users/*.tsx` | Users page |
| `src/app/[locale]/admin/ops/*.tsx` | Ops dashboard |
| `src/app/[locale]/admin/vault/*.tsx` | Vault management |
| `src/app/[locale]/admin/audit/page.tsx` | Audit page |
| `src/app/[locale]/admin/workspaces/page.tsx` | Workspaces page |
| `src/app/[locale]/admin/requests/page.tsx` | Requests page |
| `src/app/[locale]/admin/templates/*.tsx` | Templates page |

---

## 10. Appendix: Screenshots Reference

Screenshots captured during analysis:
```
e2e/screenshots/admin-dashboard/
├── 01-workspaces.png   - Workspaces page with table
├── 02-requests.png     - Requests page with data
├── 03-users.png        - Users page with 5 demo users
├── 04-vault.png        - Vault page (empty state)
├── 05-templates.png    - Templates page with 3 templates
├── 06-audit.png        - Audit page with 36 events
├── 07-ops.png         - Ops page
└── 08-admin-home.png   - Admin Home with sidebar
```

---

**Document Status:** Ready for Review
**Next Action:** User decision on Phase 1 implementation
**Review Date:** TBD
