# Phase 75: User Dashboard — Specification

**Created:** 2026-06-21
**Ambiguity score:** 0.16 (gate: ≤ 0.20)
**Requirements:** 8 locked

## Goal

User Dashboard hiển thị real data từ database với 6 panels (welcome, stats, cases, deadlines, documents, activity), stat cards clickable, và floating chat button với unread count.

## Background

Dashboard page hiện tại tại `src/app/[locale]/dashboard/page.tsx` đã có server-side Prisma queries lấy real data. Component `DashboardClient.tsx` nhận props từ server và render 6 sub-components. Tuy nhiên cần verify đầy đủ data flow và hoàn thiện CSS để match mock UI.

**Current state:**
- Server page fetch real data từ Prisma (user, workspace, requests, vault, audit)
- DashboardClient props typed correctly
- 9 sub-components exist: WelcomeBanner, StatCard, RecentCases, DeadlineSLA, RecentDocuments, ActivityTimeline, CasesTable, ToolbarCard
- CSS file `dashboard.css` tồn tại

**Gap:**
- Floating chat button hardcoded count (always shows "N")
- Stat cards chưa verify click navigation
- DeadlineSLA cần verify SLA calculation logic
- Loading states cần implement cho từng panel

## Requirements

1. **Stat Cards với Real Counts**: Dashboard hiển thị 4 stat cards với real counts từ Prisma (total, in-progress, completed, vault-docs).
   - Current: Stats fetch từ Prisma, transform thành `StatsData` object
   - Target: 4 cards hiển thị đúng count, mỗi card clickable navigate đến relevant page
   - Acceptance: Click vào "Tổng hồ sơ" → navigate `/cases`; Click "Đang xử lý" → navigate `/cases?status=in_progress`

2. **Welcome Banner với User Context**: Banner hiển thị user name, organization và workspace.
   - Current: `WelcomeBanner` nhận `welcomeData` props với `{userName, workspace, activeRequests, pendingDocs, newReplies}`
   - Target: Banner hiển thị "Xin chào, {userName}" + workspace name + counts
   - Acceptance: Banner renders với correct userName từ session, workspaceName từ activeWorkspace

3. **Recent Cases Panel**: Hiển thị 5 most recent cases từ `GET /api/requests` (server-side query).
   - Current: Server query `prisma.legalRequest.findMany` với `take: 10`, transform thành `CaseItem[]`
   - Target: Panel hiển thị 5 cases với code, title, status badge, assignee
   - Acceptance: Panel shows 5 items max, mỗi item có clickable link đến case detail

4. **Deadline/SLA Panel**: Hiển thị upcoming deadlines với color-coded progress bars.
   - Current: `DeadlineSLA` component receives `cases` prop
   - Target: Hiển thị deadlines với progress bars (green: >50% time left, yellow: 20-50%, red: <20%)
   - Acceptance: Progress bar colors match time-remaining thresholds

5. **Recent Documents Panel**: Hiển thị latest vault files từ `GET /api/vault`.
   - Current: Server query `prisma.vaultFile.findMany` với `take: 10`, transform thành `DocumentItem[]`
   - Target: Panel hiển thị 5 recent documents với filename, uploader, relative time
   - Acceptance: Documents sorted by createdAt desc, max 5 items displayed

6. **Activity Timeline**: Hiển thị recent actions từ audit log.
   - Current: Server query `prisma.auditEvent.findMany`, transform với action text generation
   - Target: Timeline hiển thị recent actions với actor, action type, description, relative time
   - Acceptance: Activities sorted by createdAt desc, max 10 items, action text in Vietnamese

7. **Floating Chat Button**: Button hiển thị unread message count.
   - Current: Hardcoded `<span className="chat-icon-wrapper">N</span>`
   - Target: Fetch unread count từ API, display badge nếu count > 0
   - Acceptance: Button shows unread count badge khi có messages, hides when 0

