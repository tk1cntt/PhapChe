---
phase: 24-tanstack-query
plan: "01"
subsystem: data-fetching
tags: [tanstack-query, react-query, caching, state-management]
dependency_graph:
  requires: []
  provides:
    - DATA-01: TanStack Query v5 installed and working
    - DATA-02: QueryClientProvider added to app layout
    - DATA-03: Query key convention established
    - DATA-04: Devtools in development only
    - DATA-05: Cache configured (staleTime 30s, gcTime 5min)
  affects:
    - Phase 25: Pagination & Search (will use useRequests hook)
tech_stack:
  added: ["@tanstack/react-query@5", "@tanstack/react-query-devtools"]
  patterns: ["QueryClientProvider", "queryKeys convention", "SSR-safe hydration"]
key_files:
  created:
    - src/app/providers/ReactQueryProvider.tsx
    - src/hooks/useRequests.ts
  modified:
    - src/app/layout.tsx
    - package.json
decisions:
  - Server/browser aware QueryClient for Next.js App Router hydration
  - Devtools hidden in production via NODE_ENV check
  - Query key convention: ['entity', workspaceId?] pattern
metrics:
  duration: ~2 minutes
  completed_date: 2026-06-10T12:05:00Z
---

# Phase 24 Plan 01: TanStack Query v5 Setup Summary

TanStack Query v5 installed and configured with proper caching strategy, query key convention established, and ReactQueryProvider integrated into app layout.

## One-liner

TanStack Query v5 integration with SSR-safe QueryClientProvider, query key convention, and development devtools.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install @tanstack/react-query@5 | 1565b06 | package.json, package-lock.json |
| 2 | Create ReactQueryProvider | 72c6da2 | src/app/providers/ReactQueryProvider.tsx |
| 3 | Add Provider to layout | 650ad26 | src/app/layout.tsx |
| 4 | Create useRequests hook | 537cd7e | src/hooks/useRequests.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `1565b06` chore(24-01): install @tanstack/react-query@5 and devtools
- `72c6da2` feat(24-01): add ReactQueryProvider with TanStack Query v5 config
- `650ad26` feat(24-01): integrate ReactQueryProvider into root layout
- `537cd7e` feat(24-01): add useRequests hook demonstrating query key convention

## Verification Results

| Check | Status |
|-------|--------|
| TanStack Query in package.json | PASS |
| Cache config (staleTime: 30s, gcTime: 5min) | PASS |
| ReactQueryProvider in layout | PASS |
| Query key convention | PASS |
| Devtools development only | PASS |

## Requirements Satisfied

- DATA-01: TanStack Query v5 installed and working
- DATA-02: QueryClientProvider added to app layout
- DATA-03: Query key convention established ['entity', workspaceId?] pattern
- DATA-04: Devtools visible in development, hidden in production
- DATA-05: Cache configured with staleTime 30s and gcTime 5min

## Key Files

```typescript
// src/app/providers/ReactQueryProvider.tsx
export default function ReactQueryProvider({ children }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// src/hooks/useRequests.ts
export const queryKeys = {
  requests: (workspaceId?: string) => ["requests", workspaceId] as const,
};

export function useRequests(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.requests(workspaceId),
    queryFn: () => fetchRequests(workspaceId),
  });
}
```

## Next Steps

Phase 25 (Pagination & Search) will use this foundation:
- Server-side pagination with URL persistence
- Search/filter with TanStack Query integration
- useRequests hook will call real API instead of mock data
