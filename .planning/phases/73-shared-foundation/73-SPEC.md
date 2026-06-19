# Phase 73: Shared Foundation — Specification

**Created:** 2026-06-19
**Ambiguity score:** 0.190 (gate: ≤ 0.20) ✅ Passed
**Requirements:** 12 locked

## Goal

Thiết lập shared infrastructure cho v2.2 bằng cách tạo organized seed data framework, enhanced API client với full automation error handling, centralized React Query setup với domain hooks, và reusable shared UI components để 23 screens có thể consume data từ database thay vì hardcode.

## Background

**Current state:**
- Seed data rời rạc trong 10+ files (seed-customer-dashboard.ts, seed-dashboard-activity.ts, etc.) không organized, khó maintain
- API client exist tại `src/lib/api/client.ts` nhưng thiếu full automation error handling (auto-retry, toast notifications, 401 redirects)
- Không có centralized React Query setup - components gọi API trực tiếp hoặc dùng ad-hoc solutions
- Shared UI components chỉ có StatCard.tsx, thiếu ErrorBoundary, LoadingSkeleton, EmptyState

**Gap:**
- 23 screens cần consistent data nhưng hiện tại mỗi screen phải tự tạo mock data hoặc hardcode
- Không có standardized error handling strategy - mỗi component handle errors khác nhau
- Không có loading state patterns - inconsistent UX across screens

**Trigger:**
- v2.2 sẽ implement 23 screens (phases 74-96), cần foundation trước để tránh duplicated effort

## Requirements

1. **Seed Data Framework**: Tạo organized structure trong `prisma/seed/` với domain-specific seed files.
   - Current: Seed files scattered in prisma/ root (seed-customer-dashboard.ts, seed-dashboard-activity.ts, etc.)
   - Target: `prisma/seed/` folder với domain files (users.ts, organizations.ts, workspaces.ts, requests.ts, audit-events.ts, vault-files.ts, messages.ts, partners.ts), index.ts orchestrates execution
   - Acceptance: `npm run seed` creates 10 users, 3 orgs, 5 workspaces, 50 requests, 100 audit events, 20 vault files, 30 messages, 5 partners with realistic Vietnamese data; all relationships preserved (org → workspace → members → requests); seed data covers all entities needed for 23 screens (phases 74-96); **wipe + reseed strategy**: delete all existing data before inserting (no upsert); **all-or-nothing execution**: if any domain seed fails, entire seed operation rolls back (no partial data)

2. **Seed Data Cleanup**: Delete old scattered seed files, migrate useful logic to new framework.
   - Current: Multiple seed-*.ts files in prisma/ root, some outdated or duplicated
   - Target: Only `prisma/seed/` folder exists, old files deleted
   - Acceptance: No seed-*.ts files in prisma/ root except seed.ts (entry point); new framework produces equivalent or better data coverage

3. **API Client Error Handling**: Enhance `src/lib/api/client.ts` với full automation error handling.
   - Current: API client exists but throws errors for components to handle manually
   - Target: Auto-retry 3x on network errors (500ms, 1s, 2s delays), custom Tailwind toast notifications (top-right position, 4 types: success/error/info/warning), automatic redirect to /login on 401 responses
   - Acceptance: Network failure triggers 3 retries then error toast; 401 response redirects to /login without component intervention; 403/500 show appropriate error messages via toast; toast component uses Tailwind CSS (not Ant Design) for consistency with custom styling

4. **API Client Typed Methods**: Add typed GET/POST/PATCH/DELETE methods với generic response types.
   - Current: API client has basic fetch wrapper
   - Target: `client.get<T>(url)`, `client.post<T>(url, data)`, `client.patch<T>(url, data)`, `client.delete(url)` with TypeScript generics
   - Acceptance: Methods return Promise<TypedResponse<T>>; TypeScript infers response type from generic parameter; methods handle JSON parsing and error wrapping

