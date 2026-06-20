import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock ReactQueryDevtools since it's not needed in tests
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

import { queryClient, QueryProvider } from './react-query';

describe('React Query Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('QueryClient Configuration', () => {
    it('should export queryClient singleton', () => {
      expect(queryClient).toBeDefined();
    });

    it('should have staleTime of 5 minutes', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('should have gcTime of 30 minutes', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.gcTime).toBe(30 * 60 * 1000);
    });

    it('should have retry count of 3', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.retry).toBe(3);
    });

    it('should have refetchOnWindowFocus disabled', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });
  });

  describe('QueryProvider', () => {
    it('should render children', () => {
      render(
        <QueryProvider>
          <div data-testid="child">Test Child</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide QueryClient to children', () => {
      const TestComponent = () => {
        const client = useQueryClient();
        return <div data-testid="has-client">{client ? 'yes' : 'no'}</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(screen.getByTestId('has-client')).toHaveTextContent('yes');
    });

    it('should use the same queryClient instance', () => {
      let capturedClient: any = null;

      const TestComponent = () => {
        capturedClient = useQueryClient();
        return <div>Test</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(capturedClient).toBe(queryClient);
    });
  });
});
