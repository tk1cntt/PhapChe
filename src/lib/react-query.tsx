'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

/**
 * QueryClient factory
 *
 * Defaults:
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - gcTime: 30 minutes (unused data garbage collected after 30 min)
 * - retry: 3 attempts on failure
 * - refetchOnWindowFocus: false (prevent unnecessary refetches)
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new QueryClient to avoid cross-request contamination
    return makeQueryClient();
  }
  // Browser: reuse the same QueryClient across the component lifecycle
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/**
 * SSR-safe queryClient accessor.
 * On the server, always returns a fresh instance to avoid cross-request contamination.
 * On the browser, returns the cached singleton.
 * Prefer using QueryProvider over direct import in most cases.
 */
export const queryClient = typeof window === 'undefined' ? makeQueryClient() : (browserQueryClient ??= makeQueryClient());

/**
 * QueryProvider component - wraps app with QueryClientProvider
 *
 * Usage: Wrap your app root with this provider in layout.tsx
 * Includes ReactQueryDevtools for development debugging
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
