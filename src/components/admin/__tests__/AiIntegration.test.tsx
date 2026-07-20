/**
 * Phase 101 Tests — AI Workflow Integration
 *
 * Covers: AiStatusBadge, AiContext, SpecialistWorkbench AI button, ReviewConsole AI button,
 *         AiAssistantPanel in integration context, /api/ai/init route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({}),
}));

// Mock next-intl with stable translation references (avoid useCallback infinite re-render)
vi.mock('next-intl', () => {
  const specialistMap: Record<string, string> = {
    statAssigned: 'Đã phân công',
    statInProgress: 'Đang xử lý',
    statPendingReview: 'Chờ kiểm tra',
    statRevision: 'Cần sửa',
    searchPlaceholder: 'Tìm kiếm...',
    filterAll: 'Tất cả',
    loading: 'Đang tải...',
    retry: 'Thử lại',
    emptyTitle: 'Trống',
    emptyDesc: 'Không có dữ liệu',
    colCode: 'Mã',
    colTitle: 'Tiêu đề',
    colCustomer: 'KH',
    colWorkspace: 'WS',
    colType: 'Loại',
    colPriority: 'Ưu tiên',
    colStatus: 'Trạng thái',
    colAction: 'Thao tác',
    btnStartWork: 'Bắt đầu',
    btnSubmitReview: 'Gửi KT',
    btnResubmit: 'Gửi lại',
    btnAiAssist: 'AI',
    reviewerLabel: 'Reviewer',
    errorUnknown: 'Lỗi',
    errorForbidden: 'Cấm',
    statusJustUpdated: 'Đã cập nhật',
    prev: 'Trước',
    next: 'Sau',
  };

  const reviewMap: Record<string, string> = {
    statPending: 'Chờ KT',
    statApproved: 'Đã duyệt',
    statRevision: 'Cần sửa',
    searchPlaceholder: 'Tìm kiếm...',
    loading: 'Đang tải...',
    retry: 'Thử lại',
    emptyTitle: 'Trống',
    emptyDesc: 'Không có dữ liệu',
    colCode: 'Mã',
    colTitle: 'Tiêu đề',
    colCustomer: 'KH',
    colWorkspace: 'WS',
    colType: 'Loại',
    colPriority: 'Ưu tiên',
    colSpecialist: 'Chuyên viên',
    colStatus: 'Trạng thái',
    colAction: 'Thao tác',
    btnApprove: 'Duyệt',
    btnRevise: 'YCS',
    btnAiAssist: 'AI',
    specialistLabel: 'CV',
    errorUnknown: 'Lỗi',
    errorForbidden: 'Cấm',
    prev: 'Trước',
    next: 'Sau',
  };

  const tSpecialist = vi.fn((key: string) => specialistMap[key] ?? key);
  const tReviewer = vi.fn((key: string) => reviewMap[key] ?? key);
  const tGeneric = vi.fn((key: string) => key);

  return {
    useTranslations: (namespace?: string) => {
      if (namespace === 'SpecialistWorkbench') return tSpecialist;
      if (namespace === 'ReviewConsole') return tReviewer;
      return tGeneric;
    },
  };
});

vi.mock('@/components/ui/Paging', () => ({
  default: ({ current, pageSize, total, onChange }: any) => (
    <div data-testid="paging">
      Page {current} of {Math.ceil(total / pageSize)}
    </div>
  ),
}));

// ── AiContext Tests ───────────────────────────────────────────

import { AiProvider, useAiContext } from '@/lib/ai/AiContext';

describe('AiContext', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Whitebox', () => {
    it('should initialize on mount and call /api/ai/init', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { indexed: 3, totalChunks: 45, sources: ['Luật DN 2020', 'BLLĐ 2019', 'BLDS 2015'], llmReady: false },
        }),
      });

      function TestConsumer() {
        const ctx = useAiContext();
        return <div data-testid="ctx">{JSON.stringify({ ready: ctx.isReady, docs: ctx.docsIndexed })}</div>;
      }

      render(
        <AiProvider>
          <TestConsumer />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/init');
      });

      await waitFor(() => {
        const el = screen.getByTestId('ctx');
        expect(el.textContent).toContain('"ready":true');
        expect(el.textContent).toContain('"docs":3');
      });
    });

    it('should set isInitializing=true during fetch', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { indexed: 0, totalChunks: 0, sources: [] } }),
        }), 100)),
      );

      function TestConsumer() {
        const ctx = useAiContext();
        return <div data-testid="ctx">{String(ctx.isInitializing)}</div>;
      }

      render(
        <AiProvider>
          <TestConsumer />
        </AiProvider>,
      );

      // Should show initializing initially
      expect(screen.getByTestId('ctx').textContent).toBe('true');
    });

    it('should handle fetch error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network down'));

      function TestConsumer() {
        const ctx = useAiContext();
        return <div data-testid="ctx">{ctx.initError ?? 'none'}</div>;
      }

      render(
        <AiProvider>
          <TestConsumer />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ctx').textContent).toContain('Network down');
      });
    });

    it('should handle API error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
      });

      function TestConsumer() {
        const ctx = useAiContext();
        return <div data-testid="ctx">{ctx.initError ?? 'none'}</div>;
      }

      render(
        <AiProvider>
          <TestConsumer />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ctx').textContent).not.toBe('none');
      });
    });

    it('should handle failed init response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          detail: 'Vector store thất bại',
        }),
      });

      function TestConsumer() {
        const ctx = useAiContext();
        return <div data-testid="ctx">{ctx.initError ?? 'none'}</div>;
      }

      render(
        <AiProvider>
          <TestConsumer />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ctx').textContent).toContain('Vector store thất bại');
      });
    });

    it('should retry on retryInit call', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Fail'));

      function TestConsumer() {
        const ctx = useAiContext();
        return (
          <div>
            <span data-testid="err">{ctx.initError ?? 'none'}</span>
            <button data-testid="retry" onClick={ctx.retryInit}>Retry</button>
          </div>
        );
      }

      render(
        <AiProvider>
          <TestConsumer />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('err').textContent).toContain('Fail');
      });

      // Reset fetch for retry
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { indexed: 2, totalChunks: 30, sources: [] } }),
      });

      fireEvent.click(screen.getByTestId('retry'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});

// ── AiStatusBadge Tests ──────────────────────────────────────

import { AiStatusBadge } from '@/components/admin/AiStatusBadge';

describe('AiStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Whitebox', () => {
    it('should show initializing state while AiContext is loading', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}), // never resolves during test
      );

      render(
        <AiProvider>
          <AiStatusBadge />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-status-initializing')).toBeTruthy();
      });
    });

    it('should show ready state after successful init', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { indexed: 3, totalChunks: 45, sources: [] },
        }),
      });

      render(
        <AiProvider>
          <AiStatusBadge />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-status-ready')).toBeTruthy();
      });
    });

    it('should show error state with retry button', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('init failed'));

      render(
        <AiProvider>
          <AiStatusBadge />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-status-error')).toBeTruthy();
      });
    });

    it('should show idle state when no init attempted', () => {
      // Only show idle if AiContext is used outside AiProvider (edge case)
      // We test directly: render without provider should still work gracefully
      // Since AiContext defaults have isInitializing:false, isReady:false, no error
      render(<AiStatusBadge />);
      // Should render something — idle state
      const el = document.querySelector('[data-testid="ai-status-idle"]');
      expect(el).toBeTruthy();
    });
  });

  describe('Blackbox', () => {
    it('should retry init when error badge is clicked', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      render(
        <AiProvider>
          <AiStatusBadge />
        </AiProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-status-error')).toBeTruthy();
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { indexed: 1, totalChunks: 10, sources: [] } }),
      });

      fireEvent.click(screen.getByTestId('ai-status-error'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-status-ready')).toBeTruthy();
      });
    });

    it('should show docs count in tooltip', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { indexed: 3, totalChunks: 45, sources: ['A', 'B', 'C'] },
        }),
      });

      render(
        <AiProvider>
          <AiStatusBadge />
        </AiProvider>,
      );

      await waitFor(() => {
        const badge = screen.getByTestId('ai-status-ready');
        expect(badge.getAttribute('title')).toContain('3 tài liệu');
      });
    });
  });
});

// ── SpecialistWorkbench AI Integration Tests ─────────────────

import { SpecialistWorkbench } from '@/components/admin/SpecialistWorkbench';

const makeWorkbenchReq = (overrides: Record<string, unknown> = {}) => ({
  id: overrides.id as string ?? '1',
  code: overrides.code as string ?? 'REQ-001',
  title: overrides.title as string ?? 'Test Request',
  description: '',
  workspaceId: 'ws-1',
  workspaceName: 'Demo Workspace',
  customerName: 'Test Customer',
  customerEmail: 'test@test.com',
  matterTypeKey: (overrides.matterTypeKey as string) ?? 'commercial_review',
  status: overrides.status as string ?? 'assigned',
  priority: overrides.priority as string ?? 'MEDIUM',
  reviewerName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('SpecialistWorkbench AI Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Whitebox', () => {
    it('should render AI button on each request row', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq(), makeWorkbenchReq({ id: '2', code: 'REQ-002' })],
          stats: { assigned: 2, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-1-ai-btn')).toBeTruthy();
        expect(screen.getByTestId('workbench-card-2-ai-btn')).toBeTruthy();
      });
    });

    it('should navigate to chat page when AI button is clicked', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq()],
          stats: { assigned: 1, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-1-ai-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('workbench-card-1-ai-btn'));

      // Should navigate to chat page instead of opening inline panel
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/admin/requests/1/chat');
      });
    });

    it('should navigate again when AI button is clicked again', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq()],
          stats: { assigned: 1, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-1-ai-btn')).toBeTruthy();
      });

      // Click twice — both clicks should navigate
      fireEvent.click(screen.getByTestId('workbench-card-1-ai-btn'));
      fireEvent.click(screen.getByTestId('workbench-card-1-ai-btn'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(2);
      });
    });

    it('should navigate to chat page on AI button click for any request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq(), makeWorkbenchReq({ id: '2', code: 'REQ-002', title: 'Request 2' })],
          stats: { assigned: 2, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-1-ai-btn')).toBeTruthy();
        expect(screen.getByTestId('workbench-card-2-ai-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('workbench-card-1-ai-btn'));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/admin/requests/1/chat');
      });

      mockPush.mockClear();

      fireEvent.click(screen.getByTestId('workbench-card-2-ai-btn'));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/admin/requests/2/chat');
      });
    });
  });

  describe('Blackbox', () => {
    it('should navigate to chat page with correct requestId on AI click', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq({ id: '42', matterTypeKey: 'labor_contract' })],
          stats: { assigned: 1, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-42-ai-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('workbench-card-42-ai-btn'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/admin/requests/42/chat');
      });
    });
  });

  describe('Abnormal', () => {
    it('should handle null matterTypeKey in AI button with navigation', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq({ matterTypeKey: null })],
          stats: { assigned: 1, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      mockPush.mockClear();

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-1-ai-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('workbench-card-1-ai-btn'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/admin/requests/1/chat');
      });
    });

    it('should not render inline AI panel (navigation-only pattern)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeWorkbenchReq()],
          stats: { assigned: 1, inProgress: 0, pendingReview: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<SpecialistWorkbench />);

      await waitFor(() => {
        expect(screen.getByTestId('workbench-card-1-ai-btn')).toBeTruthy();
      });

      // No inline panel — navigation pattern only
      expect(screen.queryByTestId('ai-assistant-panel')).toBeNull();
    });
  });
});

// ── ReviewConsole AI Integration Tests ────────────────────────

import { ReviewConsole } from '@/components/admin/ReviewConsole';

const makeReviewReq = (overrides: Record<string, unknown> = {}) => ({
  id: overrides.id as string ?? 'rev-1',
  code: overrides.code as string ?? 'REQ-R01',
  title: overrides.title as string ?? 'Review Request',
  description: '',
  workspaceId: 'ws-1',
  workspaceName: 'Demo WS',
  customerName: 'Customer',
  customerEmail: 'c@test.com',
  matterTypeKey: (overrides.matterTypeKey as string) ?? 'commercial_review',
  status: overrides.status as string ?? 'pending_review',
  priority: overrides.priority as string ?? 'HIGH',
  specialistName: 'Specialist A',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('ReviewConsole AI Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Whitebox', () => {
    it('should render AI button on each review request row', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeReviewReq(), makeReviewReq({ id: 'rev-2', code: 'REQ-R02' })],
          stats: { pending: 2, approved: 0, revisionRequired: 0 },
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<ReviewConsole />);

      await waitFor(() => {
        expect(screen.getByTestId('review-card-rev-1-ai-btn')).toBeTruthy();
        expect(screen.getByTestId('review-card-rev-2-ai-btn')).toBeTruthy();
      });
    });

    it('should navigate to chat page on AI button click in ReviewConsole', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeReviewReq()],
          stats: { pending: 1, approved: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      mockPush.mockClear();

      render(<ReviewConsole />);

      await waitFor(() => {
        expect(screen.getByTestId('review-card-rev-1-ai-btn')).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId('review-card-rev-1-ai-btn'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/admin/requests/rev-1/chat');
      });
    });

    it('should navigate again on repeated AI button clicks in ReviewConsole', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeReviewReq()],
          stats: { pending: 1, approved: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      mockPush.mockClear();

      render(<ReviewConsole />);

      await waitFor(() => {
        expect(screen.getByTestId('review-card-rev-1-ai-btn')).toBeTruthy();
      });

      // Click twice — both clicks navigate
      fireEvent.click(screen.getByTestId('review-card-rev-1-ai-btn'));
      fireEvent.click(screen.getByTestId('review-card-rev-1-ai-btn'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Blackbox', () => {
    it('should show AI button alongside approve/revise buttons', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [makeReviewReq()],
          stats: { pending: 1, approved: 0, revisionRequired: 0 },
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });

      render(<ReviewConsole />);

      await waitFor(() => {
        expect(screen.getByText('Duyệt')).toBeTruthy();
        expect(screen.getByText('YCS')).toBeTruthy();
        expect(screen.getByTestId('review-card-rev-1-ai-btn')).toBeTruthy();
      });
    });
  });
});

// ── /api/ai/init Route Tests ─────────────────────────────────

import { GET } from '@/app/api/ai/init/route';

describe('/api/ai/init', () => {
  describe('Whitebox', () => {
    it('should return success with indexed count', async () => {
      const response = await GET();
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data.indexed).toBeGreaterThanOrEqual(0);
      expect(typeof json.data.totalChunks).toBe('number');
      expect(Array.isArray(json.data.sources)).toBe(true);
    });

    it('should include llmReady status', async () => {
      const response = await GET();
      const json = await response.json();

      expect(typeof json.data.llmReady).toBe('boolean');
    });
  });
});
