import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessages, useMessageById } from './useMessages';
import { messagesApi } from '@/lib/api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('@/lib/api', () => ({
  messagesApi: {
    getThreads: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock query keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    messages: {
      list: (filters: any) => ['messages', 'list', filters],
      detail: (id: string) => ['messages', 'detail', id],
    },
  },
}));

describe('useMessages Hook', () => {
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

  describe('useMessages', () => {
    it('should fetch message threads successfully', async () => {
      const mockData = [
        { id: '1', requestId: 'req-1', lastMessage: 'Hello' },
        { id: '2', requestId: 'req-2', lastMessage: 'Hi there' },
      ];

      vi.mocked(messagesApi.getThreads).mockResolvedValue(mockData);

      const { result } = renderHook(() => useMessages(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(messagesApi.getThreads).toHaveBeenCalledWith({ requestId: undefined });
    });

    it('should handle fetch error', async () => {
      vi.mocked(messagesApi.getThreads).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMessages(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct query key with requestId filter', async () => {
      vi.mocked(messagesApi.getThreads).mockResolvedValue([]);

      const requestId = 'request-123';
      renderHook(() => useMessages(requestId), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['messages', 'list', { requestId }])).toBeDefined());
    });

    it('should call API without params when no request ID provided', async () => {
      vi.mocked(messagesApi.getThreads).mockResolvedValue([]);

      renderHook(() => useMessages(), { wrapper });

      await waitFor(() => expect(messagesApi.getThreads).toHaveBeenCalledWith({ requestId: undefined }));
    });
  });

  describe('useMessageById', () => {
    it('should fetch single message by ID successfully', async () => {
      const mockData = { id: '123', content: 'Test message', createdAt: new Date().toISOString() };
      vi.mocked(messagesApi.get).mockResolvedValue(mockData);

      const { result } = renderHook(() => useMessageById('123'), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(messagesApi.get).toHaveBeenCalledWith('123');
    });

    it('should handle fetch error', async () => {
      vi.mocked(messagesApi.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useMessageById('999'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Not found');
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when id is empty', async () => {
      const { result } = renderHook(() => useMessageById(''), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.fetchStatus).toBe('idle');
      expect(messagesApi.get).not.toHaveBeenCalled();
    });

    it('should use correct query key', async () => {
      vi.mocked(messagesApi.get).mockResolvedValue({ id: '456' });

      renderHook(() => useMessageById('456'), { wrapper });

      await waitFor(() => expect(queryClient.getQueryData(['messages', 'detail', '456'])).toBeDefined());
    });
  });
});
