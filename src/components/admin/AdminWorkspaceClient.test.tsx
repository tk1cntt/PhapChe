import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import AdminWorkspaceClient from './AdminWorkspaceClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminWorkspaceClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== WHITEBOX TESTS ====================
  describe('Whitebox: Component renders correctly', () => {
    it('renders page header with correct title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workspace khách hàng');
      });
    });

    it('renders create workspace buttons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /tạo workspace/i });
        expect(buttons).toHaveLength(2); // Header + footer
      });
    });

    it('renders permission card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Ranh giới quyền truy cập')).toBeInTheDocument();
      });
    });

    it('renders table headers correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tên workspace')).toBeInTheDocument();
        expect(screen.getByText('Slug')).toBeInTheDocument();
        expect(screen.getByText('Thành viên')).toBeInTheDocument();
        expect(screen.getByText('Trạng thái')).toBeInTheDocument();
      });
    });
  });

  // ==================== BLACKBOX TESTS ====================
  describe('Blackbox: API integration', () => {
    it('fetches data from /api/workspaces on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/workspaces', expect.any(Object));
      });
    });

    it('displays workspaces from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [
            {
              id: '1',
              name: 'Công ty An Phát',
              slug: 'an-phat',
              isActive: true,
              memberCount: 3,
              createdAt: '2024-06-13T00:00:00.000Z',
            },
          ],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Công ty An Phát')).toBeInTheDocument();
        expect(screen.getByText('an-phat')).toBeInTheDocument();
        expect(screen.getByText('3 thành viên')).toBeInTheDocument();
      });
    });

    it('displays active status badge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [
            {
              id: '1',
              name: 'Test Workspace',
              slug: 'test',
              isActive: true,
              memberCount: 5,
              createdAt: '2024-06-13T00:00:00.000Z',
            },
          ],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();
      });
    });

    it('displays inactive status badge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [
            {
              id: '1',
              name: 'Inactive Workspace',
              slug: 'inactive',
              isActive: false,
              memberCount: 2,
              createdAt: '2024-06-13T00:00:00.000Z',
            },
          ],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Không hoạt động')).toBeInTheDocument();
      });
    });
  });

  // ==================== ABNORMAL TESTS ====================
  describe('Abnormal: Edge cases', () => {
    it('handles empty API response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText('Chưa có workspace nào.')).toBeInTheDocument();
      });
    });

    it('handles missing fields gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [
            {
              id: '1',
              name: null,
              slug: null,
              isActive: null,
              memberCount: null,
              createdAt: null,
            },
          ],
        }),
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        // Should render without crashing
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });

  // ==================== ERROR TESTS ====================
  describe('Error: Error handling', () => {
    it('displays error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(screen.getByText(/không thể tải dữ liệu workspaces/i)).toBeInTheDocument();
      });
    });

    it('redirects to sign-in on 401 response', async () => {
      const pushMock = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: pushMock,
        }),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/sign-in');
      });
    });

    it('shows retry button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await act(async () => {
        render(<AdminWorkspaceClient />);
      });

      await waitFor(() => {
        const retryBtn = screen.getByRole('button', { name: /thử lại/i });
        expect(retryBtn).toBeInTheDocument();
      });
    });
  });
});
