import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkspaceContext, WorkspaceProvider } from './useWorkspaceContext';
import { workspacesApi } from '@/lib/api';
import { ReactNode } from 'react';

// Mock API
vi.mock('@/lib/api', () => ({
  workspacesApi: {
    get: vi.fn(),
  },
}));

// Mock query keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    workspaces: {
      detail: (id: string) => ['workspaces', 'detail', id],
    },
  },
}));

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', name: 'Test', role: 'customer' },
    isLoading: false,
    isAuthenticated: true,
  })),
}));

describe('useWorkspaceContext', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  function wrapper({ children, activeWorkspaceId }: { children: ReactNode; activeWorkspaceId?: string | null }) {
    return (
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider activeWorkspaceId={activeWorkspaceId}>
          {children}
        </WorkspaceProvider>
      </QueryClientProvider>
    );
  }

  describe('when workspace is loaded', () => {
    it('should return workspace data on successful fetch', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Phòng Pháp lý ABC',
        slug: 'phap-ly-abc',
        organizationId: 'org-1',
        isActive: true,
      };

      vi.mocked(workspacesApi.get).mockResolvedValue(mockWorkspace);

      const { result } = renderHook(() => useWorkspaceContext(), {
        wrapper: ({ children }) => wrapper({ children, activeWorkspaceId: 'ws-1' }),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.workspace).toEqual(mockWorkspace);
      expect(result.current.error).toBeNull();
      expect(workspacesApi.get).toHaveBeenCalledWith('ws-1');
    });
  });

  describe('when no active workspace', () => {
    it('should return null workspace when activeWorkspaceId is null', async () => {
      const { result } = renderHook(() => useWorkspaceContext(), {
        wrapper: ({ children }) => wrapper({ children, activeWorkspaceId: null }),
      });

      // Query should be disabled, so isLoading is false, workspace is null
      expect(result.current.workspace).toBeNull();
      expect(workspacesApi.get).not.toHaveBeenCalled();
    });

    it('should return null workspace when activeWorkspaceId is undefined', async () => {
      const { result } = renderHook(() => useWorkspaceContext(), {
        wrapper: ({ children }) => wrapper({ children }),
      });

      expect(result.current.workspace).toBeNull();
      expect(workspacesApi.get).not.toHaveBeenCalled();
    });
  });

  describe('when fetch fails', () => {
    it('should return error state on fetch failure', async () => {
      vi.mocked(workspacesApi.get).mockRejectedValue(new Error('Không tìm thấy workspace'));

      const { result } = renderHook(() => useWorkspaceContext(), {
        wrapper: ({ children }) => wrapper({ children, activeWorkspaceId: 'invalid-id' }),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.workspace).toBeNull();
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Không tìm thấy workspace');
    });
  });

  describe('default value without provider', () => {
    it('should return null workspace when not wrapped in WorkspaceProvider', () => {
      const { result } = renderHook(() => useWorkspaceContext());

      expect(result.current.workspace).toBeNull();
      expect(result.current.organization).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
