# React Query Standards

**Purpose:** Document React Query setup, caching strategy, and hook patterns

**Last Updated:** 2026-06-19

---

## Overview

React Query (TanStack Query) provides declarative data fetching with automatic caching, background updates, and stale data management. All data fetching in the application uses React Query hooks.

## Centralized Setup

### QueryClient Provider

Single QueryClient instance at root level:

```typescript
// src/lib/react-query.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,      // 5 minutes (overridden per-entity)
        gcTime: 30 * 60 * 1000,        // 30 minutes (formerly cacheTime)
        retry: 3,                       // 3 retries on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,    // Don't refetch on window focus
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Root Layout Integration

```typescript
// src/app/layout.tsx
import { ReactQueryProvider } from '@/lib/react-query';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

## Query Keys

### Array-Based Pattern

Use array keys for precise cache invalidation:

```typescript
// Format: ['entity', filters?]
const queryKeys = {
  // Simple entity
  requests: () => ['requests'] as const,

  // Entity with filters
  requestsFiltered: (filters: RequestFilters) =>
    ['requests', filters] as const,

  // Single entity by ID
  requestById: (id: string) =>
    ['requests', id] as const,

  // Nested entity
  requestMessages: (requestId: string) =>
    ['requests', requestId, 'messages'] as const,
};

// Usage
useQuery({
  queryKey: queryKeys.requestsFiltered({ status: 'pending' }),
  queryFn: () => fetchRequests({ status: 'pending' }),
});
```

### Query Key Hierarchy

```
['requests']                    → All requests
['requests', { status }]        → Requests with filter
['requests', id]                → Single request
['requests', id, 'messages']    → Messages for request
['requests', id, 'documents']   → Documents for request
```

This hierarchy allows precise cache invalidation:

```typescript
// Invalidate all requests
queryClient.invalidateQueries({ queryKey: ['requests'] });

// Invalidate only filtered requests
queryClient.invalidateQueries({
  queryKey: ['requests', { status: 'pending' }]
});

// Invalidate specific request and its sub-queries
queryClient.invalidateQueries({
  queryKey: ['requests', requestId]
});
```

## Per-Entity StaleTime

Different entities have different update frequencies:

```typescript
// src/lib/react-query.tsx
export const staleTimes = {
  requests: 2 * 60 * 1000,    // 2 minutes - frequently changing
  messages: 1 * 60 * 1000,    // 1 minute - chat-like behavior
  audit: 1 * 60 * 1000,       // 1 minute - real-time needs
  users: 5 * 60 * 1000,       // 5 minutes - relatively stable
  vault: 5 * 60 * 1000,       // 5 minutes - file metadata stable
  workspaces: 5 * 60 * 1000,  // 5 minutes - config data
};
```

### Usage in Hooks

```typescript
// src/hooks/useRequests.ts
export function useRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: queryKeys.requestsFiltered(filters),
    queryFn: () => requestsApi.list(filters),
    staleTime: staleTimes.requests,  // 2 minutes
  });
}

// src/hooks/useUsers.ts
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.usersFiltered(filters),
    queryFn: () => usersApi.list(filters),
    staleTime: staleTimes.users,  // 5 minutes
  });
}
```

## Hook Patterns

### Hook Wraps API Module

Each hook wraps the corresponding API module from `src/lib/api/index.ts`:

```typescript
// src/hooks/useRequests.ts
import { requestsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: ['requests', filters],
    queryFn: () => requestsApi.list(filters),  // ✅ Wraps API module
    staleTime: staleTimes.requests,
  });
}

export function useRequestById(id: string) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsApi.get(id),  // ✅ Wraps API module
    staleTime: staleTimes.requests,
    enabled: !!id,  // Only fetch if ID exists
  });
}
```

### Error Handling: Hook Throws, Component Catches

Hooks throw errors, components decide how to handle:

```typescript
// Hook: throws errors
export function useRequests(filters?: RequestFilters) {
  const query = useQuery({
    queryKey: ['requests', filters],
    queryFn: () => requestsApi.list(filters),
    staleTime: staleTimes.requests,
  });

  // Let errors propagate to component
  return query;
}

// Component: catches and handles errors
function RequestsPage() {
  const { data, isLoading, error } = useRequests();

  if (error) {
    // Component decides: show toast, render error UI, or retry
    toast.error(`Failed to load requests: ${error.message}`);
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  if (isLoading) return <LoadingSkeleton variant="table-row" />;

  return <RequestList requests={data} />;
}
```

### Mutation Hooks

Use `useMutation` for write operations:

```typescript
// src/hooks/useRequests.ts
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRequestInput) => requestsApi.create(data),

    onSuccess: () => {
      // Invalidate requests list to show new request
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },

    onError: (error) => {
      // Let component handle error
      throw error;
    },
  });
}

// Component usage
function CreateRequestForm() {
  const createRequest = useCreateRequest();

  const handleSubmit = async (data: CreateRequestInput) => {
    try {
      await createRequest.mutateAsync(data);
      toast.success('Request created successfully');
      router.push('/requests');
    } catch (error) {
      toast.error(`Failed to create request: ${error.message}`);
    }
  };

  return <Form onSubmit={handleSubmit} />;
}
```

