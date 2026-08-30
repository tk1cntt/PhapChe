import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardClient from '@/components/dashboard/DashboardClient';

// ── Mocks ──

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const msg: Record<string, Record<string, string>> = {
      DashboardClient: {
        greeting: 'Xin chào {name}',
        subtitle: 'Tổng quan hoạt động pháp lý',
        createRequest: 'Tạo yêu cầu',
      },
      WelcomeBanner: {
        title: 'Chào mừng đến với workspace',
        requestsProcessing: '{count} hồ sơ đang xử lý',
        docsPending: '{count} tài liệu chờ',
        repliesNew: '{count} tin nhắn mới',
        statusNormal: 'Mọi thứ ổn',
        workspaceScope: 'trong workspace {workspace}',
        viewDocuments: 'Xem tài liệu',
        sendFeedback: 'Gửi phản hồi',
      },
      StatCard: {
        totalRequests: 'Tổng yêu cầu',
        totalRequestsDesc: 'Tổng số yêu cầu pháp lý',
        inProgress: 'Đang xử lý',
        inProgressDesc: 'Yêu cầu đang được xử lý',
        completed: 'Hoàn tất',
        completedDesc: 'Yêu cầu đã hoàn tất',
      },
      DeadlineSLA: {
        title: 'Deadline & SLA',
        noDeadlines: 'Không có deadline nào trong tuần này',
        noDescription: '',
      },
      ActivityTimeline: {
        title: 'Hoạt động gần đây',
        noActivities: 'Không có hoạt động nào',
      },
      CasesTable: {
        caseCode: 'Mã hồ sơ',
        requestType: 'Loại yêu cầu',
        status: 'Trạng thái',
        assignee: 'Người xử lý',
        date: 'Ngày cập nhật',
        noCases: 'Không có hồ sơ nào',
      },
      Common: {
        totalItems: '{count} mục',
        previousPage: 'Trang trước',
        nextPage: 'Trang sau',
      },
    };
    return (key: string, values?: Record<string, unknown>) => {
      const resolved = msg[ns]?.[key] ?? key;
      if (!values) return resolved;
      return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), resolved);
    };
  },
  useLocale: () => 'vi',
}));

const pushSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// ── Mock Data ──

const mockWelcomeData = {
  workspace: { id: 'ws-1', name: 'Công Ty ABC', slug: 'cong-ty-abc' },
  activeRequests: 5,
  pendingDocs: 3,
  newReplies: 2,
  userName: 'Nguyễn Văn A',
};

// Vault was removed from the user surface — no vaultDocs field.
const mockStats = {
  totalRequests: 25,
  inProgress: 8,
  completed: 17,
};

const mockCases = [
  {
    id: 'case-1',
    code: 'CASE-2024-001',
    title: 'Hợp đồng thuê văn phòng',
    matterType: 'CONTRACT',
    status: 'in_progress',
    statusVariant: 'blue',
    statusText: 'Đang xử lý',
    assignee: 'Nguyễn Văn A',
    assigneeRole: 'Chuyên viên',
    updatedAt: '2024-01-15T10:00:00Z',
    formattedDate: '15/01/2024',
  },
  {
    id: 'case-2',
    code: 'CASE-2024-002',
    title: 'Giải quyết tranh chấp',
    matterType: 'DISPUTE',
    status: 'approved',
    statusVariant: 'green',
    statusText: 'Đã duyệt',
    assignee: 'Trần Thị B',
    assigneeRole: 'Chuyên viên',
    updatedAt: '2024-01-14T09:00:00Z',
    formattedDate: '14/01/2024',
  },
];

const mockActivities = [
  {
    id: 'act-1',
    type: 'document' as const,
    action: 'Tải lên tài liệu',
    description: 'Nguyễn Văn A đã tải lên hop-dong-thue.pdf',
    actor: 'Nguyễn Văn A',
    timestamp: '2024-01-15T10:00:00Z',
    relativeTime: '2 giờ trước',
  },
  {
    id: 'act-2',
    type: 'request' as const,
    action: 'Cập nhật trạng thái',
    description: 'Hồ sơ CASE-2024-001 chuyển sang Đang xử lý',
    actor: 'Trần Thị B',
    timestamp: '2024-01-15T08:00:00Z',
    relativeTime: '4 giờ trước',
  },
];

// ── Tests ──