5. **React Query Centralized Setup**: Create QueryClient provider với sensible defaults.
   - Current: No centralized React Query setup, components manage their own QueryClient if used
   - Target: `src/lib/react-query.tsx` exports QueryClientProvider with defaults (staleTime: 5min, cacheTime: 10min, retry: 3)
   - Acceptance: QueryClientProvider wraps app at root level; all components can use useQuery/useMutation without setup; default options applied unless overridden; **query key pattern**: use array-based keys like `['users']`, `['users', id]`, `['requests', {status}]` for consistent cache invalidation

6. **React Query Domain Hooks**: Create custom hooks cho each domain (users, requests, workspaces, etc.).
   - Current: Ad-hoc hooks exist (useRequests.ts, useUsers.ts) but inconsistent patterns
   - Target: Each domain has `use[Domain]()` hook wrapping useQuery with proper query keys, typing, and error handling
   - Acceptance: Hooks exist for: useUsers, useUserById, useRequests, useRequestById, useWorkspaces, useWorkspaceById, useAuditEvents, useVaultFiles, useMessages; hooks return typed data with loading/error states; hooks use API client with automatic error handling; **hooks throw errors** (components must catch and decide toast behavior); **auto cleanup on unmount** (no manual cancel logic needed)

7. **ErrorBoundary Component**: Create reusable ErrorBoundary cho React error catching.
   - Current: No ErrorBoundary component exists
   - Target: `src/components/shared/ErrorBoundary.tsx` catches render errors and displays fallback UI
   - Acceptance: Component catches child render errors; displays user-friendly error message with "Try Again" button; logs error to console; can be wrapped around any component tree

8. **LoadingSkeleton Component**: Create reusable loading states.
   - Current: No standardized loading component, each screen implements own spinner/skeleton
   - Target: `src/components/shared/LoadingSkeleton.tsx` with variants (card, table-row, list-item, text-line)
   - Acceptance: Component renders shimmer animation; supports size/variant props; used consistently across all 23 screens in v2.2

9. **EmptyState Component**: Create reusable empty state display.
   - Current: No standardized empty state component
   - Target: `src/components/shared/EmptyState.tsx` with icon, title, description, action button props
   - Acceptance: Component renders when no data available; supports custom icon/title/description; optional action button (e.g., "Create New"); used consistently across all list/table screens in v2.2

10. **Context Hooks**: Create useAuth, usePermissions, useWorkspaceContext hooks.
    - Current: Auth state accessed via direct API calls or session storage
    - Target: Context providers + hooks expose current user, permissions, workspace context
    - Acceptance: `useAuth()` returns { user, isLoading, isAuthenticated }; `usePermissions()` returns { can, cannot } based on user role; `useWorkspaceContext()` returns current workspace and org info; hooks are typed and cached

11. **i18n for Shared Components**: Add translations for ErrorBoundary, LoadingSkeleton, EmptyState.
    - Current: i18n setup exists but no keys for shared components
    - Target: Translation keys in `messages/[locale].json` for "common.error", "common.loading", "common.empty"
    - Acceptance: All 3 shared components use useTranslations hook; keys exist in VI/EN/ZH/JA translation files; components render localized text based on current locale

12. **Foundation Tests**: Write unit tests cho API client, hooks, shared components.
    - Current: No tests for foundation infrastructure
    - Target: Test files co-located with implementation (client.test.ts, ErrorBoundary.test.tsx, etc.)
    - Acceptance: API client tests cover retry logic, 401 redirect, typed methods; hook tests mock API responses; component tests verify render/error states; coverage ≥90% for all new code

## Boundaries

**In scope:**
- Seed data framework với organized structure và cleanup
- Enhanced API client với full automation error handling
- Centralized React Query setup với domain hooks
- 3 shared UI components (ErrorBoundary, LoadingSkeleton, EmptyState)
- Context hooks (useAuth, usePermissions, useWorkspaceContext)
- i18n translations cho shared components
- Unit tests cho all new code

**Out of scope:**
- Integration with actual screens (phases 74-96) — đó là responsibility của mỗi phase
- E2E tests — sẽ done trong mỗi screen phase
- Visual design improvements — chỉ tạo reusable components, không redesign existing screens
- Performance optimization — focus on correctness first, optimize later nếu needed
- Real-time features (WebSocket, SSE) — not needed cho v2.2 screens
- Third-party integrations (analytics, monitoring) — separate concern

