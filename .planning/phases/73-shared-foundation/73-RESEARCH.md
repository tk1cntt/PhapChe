# Phase 73: Shared Foundation — Research

**Date:** 2026-06-19
**Phase:** 73-shared-foundation

## 1. Seed Data Framework

### Current State Analysis

- `prisma/seed.ts` (510 lines) — monolithic seed file with users, workspaces, partners, engagements, matter types, folders, tags, requests, documents
- 8 scattered `seed-*.ts` files: `seed-customer-dashboard.ts`, `seed-dashboard-activity.ts`, `seed-messages.ts`, `seed-my-cases.ts`, `seed-org-activity.ts`, `seed-partners.ts`, `seed-user-activity.ts`, `seed-user-orgs.ts`
- Uses `upsert` pattern with hardcoded IDs
- Uses `better-auth`'s `hashPassword` for user credentials
- Uses `auth.api.signUpEmail()` for some user creation

### Implementation Decisions

**Organization:** By business layer (confirmed from CONTEXT.md)
- `prisma/seed/foundation.ts` — Users (10), Accounts, Organizations (3), Workspaces (5), Memberships, RoutingCapabilities
- `prisma/seed/operations.ts` — LegalRequests (50), AuditEvents (100), VaultFiles (20), Messages (30)
- `prisma/seed/partners.ts` — Partners (5), ServiceTypes
- `prisma/seed/index.ts` — Orchestrator with transaction rollback

**Existing seed.ts must be preserved** — it has critical Phase 16 fixtures, MatterTypes, Folders, Tags, and An Phat workspace. New framework ADDS to existing seed, doesn't replace it.

**Wipe Strategy:** Delete in reverse dependency order before seed:
1. DocumentVersion → Document → AuditEvent → VaultFile → Message
2. LegalRequest → RoutingCapability → WorkspaceMembership
3. Partner → ServiceType → MatterType → Folder → Tag
4. Account → Session → User → Workspace → Organization → Tenant

**Realistic Vietnamese Data:** Hardcoded arrays (not faker) — more realistic names, addresses, legal document titles for Vietnamese legal platform. Faker would produce unrealistic Vietnamese legal terms.

**Transaction Pattern:**
```typescript
await prisma.$transaction(async (tx) => {
  await seedFoundation(tx);
  await seedOperations(tx);
  await seedPartners(tx);
});
```

## 2. API Client Enhancement

### Current State Analysis

- `src/lib/api/client.ts` — 116 lines, singleton ApiClient class
- Already has typed methods: `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`
- Returns `Promise<T>` directly (unwraps response)
- Throws `Error` on non-ok responses with parsed error data
- Uses `credentials: 'include'` for auth cookies
- `src/lib/api/index.ts` — 310 lines, domain API modules (requestsApi, usersApi, workspacesApi, messagesApi, vaultApi, settingsApi, adminApi, intakeApi, workflowsApi, templatesApi)

### Enhancement Strategy

**Auto-retry (3x exponential backoff):**
- Only retry on network errors (`TypeError: Failed to fetch`) and 502/503/504 responses
- Delays: 500ms → 1000ms → 2000ms
- Wrap existing `request()` method — add retry loop around fetch call
- Use `await new Promise(resolve => setTimeout(resolve, delay))` for delay
- Do NOT retry on 4xx errors (client errors should not be retried)

**Toast Notifications:**
- Install `react-hot-toast` (already lightweight, Tailwind-stylable)
- Create `src/lib/toast.ts` — thin wrapper around `react-hot-toast` with typed methods
- In API client: on 500 errors, call `toast.error()` automatically
- On 403: `toast.error('Không có quyền truy cập')`
- ToastProvider must be added alongside QueryClientProvider in layout

**401 Redirect:**
- In API client error handler: if `response.status === 401`, redirect to `/login`
- Use `window.location.href = '/login'` (not router — client-side only)
- Only redirect on client-side (check `typeof window !== 'undefined'`)
- Do NOT redirect for server-side API calls

**Backward Compatibility:**
- Keep existing `request()` signature unchanged
- Add retry/toast/redirect as internal behavior within `request()`
- All domain API modules in `index.ts` continue working without changes

## 3. React Query Setup

### Current State Analysis

- `@tanstack/react-query` v5.101.0 already in package.json
- NO `QueryClientProvider` setup anywhere in the app
- 3 existing hooks: `useRequests.ts`, `useUsers.ts`, `useAuditEvents.ts`
- Hooks currently use direct `fetch()` calls, not ApiClient

