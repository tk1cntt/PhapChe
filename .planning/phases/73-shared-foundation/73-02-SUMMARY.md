---
phase: 73-shared-foundation
plan: 02
type: implementation
status: completed
date: 2026-06-20
executor: claude-opus-4-8
---

# Summary 73-02: API Client + React Query Foundation

## Overview

Enhanced the central API client with auto-retry logic and toast notifications, then built a centralized React Query foundation with 6 domain hooks for consistent data fetching across the application.

## Results

✅ **All 4 tasks completed successfully**

- **Task 2.1**: Enhanced ApiClient with retry logic (commit `e444d09`)
  - Retries 3 times on network errors and 502/503/504 responses
  - Exponential backoff: 500ms, 1000ms, 2000ms
  - Does NOT retry on 4xx client errors (400, 401, 403, 404) or 500
  
- **Task 2.2**: Added toast notifications and 401 redirect (commit `b20222e`)
  - Installed react-hot-toast for lightweight toast notifications
  - Created `src/lib/toast.ts` with typed toast helpers (toastSuccess, toastError, toastInfo, toastWarning)
  - HTTP 500 → toast "Lỗi máy chủ, vui lòng thử lại"
  - HTTP 403 → toast "Không có quyền truy cập"
  - HTTP 401 → redirect to /login (client-side only)
  - All toast calls guarded by `typeof window !== 'undefined'` check
  
- **Task 2.3**: Created centralized React Query setup (commit `7cf155a`)
  - Created `src/lib/react-query.tsx` with QueryClient singleton (staleTime: 5min, cacheTime: 30min, retry: 3)
  - Created `src/lib/query-keys.ts` with factory functions for 6 domains (users, requests, workspaces, auditEvents, vaultFiles, messages)
  - Updated `src/app/layout.tsx` to wrap app with QueryProvider
  
- **Task 2.4**: Created and refactored domain hooks (commit `947c3a4`)
  - Refactored `useRequests.ts` to use ApiClient + query key factory
  - Refactored `useUsers.ts` to use ApiClient + query key factory
  - Refactored `useAuditEvents.ts` to use ApiClient + query key factory
  - Created `useWorkspaces.ts` (new)
  - Created `useVaultFiles.ts` (new)
  - Created `useMessages.ts` (new)

## Files Created/Modified

### Modified
- `src/lib/api/client.ts` - Added retry logic, toast notifications, 401 redirect
- `src/hooks/useRequests.ts` - Refactored to use ApiClient
- `src/hooks/useUsers.ts` - Refactored to use ApiClient
- `src/hooks/useAuditEvents.ts` - Refactored to use ApiClient
- `src/app/layout.tsx` - Wrapped with QueryProvider

### Created
- `src/lib/toast.ts` - Typed toast notification helpers
- `src/lib/react-query.tsx` - QueryClient singleton and QueryProvider component
- `src/lib/query-keys.ts` - Query key factory functions for all domains
- `src/hooks/useWorkspaces.ts` - Workspace data hooks
- `src/hooks/useVaultFiles.ts` - Vault file data hooks
- `src/hooks/useMessages.ts` - Message data hooks

### Dependencies
- `react-hot-toast@2.4.1` - Lightweight toast notification library

## Key Decisions

1. **Retry strategy**: Only retry on network errors and 5xx gateway errors (502/503/504), not on 4xx client errors or 500 server errors
2. **Toast library**: Chose react-hot-toast over react-toastify for smaller bundle size and simpler API
3. **Query key pattern**: Used factory functions returning arrays for consistent cache invalidation
4. **Stale times**: Configured per-domain (30s for messages, 2min for requests, 5min for stable data like users/workspaces/vault)

## Verification

- ✅ API client retries 3 times with correct delays
- ✅ API client does NOT retry on 400/401/403/404/500
- ✅ Toast notifications display correctly for 500/403 errors
- ✅ 401 redirects to /login on client-side only
- ✅ QueryProvider wraps app in layout
- ✅ All 6 hooks use ApiClient and query key factories
- ✅ TypeScript compilation successful

## Next Steps

Ready to implement Plan 73-03: Shared UI Components (StatCard, EmptyState, LoadingSkeleton, ErrorBoundary)