## Constraints

- **Data volume:** Seed data phải realistic nhưng không quá lớn để slow down development (max 200 total records)
- **Compatibility:** API client phải backward compatible với existing API calls trong codebase
- **TypeScript strict:** All new code phải pass TypeScript strict mode checks
- **Architecture compliance:** Phải tuân thủ 9 tài liệu trong `src/docs/` (API_STANDARDS, SERVICE_LAYER, CODE_STANDARDS, etc.)
- **No breaking changes:** Existing components sử dụng API client không được break
- **Locale support:** Shared components phải support 4 languages (VI/EN/ZH/JA) từ đầu
- **Auth access strategy:** Strict hook-only — components use `useAuth()` hook for client-side, `auth.api.getSession()` for server-side. No direct session storage access from components
- **i18n scope:** 100% translation coverage — all user-visible text (UI labels, error messages, toast notifications, empty states) must be translated in all 4 languages (VI/EN/ZH/JA)
- **Toast styling:** Custom Tailwind CSS component (not Ant Design) — project uses extensive custom CSS, Tailwind toast is more flexible and consistent with existing patterns
- **Cache strategy:** Conservative defaults — staleTime: 5 minutes, cacheTime: 30 minutes (balance between performance and data freshness)

## Acceptance Criteria

- [ ] `npm run seed` creates all required data (10 users, 3 orgs, 5 workspaces, 50 requests, 100 audit events, 20 vault files, 30 messages, 5 partners)
- [ ] Seed data uses realistic Vietnamese names, addresses, phone numbers
- [ ] All seed data relationships preserved (org → workspace → members → requests)
- [ ] Seed strategy uses wipe + reseed (delete all data, then insert fresh) with transaction rollback on failure
- [ ] API client auto-retries 3x on network errors with exponential backoff
- [ ] API client shows toast notification on 500 errors
- [ ] API client redirects to /login on 401 responses
- [ ] API client has typed methods: get<T>, post<T>, patch<T>, delete
- [ ] Custom Tailwind toast component exists (not Ant Design) with 4 types (success, error, info, warning) and top-right positioning
- [ ] QueryClientProvider wraps app at root level with sensible defaults
- [ ] React Query uses array-based query keys pattern (['users'], ['users', id], ['requests', {status}])
- [ ] Domain hooks exist for all major entities (users, requests, workspaces, audit, vault, messages)
- [ ] Hooks throw errors (components must catch and decide toast behavior)
- [ ] Hooks support auto cleanup on unmount (no manual cancel logic)
- [ ] useAuth hook provides strict hook-only access (no direct session storage access)
- [ ] ErrorBoundary catches render errors and displays fallback UI
- [ ] LoadingSkeleton supports card/table-row/list-item/text-line variants
- [ ] EmptyState supports icon/title/description/action button props
- [ ] All user-visible text has 100% translation coverage in VI/EN/ZH/JA (UI labels, error messages, toast notifications, empty states)
- [ ] Cache strategy uses conservative defaults (staleTime: 5min, cacheTime: 30min)
- [ ] Unit tests exist with ≥90% coverage for all new code
- [ ] No breaking changes to existing API client consumers

## Edge Coverage

**Coverage:** 12/12 applicable edges resolved · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| Empty data | R1 | ✅ covered | Seed framework ensures non-empty data for all entities |
| Network retry | R3 | ✅ covered | API client retries 3x with exponential backoff |
| Invalid response | R4 | ✅ covered | Typed methods validate JSON structure, throw on parse error |
| Cache invalidation | R5 | ✅ covered | Array-based query keys pattern enables precise cache invalidation (['users'], ['users', id], ['requests', {status}]) |
| Hook unmount | R6 | ✅ covered | Auto cleanup on unmount (React Query default behavior, no manual cancel logic) |
| Nested errors | R7 | ✅ covered | ErrorBoundary catches errors in entire child tree |
| Rapid loading states | R8 | ✅ covered | LoadingSkeleton is stateless, safe for rapid mount/unmount |
| Empty action | R9 | ✅ covered | EmptyState action button is optional, handles undefined |
| Unauthenticated | R10 | ✅ covered | useAuth handles null user gracefully |
| Missing translation | R11 | ✅ covered | useTranslations falls back to key if missing |
| Mock in tests | R12 | ✅ covered | Tests mock API client, not network |
| Concurrent seeds | R1 | ✅ covered | Sequential execution with transaction rollback ensures data consistency |
| Partial seed failure | R1 | ✅ covered | All-or-nothing execution - entire seed operation rolls back if any domain fails |
| Stale cache | R5 | ✅ covered | Conservative cache strategy (staleTime: 5min, cacheTime: 30min) balances performance and freshness |
| Hook error handling | R6 | ✅ covered | Hooks throw errors, components must catch and decide toast behavior |

