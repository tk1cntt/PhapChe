'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

/**
 * Centralized QueryClient singleton
 *
 * Defaults:
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - gcTime: 30 minutes (unused data garbage collected after 30 min)
 * - retry: 3 attempts on failure
 * - refetchOnWindowFocus: false (prevent unnecessary refetches)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * QueryProvider component - wraps app with QueryClientProvider
 *
 * Usage: Wrap your app root with this provider in layout.tsx
 * Includes ReactQueryDevtools for development debugging
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