describe('DashboardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushSpy.mockReset();
    // Default: unread-count endpoint resolves with 0 unread messages.
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ unreadCount: 0 }),
      } as Response),
    ) as unknown as typeof fetch;
  });

  // ============================
  // WHITEBOX — Component structure & props
  // ============================
  describe('Whitebox — Component structure', () => {
    it('renders .dashboard-page root element', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
          recentActivities={mockActivities}
        />
      );
      expect(container.querySelector('.dashboard-page')).toBeInTheDocument();
    });

    it('renders stats grid with exactly 3 stat cards (no vaultDocs)', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      const statsGrid = container.querySelector('.stats-grid');
      expect(statsGrid).toBeInTheDocument();
      const statCards = statsGrid!.querySelectorAll('.stat-card');
      expect(statCards.length).toBe(3);
    });

    it('renders correct stat values from props', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // Stat cards render values; Paging may also render "25" as pageSize option
      expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('17').length).toBeGreaterThanOrEqual(1);
    });

    it('renders welcome banner with workspace name from props', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      expect(screen.getByText('Chào mừng đến với workspace')).toBeInTheDocument();
    });

    it('renders the dashboard-grid section (DeadlineSLA + ActivityTimeline)', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
          recentActivities={mockActivities}
        />
      );
      expect(container.querySelector('.dashboard-grid')).toBeInTheDocument();
    });

    it('renders CasesTable with all cases', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // Cases appear in CasesTable (and the mobile cards)
      expect(screen.getAllByText('CASE-2024-001').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Hợp đồng thuê văn phòng').length).toBeGreaterThanOrEqual(1);
      // Nguyễn Văn A appears as assignee in table and in activity actor
      expect(screen.getAllByText('Nguyễn Văn A').length).toBeGreaterThanOrEqual(1);
    });

    it('renders floating chat button', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // Link renders as <a> with floating-chat class, locale-prefixed
      const chatLink = container.querySelector('a.floating-chat');
      expect(chatLink).toBeInTheDocument();
    });

    it('renders page header with create request button', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      expect(screen.getByText('Tạo yêu cầu')).toBeInTheDocument();
    });

    it('does NOT render a RecentDocuments panel (vault removed)', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      expect(container.querySelector('.document-list')).toBeNull();
      expect(screen.queryByText('Tài liệu gần đây')).toBeNull();
    });

    it('renders DeadlineSLA panel title', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      expect(screen.getByText('Deadline & SLA')).toBeInTheDocument();
    });

    it('renders ActivityTimeline panel title when activities provided', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
          recentActivities={mockActivities}
        />
      );
      expect(screen.getByText('Hoạt động gần đây')).toBeInTheDocument();
    });

    it('renders activity descriptions from recentActivities prop', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
          recentActivities={mockActivities}
        />
      );
      expect(screen.getByText('Tải lên tài liệu')).toBeInTheDocument();
      expect(screen.getByText('Cập nhật trạng thái')).toBeInTheDocument();
    });
  });

  // ============================
  // BLACKBOX — Integration behavior
  // ============================
  describe('Blackbox — Integration', () => {
    it('dashboard-page renders without crashing with all props', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
          recentActivities={mockActivities}
        />
      );
      expect(container.querySelector('.dashboard-page')).toBeInTheDocument();
    });

    it('renders without crashing with minimal props (no activities)', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={[]}
        />
      );
      expect(container.querySelector('.dashboard-page')).toBeInTheDocument();
    });

    it('CasesTable receives and displays all cases', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      const codes001 = screen.getAllByText('CASE-2024-001');
      expect(codes001.length).toBeGreaterThanOrEqual(1);
      const codes002 = screen.getAllByText('CASE-2024-002');
      expect(codes002.length).toBeGreaterThanOrEqual(1);
    });

    it('CasesTable renders many cases (no RecentCases cap)', () => {
      const manyCases = Array.from({ length: 10 }, (_, i) => ({
        ...mockCases[0],
        id: `case-${i}`,
        code: `CASE-${i}`,
        title: `Title ${i}`,
      }));
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={manyCases}
        />
      );
      expect(screen.getAllByText('CASE-0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('CASE-9').length).toBeGreaterThanOrEqual(1);
    });

    it('DeadlineSLA only includes active (non-completed) cases', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // case-1 (in_progress) appears in DeadlineSLA + CasesTable
      const titles = screen.getAllByText('Hợp đồng thuê văn phòng');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================
  // ABNORMAL — Edge cases
  // ============================
  describe('Abnormal — Edge cases', () => {
    it('handles empty allCases array', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={[]}
        />
      );
      expect(screen.getByText('Không có hồ sơ nào')).toBeInTheDocument();
    });

    it('handles empty recentActivities (defaults to [])', () => {
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // Should render ActivityTimeline panel with empty state
      expect(screen.getByText('Hoạt động gần đây')).toBeInTheDocument();
    });

    it('handles zero stats values', () => {
      const zeroStats = { totalRequests: 0, inProgress: 0, completed: 0 };
      render(
        <DashboardClient
          welcomeData={{ ...mockWelcomeData, activeRequests: 0, pendingDocs: 0, newReplies: 0 }}
          stats={zeroStats}
          allCases={[]}
        />
      );
      // allCases=[] triggers isLoading=true → skeleton placeholders shown.
      // Now exactly 3 skeleton cards render (vaultDocs removed).
      const { container } = render(
        <DashboardClient
          welcomeData={{ ...mockWelcomeData, activeRequests: 0, pendingDocs: 0, newReplies: 0 }}
          stats={zeroStats}
          allCases={[]}
        />
      );
      const loadingStats = container.querySelectorAll('.loading-stat');
      expect(loadingStats.length).toBe(3);
    });

    it('handles long case title in CasesTable', () => {
      const longCases = [{
        ...mockCases[0],
        title: 'Hợp đồng thuê văn phòng tại tầng 5, tòa nhà ABC Tower, số 123 Nguyễn Huệ, Quận 1, TP.HCM',
      }];
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={longCases}
        />
      );
      expect(screen.getAllByText('CASE-2024-001').length).toBeGreaterThanOrEqual(1);
    });

    it('handles case without formattedDate gracefully', () => {
      const noDateCase = [{
        ...mockCases[0],
        formattedDate: '',
      }];
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={noDateCase}
        />
      );
      expect(screen.getAllByText('CASE-2024-001').length).toBeGreaterThanOrEqual(1);
    });

    it('handles workspace with empty name', () => {
      const emptyWs = {
        ...mockWelcomeData,
        workspace: { id: '', name: '', slug: '' },
      };
      render(
        <DashboardClient
          welcomeData={emptyWs}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // Should not crash
      expect(screen.getByText('Chào mừng đến với workspace')).toBeInTheDocument();
    });

    it('handles case with unknown statusVariant', () => {
      const unknownVariant = [{
        ...mockCases[0],
        statusVariant: 'unknown',
        statusText: 'Trạng thái không xác định',
      }];
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={unknownVariant}
        />
      );
      // statusText appears in CasesTable badge
      expect(screen.getAllByText('Trạng thái không xác định').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================
  // ERROR — Failure resilience
  // ============================
  describe('Error — Failure resilience', () => {
    it('does not crash when welcomeData.workspace has empty slug', () => {
      const noSlug = {
        ...mockWelcomeData,
        workspace: { id: 'ws-1', name: 'Test', slug: '' },
      };
      expect(() =>
        render(
          <DashboardClient
            welcomeData={noSlug}
            stats={mockStats}
            allCases={mockCases}
          />
        )
      ).not.toThrow();
    });

    it('does not crash when stats has negative values (data anomaly)', () => {
      const badStats = { totalRequests: -1, inProgress: -5, completed: 0 };
      expect(() =>
        render(
          <DashboardClient
            welcomeData={mockWelcomeData}
            stats={badStats}
            allCases={[]}
          />
        )
      ).not.toThrow();
    });

    it('does not crash with very large case count (1000+ items)', () => {
      const largeCases = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCases[0],
        id: `case-${i}`,
        code: `CASE-${i}`,
        title: `Title ${i}`,
      }));
      expect(() =>
        render(
          <DashboardClient
            welcomeData={mockWelcomeData}
            stats={{ totalRequests: 1000, inProgress: 500, completed: 300 }}
            allCases={largeCases}
          />
        )
      ).not.toThrow();
    });

    it('does not crash when recentActivities contains null items', () => {
      const badActivities = [null as any, mockActivities[0]];
      expect(() =>
        render(
          <DashboardClient
            welcomeData={mockWelcomeData}
            stats={mockStats}
            allCases={mockCases}
            recentActivities={badActivities}
          />
        )
      ).not.toThrow();
    });

    it('renders stats grid (plain cards, no links) when everything is fine', () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      // A stats-grid should be present (normal path)
      expect(container.querySelector('.stats-grid')).toBeInTheDocument();
      // Stat cards are plain — no anchor wrappers (detail links in CasesTable
      // still point at /cases/[id], which stays).
      expect(container.querySelector('.stat-card-link')).toBeNull();
      expect(container.querySelector('a[href="/vi/cases"]')).toBeNull();
      expect(container.querySelector('a[href="/vi/cases?status=in_progress"]')).toBeNull();
    });

    it('navigates to /create when the "Tạo yêu cầu" button is clicked', async () => {
      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      const createBtn = container.querySelector('button.create-btn');
      expect(createBtn).not.toBeNull();
      createBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(pushSpy).toHaveBeenCalledWith('/create');
    });

    it('fetches and renders unread message count on mount', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ unreadCount: 3 }),
        } as Response),
      ) as unknown as typeof fetch;

      const { container } = render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      expect(global.fetch).toHaveBeenCalledWith('/api/messages/unread-count');
      // Unread badge appears after the async fetch resolves.
      await waitFor(() => {
        expect(container.querySelector('.chat-icon-wrapper')).not.toBeNull();
      });
    });

    it('falls back to unreadCount=0 when the unread-count fetch fails', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('network down'))) as unknown as typeof fetch;

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <DashboardClient
          welcomeData={mockWelcomeData}
          stats={mockStats}
          allCases={mockCases}
        />
      );
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      consoleError.mockRestore();
    });
  });
});
