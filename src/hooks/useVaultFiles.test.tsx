import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVaultFiles, useVaultFileById } from './useVaultFiles';
import { vaultApi } from '@/lib/api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('@/lib/api', () => ({
  vaultApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock query keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    vaultFiles: {
      list: (filters: any) => ['vaultFiles', 'list', filters],
      detail: (id: string) => ['vaultFiles', 'detail', id],
    },
  },
}));

describe('useVaultFiles Hook', () => {
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

  describe('useVaultFiles', () => {
    it('should fetch vault files list successfully', async () => {
      const mockData = {
        data: [
          { id: '1', name: 'File 1.pdf', size: 1024 },
          { id: '2', name: 'File 2.docx', size: 2048 },
        ],
        meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      };

      vi.mocked(vaultApi.list).mockResolvedValue(mockData);

      const { result } = renderHook(() => useVaultFiles({ page: 1, pageSize: 20 }), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(vaultApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it('should handle fetch error', async () => {
      vi.mocked(vaultApi.list).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useVaultFiles(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct query key', async () => {
      vi.mocked(vaultApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      const filters = { page: 1 };
      renderHook(() => useVaultFiles(filters), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['vaultFiles', 'list', filters])).toBeDefined());
    });

    it('should call API with undefined when no filters provided', async () => {
      vi.mocked(vaultApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });

      renderHook(() => useVaultFiles(), { wrapper });

      await waitFor(() => expect(vaultApi.list).toHaveBeenCalledWith(undefined));
    });
  });

  describe('useVaultFileById', () => {
    it('should fetch single vault file by ID successfully', async () => {
      const mockData = { id: '123', name: 'Document.pdf', size: 1024 };
      vi.mocked(vaultApi.get).mockResolvedValue(mockData);

      const { result } = renderHook(() => useVaultFileById('123'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(vaultApi.get).toHaveBeenCalledWith('123');
    });

    it('should handle fetch error', async () => {
      vi.mocked(vaultApi.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useVaultFileById('999'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Not found');
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useVaultFileById(''), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.fetchStatus).toBe('idle');
      expect(vaultApi.get).not.toHaveBeenCalled();
    });

    it('should use correct query key', async () => {
      vi.mocked(vaultApi.get).mockResolvedValue({ id: '456' });

      renderHook(() => useVaultFileById('456'), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['vaultFiles', 'detail', '456'])).toBeDefined());
    });
  });
});
