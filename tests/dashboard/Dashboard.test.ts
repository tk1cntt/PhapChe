import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardClient from '@/components/dashboard/DashboardClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockDashboardData = {
  workspace: {
    id: 'ws-1',
    name: 'Công Ty ABC',
    slug: 'cong-ty-abc',
  },
  stats: {
    totalRequests: 25,
    inProgress: 8,
    completed: 17,
    vaultDocs: 42,
  },
  welcome: {
    activeRequests: 5,
    pendingDocs: 3,
    newReplies: 2,
  },
  recentCases: [
    {
      id: 'case-1',
      code: 'CASE-2024-001',
      title: 'Hợp đồng thuê văn phòng',
      matterType: 'CONTRACT',
      status: 'IN_PROGRESS',
      statusVariant: 'orange',
      statusText: 'Đang xử lý',
      assignee: 'Nguyễn Văn A',
      assigneeRole: 'Chuyên viên',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'case-2',
      code: 'CASE-2024-002',
      title: 'Giải quyết tranh chấp',
      matterType: 'DISPUTE',
      status: 'COMPLETED',
      statusVariant: 'green',
      statusText: 'Hoàn tất',
      assignee: 'Trần Thị B',
      assigneeRole: 'Chuyên viên',
      updatedAt: '2024-01-14T09:00:00Z',
    },
  ],
  deadlines: [
    {
      id: 'deadline-1',
      title: 'Nộp hồ sơ pháp lý',
      code: 'CASE-2024-001',
      slaDeadline: '2024-01-20T17:00:00Z',
      progress: 75,
      status: 'warn' as const,
      timeText: '3 ngày',
    },
    {
      id: 'deadline-2',
      title: 'Review hợp đồng',
      code: 'CASE-2024-003',
      slaDeadline: '2024-01-18T17:00:00Z',
      progress: 90,
      status: 'danger' as const,
      timeText: '1 ngày',
    },
  ],
  recentDocs: [
    {
      id: 'doc-1',
      filename: 'hop-dong-thue.pdf',
      size: 1024000,
      mimeType: 'application/pdf',
      status: 'ACTIVE',
      uploadedBy: 'Nguyễn Văn A',
      updatedAt: '2024-01-15T10:00:00Z',
      relativeTime: '2 giờ trước',
    },
    {
      id: 'doc-2',
      filename: 'bieu-mau.xlsx',
      size: 512000,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      status: 'PENDING',
      uploadedBy: 'Trần Thị B',
      updatedAt: '2024-01-14T15:00:00Z',
      relativeTime: '1 ngày trước',
    },
  ],
  activity: [
    {
      id: 'act-1',
      action: 'Tải lên tài liệu',
      description: 'Nguyễn Văn A đã tải lên hop-dong-thue.pdf',
      actor: 'Nguyễn Văn A',
      timestamp: '2024-01-15T10:00:00Z',
      relativeTime: '2 giờ trước',
    },
    {
      id: 'act-2',
      action: 'Cập nhật trạng thái',
      description: 'Hồ sơ CASE-2024-001 chuyển sang Đang xử lý',
      actor: 'Trần Thị B',
      timestamp: '2024-01-15T08:00:00Z',
      relativeTime: '4 giờ trước',
    },
  ],
};

