import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkspaces, useWorkspaceById } from './useWorkspaces';
import { workspacesApi } from '@/lib/api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('@/lib/api', () => ({
  workspacesApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock query keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    workspaces: {
      list: (filters: any) => ['workspaces', 'list', filters],
      detail: (id: string) => ['workspaces', 'detail', id],
    },
  },
}));

describe('useWorkspaces Hook', () => {
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

  describe('useWorkspaces', () => {
    it('should fetch workspaces list successfully', async () => {
      const mockData = {
        data: [
          { id: '1', name: 'Workspace 1' },
          { id: '2', name: 'Workspace 2' },
        ],
        meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      vi.mocked(workspacesApi.list).mockResolvedValue(mockData);

      const { result } = renderHook(() => useWorkspaces({ page: 1, pageSize: 20 }), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(workspacesApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it('should handle fetch error', async () => {
      vi.mocked(workspacesApi.list).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWorkspaces(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct query key', async () => {
      vi.mocked(workspacesApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      const filters = { page: 1 };
      renderHook(() => useWorkspaces(filters), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['workspaces', 'list', filters])).toBeDefined());
    });

    it('should call API with undefined when no filters provided', async () => {
      vi.mocked(workspacesApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      renderHook(() => useWorkspaces(), { wrapper });

      await waitFor(() => expect(workspacesApi.list).toHaveBeenCalledWith(undefined));
    });
  });

  describe('useWorkspaceById', () => {
    it('should fetch single workspace by ID successfully', async () => {
      const mockData = { id: '123', name: 'Workspace Detail' };
      vi.mocked(workspacesApi.get).mockResolvedValue(mockData);

      const { result } = renderHook(() => useWorkspaceById('123'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(workspacesApi.get).toHaveBeenCalledWith('123');
    });

    it('should handle fetch error', async () => {
      vi.mocked(workspacesApi.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useWorkspaceById('999'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Not found');
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useWorkspaceById(''), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.fetchStatus).toBe('idle');
      expect(workspacesApi.get).not.toHaveBeenCalled();
    });

    it('should use correct query key', async () => {
      vi.mocked(workspacesApi.get).mockResolvedValue({ id: '456' });

      renderHook(() => useWorkspaceById('456'), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['workspaces', 'detail', '456'])).toBeDefined());
    });
  });
});