## Retry Strategy

### Exponential Backoff

3 retries with exponential backoff (1s, 2s, 4s):

```typescript
// src/lib/react-query.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
  },
});
```

### Retry Behavior

| Attempt | Delay | Total Wait |
|---------|-------|------------|
| 1st retry | 1s | 1s |
| 2nd retry | 2s | 3s |
| 3rd retry | 4s | 7s |

After 3 failures, error is thrown to component.

## Prefetching

### Common Queries

Prefetch frequently accessed data on user login:

```typescript
// src/lib/auth.tsx
import { queryClient } from '@/lib/react-query';

export async function prefetchUserData(userId: string) {
  // Prefetch requests list
  await queryClient.prefetchQuery({
    queryKey: ['requests'],
    queryFn: () => requestsApi.list(),
    staleTime: staleTimes.requests,
  });

  // Prefetch user profile
  await queryClient.prefetchQuery({
    queryKey: ['users', userId],
    queryFn: () => usersApi.get(userId),
    staleTime: staleTimes.users,
  });
}

// Call after successful login
async function handleLogin(credentials: LoginCredentials) {
  const user = await authApi.login(credentials);
  await prefetchUserData(user.id);
  router.push('/dashboard');
}
```

### Prefetch on Navigation

Prefetch data when user hovers over navigation links:

```typescript
function NavLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();

  const prefetchRequests = () => {
    queryClient.prefetchQuery({
      queryKey: ['requests'],
      queryFn: () => requestsApi.list(),
    });
  };

  return (
    <Link
      href={href}
      onMouseEnter={prefetchRequests}
    >
      {label}
    </Link>
  );
}
```

## Cache Invalidation

### After Mutations

Invalidate related queries after mutations:

```typescript
export function useUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequestInput }) =>
      requestsApi.update(id, data),

    onSuccess: (data, variables) => {
      // Invalidate specific request
      queryClient.invalidateQueries({
        queryKey: ['requests', variables.id]
      });

      // Invalidate requests list (status might have changed)
      queryClient.invalidateQueries({
        queryKey: ['requests']
      });
    },
  });
}
```

### Optimistic Updates

Update UI immediately, rollback on error:

```typescript
export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      requestsApi.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['requests', id] });

      // Snapshot previous value
      const previousRequest = queryClient.getQueryData(['requests', id]);

      // Optimistically update
      queryClient.setQueryData(['requests', id], (old: any) => ({
        ...old,
        status,
      }));

      return { previousRequest };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['requests', variables.id],
        context?.previousRequest
      );
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
```

## Best Practices

### ✅ Do: Use Typed Query Keys

```typescript
// GOOD: Type-safe query keys
const queryKeys = {
  requests: (filters?: RequestFilters) =>
    ['requests', filters] as const,  // ✅ as const
};

// BAD: Untyped query keys
const queryKey = ['requests', filters];  // ❌ Type: (string | Filters)[]
```

### ✅ Do: Enable Queries Conditionally

```typescript
// GOOD: Only fetch when ID exists
useQuery({
  queryKey: ['requests', id],
  queryFn: () => requestsApi.get(id),
  enabled: !!id,  // ✅ Conditional fetch
});

// BAD: Fetch with undefined ID
useQuery({
  queryKey: ['requests', id],
  queryFn: () => requestsApi.get(id),  // ❌ id might be undefined
});
```

### ✅ Do: Use Placeholder Data

```typescript
// GOOD: Show skeleton while loading
const { data, isLoading } = useRequests();

if (isLoading) return <LoadingSkeleton />;

return <RequestList requests={data ?? []} />;
```

### ❌ Don't: Fetch in useEffect

```typescript
// BAD: Manual fetch in useEffect
useEffect(() => {
  fetch('/api/requests').then(setRequests);  // ❌ Bypasses React Query
}, []);

// GOOD: Use React Query
const { data } = useRequests();  // ✅ Automatic caching, retries
```

### ❌ Don't: Duplicate Query Clients

```typescript
// BAD: Multiple QueryClient instances
const client1 = new QueryClient();
const client2 = new QueryClient();  // ❌ Separate caches

// GOOD: Single QueryClient at root
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

## Debugging

### React Query DevTools

Enable DevTools in development:

```typescript
// src/lib/react-query.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function ReactQueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Data not updating | Stale time too long | Reduce `staleTime` or invalidate |
| Infinite refetch | Query key changes every render | Memoize query key |
| Cache not working | Different query keys | Use consistent key format |
| Retry not working | Error not thrown | Ensure API client throws errors |

---

*Document: REACT_QUERY.md*
*Part of: Phase 73 - Shared Foundation*