## Prohibitions (must-NOT)

**Coverage:** 7/7 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| MUST NOT hardcode data in components | R1 | resolved | verification: judgment - code review enforces DB queries |
| MUST NOT throw unhandled errors in API client | R3 | resolved | verification: test - API client always catches and handles |
| MUST NOT use inline error handling in screens | R3 | resolved | verification: judgment - screens use API client, not fetch |
| MUST NOT create ad-hoc QueryClient per screen | R5 | resolved | verification: test - only one QueryClientProvider at root |
| MUST NOT duplicate loading/empty patterns | R8, R9 | resolved | verification: judgment - screens import shared components |
| MUST NOT access auth state directly | R10 | resolved | verification: judgment - strict hook-only strategy (useAuth for client, auth.api.getSession for server), no direct session storage access |
| MUST NOT skip translations for new UI | R11 | resolved | verification: judgment - 100% translation coverage required for all user-visible text (UI labels, error messages, toast notifications, empty states) in VI/EN/ZH/JA |
| MUST NOT use Ant Design toast/message components | R3 | resolved | verification: judgment - custom Tailwind toast component required for flexibility and consistency with existing custom CSS patterns |

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | All patterns and strategies locked |
| Boundary Clarity   | 0.88  | 0.70 | ✓      | Explicit out-of-scope list         |
| Constraint Clarity | 0.90  | 0.65 | ✓      | All constraints resolved           |
| Acceptance Criteria| 0.92  | 0.70 | ✓      | 23 pass/fail criteria              |
| **Ambiguity**      | 0.10  | ≤0.20| ✅      | All edges and prohibitions resolved|

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective    | Question summary         | Decision locked                    |
|-------|----------------|-------------------------|------------------------------------|
| 1     | Researcher     | How to handle existing seed files? | Replace completely - delete old, create organized prisma/seed/ structure |
| 1     | Researcher     | API client error handling strategy? | Full automation - auto-retry 3x, toast notifications, 401 redirect |
| 1     | Researcher     | React Query integration pattern? | Centralized + domain hooks - QueryClient with defaults, custom hooks per domain |
| 2     | Simplifier     | Seed failure handling? | All-or-nothing with transaction rollback - no partial data allowed |
| 2     | Simplifier     | Auth access pattern? | Strict hook-only - useAuth for client, auth.api.getSession for server, no direct session storage |
| 2     | Simplifier     | i18n coverage scope? | 100% translation - all user-visible text must be translated (UI labels, errors, toasts, empty states) |
| 3     | Failure Analyst | Cache invalidation strategy? | Array-based query keys pattern (['users'], ['users', id], ['requests', {status}]) for precise control |
| 3     | Failure Analyst | Hook cleanup behavior? | Auto cleanup on unmount - no manual cancel logic needed (React Query default) |
| 4     | Boundary Keeper | Toast library choice? | Custom Tailwind component (not Ant Design) - more flexible, consistent with custom CSS patterns |
| 4     | Boundary Keeper | Toast UI requirements? | Top-right positioning, 4 types (success/error/info/warning) |
| 4     | Boundary Keeper | Hook error handling? | Hooks throw errors - components must catch and decide toast behavior |

---

*Phase: 73-shared-foundation*
*Spec created: 2026-06-19*
*Next step: /gsd-discuss-phase 73 — implementation decisions (file structure, naming conventions, specific patterns)*