8. **Cases Table với Paging**: Full cases table với pagination.
   - Current: `CasesTable` receives all cases, renders in table format
   - Target: Table với pagination controls (10 per page), sort capability
   - Acceptance: Pagination works, clicking row navigates to case detail

## Boundaries

**In scope:**
- Server-side data fetching (Prisma queries) - đã done
- DashboardClient props interface - đã done
- 9 sub-components: WelcomeBanner, StatCard, RecentCases, DeadlineSLA, RecentDocuments, ActivityTimeline, CasesTable, ToolbarCard
- Clickable stat cards navigate to relevant pages
- Floating chat button với dynamic unread count
- Loading states cho từng panel
- Error states với retry logic
- Empty states khi no data

**Out of scope:**
- Real-time updates (SSE/WebSocket) - defer to v2.3
- Push notifications - separate feature
- Custom dashboard layout builder - overbuild cho MVP
- Analytics/reporting - separate admin feature
- Message sending from chat - MSG phase (77)

## Constraints

- Must use existing Prisma queries (already implemented in server page)
- DashboardClient must remain server component wrapper pattern
- CSS must match mock UI design system (teal primary #087f78)
- i18n keys must follow `DashboardClient.*` namespace
- Loading states use skeleton components from phase 73 foundation

## Acceptance Criteria

- [ ] Stat cards show real counts from Prisma (totalRequests, inProgress, completed, vaultDocs)
- [ ] Click "Tổng hồ sơ" stat card → navigate to `/cases`
- [ ] Click "Đang xử lý" stat card → navigate to `/cases?status=in_progress`
- [ ] Welcome banner displays "Xin chào, {userName}" with workspace name
- [ ] Recent cases panel shows max 5 items with code, title, status badge, assignee
- [ ] Deadline/SLA progress bars use correct colors (green >50%, yellow 20-50%, red <20%)
- [ ] Recent documents panel shows max 5 items sorted by createdAt desc
- [ ] Activity timeline shows Vietnamese action text sorted by createdAt desc
- [ ] Floating chat button shows unread count badge when count > 0
- [ ] Cases table supports pagination (10 per page)
- [ ] All panels have loading skeleton states
- [ ] All panels have empty state when no data
- [ ] All panels have error state with retry button
- [ ] CSS matches mock UI design system (teal primary, custom classes)
- [ ] i18n keys exist for all dashboard strings (4 locales)

## Edge Coverage

**Coverage:** 0/0 applicable edges resolved · 0 unresolved

No applicable edges identified - all requirements are straightforward CRUD display.

## Prohibitions (must-NOT)

**Coverage:** 2/2 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification |
|----------------------------------|-------------|--------|--------------|
| MUST NOT hardcode user counts | Stat Cards | ✅ resolved | Unit test verifies stats come from Prisma count queries |
| MUST NOT show real data in screenshot/debug | Floating Chat | ✅ resolved | Unread count only fetches on client mount, shows "0" initially |

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                            |
|--------------------|-------|------|--------|----------------------------------|
| Goal Clarity       | 0.85  | 0.75 | ✓      | Real data display, 6 panels      |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | Explicit in/out scope            |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Standard conventions             |
| Acceptance Criteria| 0.75  | 0.70 | ✓      | 15 pass/fail criteria            |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      |                                  |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective    | Question summary         | Decision locked                    |
|-------|----------------|-------------------------|------------------------------------|
| 1     | Researcher     | What exists in dashboard today? | Server queries exist, 9 components exist |
| 1     | Researcher     | What gaps remain?       | Floating chat hardcoded, stat cards need click |
| 2     | Simplifier     | Minimum viable scope?   | Keep existing Prisma queries, add click + chat count |
| 3     | Boundary Keeper| What's NOT this phase?   | Real-time updates, message sending excluded |

---

*Phase: 75-user-dashboard*
*Spec created: 2026-06-21*
*Next step: /gsd-discuss-phase 75 — implementation decisions (click handlers, chat API, CSS matching)*
