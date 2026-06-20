import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRequests, useRequestById } from './useRequests';
import { requestsApi } from '@/lib/api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('@/lib/api', () => ({
  requestsApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock query keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    requests: {
      list: (filters: any) => ['requests', 'list', filters],
      detail: (id: string) => ['requests', 'detail', id],
    },
  },
}));

describe('useRequests Hook', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  describe('useRequests', () => {
    it('should fetch requests list successfully', async () => {
      const mockData = {
        data: [
          { id: '1', title: 'Request 1', status: 'pending' },
          { id: '2', title: 'Request 2', status: 'completed' },
        ],
        meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      vi.mocked(requestsApi.list).mockResolvedValue(mockData);

      const { result } = renderHook(() => useRequests({ page: 1, pageSize: 20 }), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(requestsApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it('should handle fetch error', async () => {
      vi.mocked(requestsApi.list).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRequests(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct query key', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      const filters = { page: 1, status: 'pending' };
      renderHook(() => useRequests(filters), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['requests', 'list', filters])).toBeDefined());
    });

    it('should call API with undefined when no filters provided', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      renderHook(() => useRequests(), { wrapper });

      await waitFor(() => expect(requestsApi.list).toHaveBeenCalledWith(undefined));
    });
  });

  describe('useRequestById', () => {
    it('should fetch single request by ID successfully', async () => {
      const mockData = { id: '123', title: 'Request Detail', status: 'in_progress' };
      vi.mocked(requestsApi.get).mockResolvedValue(mockData);

      const { result } = renderHook(() => useRequestById('123'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(requestsApi.get).toHaveBeenCalledWith('123');
    });

    it('should handle fetch error', async () => {
      vi.mocked(requestsApi.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useRequestById('999'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Not found');
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useRequestById(''), { wrapper });

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.fetchStatus).toBe('idle');
      expect(requestsApi.get).not.toHaveBeenCalled();
    });

    it('should use correct query key', async () => {
      vi.mocked(requestsApi.get).mockResolvedValue({ id: '456' });

      renderHook(() => useRequestById('456'), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['requests', 'detail', '456'])).toBeDefined());
    });
  });
});
