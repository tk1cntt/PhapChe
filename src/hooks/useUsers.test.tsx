import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useUserById } from './useUsers';
import { usersApi } from '@/lib/api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('@/lib/api', () => ({
  usersApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock query keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    users: {
      list: (filters: any) => ['users', 'list', filters],
      detail: (id: string) => ['users', 'detail', id],
    },
  },
}));

describe('useUsers Hook', () => {
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

  describe('useUsers', () => {
    it('should fetch users list successfully', async () => {
      const mockData = {
        data: [
          { id: '1', name: 'User 1', email: 'user1@example.com' },
          { id: '2', name: 'User 2', email: 'user2@example.com' },
        ],
        meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      vi.mocked(usersApi.list).mockResolvedValue(mockData);

      const { result } = renderHook(() => useUsers({ page: 1, pageSize: 20 }), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(usersApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it('should handle fetch error', async () => {
      vi.mocked(usersApi.list).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct query key', async () => {
      vi.mocked(usersApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      const filters = { page: 1, role: 'admin' };
      renderHook(() => useUsers(filters), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['users', 'list', filters])).toBeDefined());
    });

    it('should call API with undefined when no filters provided', async () => {
      vi.mocked(usersApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      renderHook(() => useUsers(), { wrapper });

      await waitFor(() => expect(usersApi.list).toHaveBeenCalledWith(undefined));
    });
  });

  describe('useUserById', () => {
    it('should fetch single user by ID successfully', async () => {
      const mockData = { id: '123', name: 'User Detail', email: 'user@example.com' };
      vi.mocked(usersApi.get).mockResolvedValue(mockData);

      const { result } = renderHook(() => useUserById('123'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(usersApi.get).toHaveBeenCalledWith('123');
    });

    it('should handle fetch error', async () => {
      vi.mocked(usersApi.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useUserById('999'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Not found');
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useUserById(''), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.fetchStatus).toBe('idle');
      expect(usersApi.get).not.toHaveBeenCalled();
    });

    it('should use correct query key', async () => {
      vi.mocked(usersApi.get).mockResolvedValue({ id: '456' });

      renderHook(() => useUserById('456'), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['users', 'detail', '456'])).toBeDefined());
    });
  });
});