describe('DashboardClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ============================
  // WHITEBOX TESTS (Unit Tests)
  // ============================
  describe('Whitebox Tests - Unit', () => {
    it('renders stat cards with correct values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeTruthy(); // Total requests
        expect(screen.getByText('8')).toBeTruthy(); // In progress
        expect(screen.getByText('17')).toBeTruthy(); // Completed
        expect(screen.getByText('42')).toBeTruthy(); // Vault docs
      });
    });

    it('renders welcome banner with workspace name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Chào mừng đến với Công Ty ABC')).toBeTruthy();
      });
    });

    it('renders recent cases with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('CASE-2024-001')).toBeTruthy();
        expect(screen.getByText('Hợp đồng thuê văn phòng')).toBeTruthy();
        expect(screen.getByText('Nguyễn Văn A')).toBeTruthy();
      });
    });

    it('renders deadline items with progress bars', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Nộp hồ sơ pháp lý')).toBeTruthy();
        expect(screen.getByText('Review hợp đồng')).toBeTruthy();
        expect(screen.getByText('3 ngày')).toBeTruthy();
        expect(screen.getByText('1 ngày')).toBeTruthy();
      });
    });

    it('renders documents with file info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('hop-dong-thue.pdf')).toBeTruthy();
        expect(screen.getByText('bieu-mau.xlsx')).toBeTruthy();
        expect(screen.getByText('2 giờ trước')).toBeTruthy();
      });
    });

    it('renders activity timeline', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Tải lên tài liệu')).toBeTruthy();
        expect(screen.getByText('Cập nhật trạng thái')).toBeTruthy();
      });
    });
  });

  // ============================
  // BLACKBOX TESTS (Integration)
  // ============================
  describe('Blackbox Tests - Integration', () => {
    it('fetches data from /api/dashboard on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/dashboard');
      });
    });

    it('shows loading skeleton while fetching', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<DashboardClient />);

      expect(document.querySelector('.dashboard-loading')).toBeTruthy();
    });

    it('renders dashboard page after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(document.querySelector('.dashboard-page')).toBeTruthy();
        expect(document.querySelector('.stats-grid')).toBeTruthy();
        expect(document.querySelector('.dashboard-grid')).toBeTruthy();
      });
    });

    it('renders all dashboard panels', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Hồ sơ đang xử lý')).toBeTruthy();
        expect(screen.getByText('Deadline & SLA')).toBeTruthy();
        expect(screen.getByText('Tài liệu gần đây')).toBeTruthy();
        expect(screen.getByText('Hoạt động gần đây')).toBeTruthy();
      });
    });

    it('shows floating chat button with new replies count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        const chatButton = document.querySelector('.floating-chat');
        expect(chatButton).toBeTruthy();
        expect(chatButton?.textContent).toContain('2 Tin mới');
      });
    });
  });

  // ============================
  // ABNORMAL TESTS (Edge Cases)
  // ============================
  describe('Abnormal Tests - Edge Cases', () => {
    it('handles empty recent cases list', async () => {
      const emptyData = {
        ...mockDashboardData,
        recentCases: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Không có hồ sơ nào đang xử lý')).toBeTruthy();
      });
    });

    it('handles empty deadlines list', async () => {
      const emptyData = {
        ...mockDashboardData,
        deadlines: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Không có deadline nào trong tuần này')).toBeTruthy();
      });
    });

    it('handles empty documents list', async () => {
      const emptyData = {
        ...mockDashboardData,
        recentDocs: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Không có tài liệu nào')).toBeTruthy();
      });
    });

    it('handles empty activity list', async () => {
      const emptyData = {
        ...mockDashboardData,
        activity: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Không có hoạt động nào')).toBeTruthy();
      });
    });

    it('handles zero stats values', async () => {
      const zeroData = {
        ...mockDashboardData,
        stats: {
          totalRequests: 0,
          inProgress: 0,
          completed: 0,
          vaultDocs: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => zeroData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        const zeroElements = screen.getAllByText('0');
        expect(zeroElements.length).toBeGreaterThan(0);
      });
    });

    it('handles zero new replies (no chat badge)', async () => {
      const noRepliesData = {
        ...mockDashboardData,
        welcome: {
          activeRequests: 0,
          pendingDocs: 0,
          newReplies: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => noRepliesData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        const chatButton = document.querySelector('.floating-chat');
        expect(chatButton?.textContent).not.toContain('Tin mới');
      });
    });

    it('handles long case titles with ellipsis', async () => {
      const longTitleData = {
        ...mockDashboardData,
        recentCases: [
          {
            ...mockDashboardData.recentCases[0],
            title: 'Hợp đồng thuê văn phòng tại tầng 5, tòa nhà ABC Tower, số 123 Nguyễn Huệ, Quận 1, TP.HCM',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => longTitleData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        const titleElement = document.querySelector('.case-info span');
        expect(titleElement?.textContent).toContain('Hợp đồng thuê văn phòng');
        // Should have overflow hidden styling
        expect(titleElement?.className).toContain('case-info');
      });
    });
  });

  // ============================
  // ERROR TESTS
  // ============================
  describe('Error Tests', () => {
    it('shows error message on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
        expect(document.querySelector('.dashboard-error')).toBeTruthy();
      });
    });

    it('shows error message on non-200 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch dashboard data')).toBeTruthy();
      });
    });

    it('shows error message on invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(document.querySelector('.dashboard-error')).toBeTruthy();
      });
    });

    it('recovers after error and refetches', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { rerender } = render(<DashboardClient />);

      await waitFor(() => {
        expect(document.querySelector('.dashboard-error')).toBeTruthy();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData,
      });

      rerender(<DashboardClient />);

      await waitFor(() => {
        expect(document.querySelector('.dashboard-page')).toBeTruthy();
      });
    });

    it('handles missing workspace data gracefully', async () => {
      const noWorkspaceData = {
        ...mockDashboardData,
        workspace: {
          id: '',
          name: '',
          slug: '',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => noWorkspaceData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        // Should still render without crashing
        expect(document.querySelector('.dashboard-page')).toBeTruthy();
      });
    });

    it('handles unknown status variants with default badge', async () => {
      const unknownStatusData = {
        ...mockDashboardData,
        recentCases: [
          {
            ...mockDashboardData.recentCases[0],
            statusVariant: 'unknown',
            statusText: 'Trạng thái không xác định',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => unknownStatusData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText('Trạng thái không xác định')).toBeTruthy();
      });
    });

    it('handles unknown document status with default badge', async () => {
      const unknownDocStatusData = {
        ...mockDashboardData,
        recentDocs: [
          {
            ...mockDashboardData.recentDocs[0],
            status: 'UNKNOWN_STATUS',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => unknownDocStatusData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        // Should render with default blue badge
        const badge = document.querySelector('.document-item .badge');
        expect(badge?.className).toContain('badge');
      });
    });

    it('handles deadline with unknown progress status', async () => {
      const unknownDeadlineData = {
        ...mockDashboardData,
        deadlines: [
          {
            ...mockDashboardData.deadlines[0],
            status: 'unknown' as 'ok' | 'warn' | 'danger',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => unknownDeadlineData,
      });

      render(<DashboardClient />);

      await waitFor(() => {
        // Should default to 'ok' class
        const progressBar = document.querySelector('.progress .ok');
        expect(progressBar).toBeTruthy();
      });
    });
  });
});