### Centralized Setup

**File:** `src/lib/react-query.tsx`
```typescript
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes (was cacheTime in v4)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Note:** In TanStack Query v5, `cacheTime` was renamed to `gcTime`. Must use `gcTime`.

**Provider wrapping:** Add `<QueryClientProvider client={queryClient}>` in root layout (`src/app/layout.tsx`), alongside existing providers.

**ToasterProvider:** Add `<Toaster position="top-right" />` from react-hot-toast in same layout.

### Domain Hooks Refactoring

**Query Key Factory Pattern:**
```typescript
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  requests: { /* similar pattern */ },
  // ... per domain
};
```

**Per-entity staleTime overrides:**
- Requests: 2 min (`staleTime: 2 * 60 * 1000`)
- Messages: 1 min (`staleTime: 60 * 1000`)
- AuditEvents: 1 min
- Users: 5 min (global default)
- VaultFiles: 5 min

**Hook Error Handling:** Hooks use `useQuery` with `throwOnError: false` (default). Components check `isError` state. Hooks do NOT throw — they expose error state.

## 4. Shared UI Components

### ErrorBoundary

**Approach:** React class component (only option for error boundaries in React)
- `componentDidCatch` for error logging
- Fallback UI: error message + "Thử lại" (Retry) button
- Tailwind-styled fallback with icon
- i18n via next-intl `useTranslations` (but class components can't use hooks — use `getTranslations` from next-intl/server or pass translated strings as props)
- Actually: wrap class component in HOC that injects translations, OR use a functional ErrorFallback component rendered by the class boundary

### LoadingSkeleton

**Approach:** Functional component with variant props
- Variants: `card`, `table-row`, `list-item`, `text-line`
- Shimmer animation via Tailwind `animate-pulse` with `bg-gradient-to-r`
- Count prop for multiple skeletons
- Pure Tailwind — no external animation library needed

### EmptyState

**Approach:** Functional component
- Props: `icon` (ReactNode), `title`, `description`, `action` (optional { label, onClick })
- Centered layout with max-width
- Tailwind styling

## 5. Auth & Permissions Hooks

### useAuth

**Wrap next-auth's useSession():**
```typescript
import { useSession } from 'next-auth/react';
export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
```

**Wait — project uses Better Auth, not Next Auth.** Need to check existing auth setup:
- `src/auth.ts` exports `auth` with `auth.api.getSession()`
- For client-side: need to check if there's a session hook or use fetch to `/api/auth/get-session`
- If no existing client hook: create one that calls session API and caches result

### usePermissions

- Receives user from useAuth
- Returns `{ can(action, resource), cannot(action, resource) }`
- Role-based checks using user's memberships and roles
- Memoized with `useMemo`

## 6. i18n for Shared Components

**Existing i18n setup:** next-intl with `messages/{locale}.json` files
- Add keys under `shared` namespace:
  - `shared.errorBoundary.title`, `shared.errorBoundary.message`, `shared.errorBoundary.retry`
  - `shared.loadingSkeleton.loading`
  - `shared.emptyState.noData`, `shared.emptyState.create`
  - `shared.toast.error`, `shared.toast.success`, `shared.toast.retry`

**Files to update:** `messages/vi.json`, `messages/en.json`, `messages/zh.json`, `messages/ja.json`

## 7. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Seed wipe deletes existing Phase 16 fixtures | Tests break | Preserve seed.ts's main() for existing fixtures; new seed ADDS |
| react-hot-toast conflicts with existing toast patterns | Double notifications | Audit existing toast usage, migrate to centralized |
| QueryClient wrapping breaks existing components | Runtime errors | Wrap at root layout level; components opt-in to useQuery |
| Auth hook wraps wrong auth system | Auth state unavailable | Must use Better Auth, not Next Auth — verify auth.ts exports |
| Existing hooks use different patterns | Inconsistent migration | Refactor in-place, keep same export names |

## 8. Validation Architecture

Tests will use Vitest (or Jest) + React Testing Library:
- API client: mock fetch, verify retry counts, toast calls, redirect behavior
- Hooks: `@tanstack/react-query`'s `renderHook` with wrapper
- Components: render + verify error catch, skeleton variants, empty state props
- Coverage target: ≥90%
