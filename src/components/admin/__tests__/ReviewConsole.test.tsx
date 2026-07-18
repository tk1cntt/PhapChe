import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ReviewConsole } from '../ReviewConsole';

// Stable translator
const TRANSLATIONS: Record<string, Record<string, string>> = {
  ReviewConsole: {
    statPending: 'Chờ kiểm tra', statApproved: 'Đã duyệt', statRevision: 'Cần sửa',
    searchPlaceholder: 'Tìm theo mã, tiêu đề...', loading: 'Đang tải...',
    retry: 'Thử lại', emptyTitle: 'Không có hồ sơ nào cần kiểm tra',
    emptyDesc: 'Các hồ sơ chờ bạn kiểm tra sẽ hiển thị ở đây.',
    colCode: 'Mã', colTitle: 'Tiêu đề', colCustomer: 'Khách hàng',
    colWorkspace: 'WS', colType: 'Loại việc', colPriority: 'Ưu tiên',
    colSpecialist: 'Chuyên viên', colAction: 'Thao tác',
    btnApprove: 'Duyệt', btnRevise: 'Yêu cầu sửa',
    prev: 'Trước', next: 'Sau', specialistLabel: 'Chuyên viên',
    errorForbidden: 'Bạn không có quyền.', errorUnknown: 'Đã xảy ra lỗi.',
    dialogTitle: 'Kiểm duyệt hồ sơ', close: 'Đóng',
    labelDecision: 'Quyết định', labelNote: 'Ghi chú',
    placeholderApprove: 'Nhập ghi chú duyệt...', placeholderRevise: 'Nhập lý do yêu cầu sửa...',
    noteApprove: 'Hồ sơ sẽ được duyệt.', noteRevise: 'Chuyên viên sẽ nhận yêu cầu sửa.',
    btnCancel: 'Hủy', btnSaving: 'Đang lưu...',
    defaultTransitionNote: '{from} → {to}',
    errorTransitionFailed: 'Không thể kiểm duyệt.',
    successReviewed: 'Đã kiểm duyệt: {status}!',
  },
  RequestStatus: {
    pending_review: 'Chờ kiểm tra', approved: 'Đã duyệt', revision_required: 'Cần sửa',
  },
  MatterTypes: { labor_contract: 'Soạn hợp đồng lao động' },
};

function makeT(ns: string) {
  const nso = TRANSLATIONS[ns] ?? {};
  return (key: string, params?: Record<string, string>) => nso[key] ?? key;
}
const stableT = {
  ReviewConsole: makeT('ReviewConsole'),
  RequestStatus: makeT('RequestStatus'),
  MatterTypes: makeT('MatterTypes'),
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

// Mock ReviewDialog as a simple trigger component
vi.mock('../ReviewDialog', () => ({
  ReviewDialog: ({ onClose, onSuccess, defaultAction }: {
    onClose: () => void; onSuccess: () => void; defaultAction: string;
  }) => (
    <div data-testid="mock-review-dialog" data-action={defaultAction}>
      <button data-testid="mock-review-close" onClick={onClose}>Close</button>
      <button data-testid="mock-review-success" onClick={onSuccess}>Success</button>
      <span data-testid="mock-action">{defaultAction}</span>
    </div>
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockData = {
  data: [
    {
      id: 'r1', code: 'REQ-001', title: 'Hợp đồng ABC', description: 'Cần soạn HĐLĐ',
      workspaceId: 'ws-1', workspaceName: 'ABC Corp', customerName: 'Nguyễn Văn A',
      customerEmail: 'a@example.com', matterTypeKey: 'labor_contract',
      status: 'pending_review', priority: 'HIGH', specialistName: 'Specialist 1',
      createdAt: '18/07/2026', updatedAt: '18/07/2026', workspaceSlug: '',
    },
    {
      id: 'r2', code: 'REQ-002', title: 'Đăng ký nhãn hiệu', description: '',
      workspaceId: 'ws-2', workspaceName: 'XYZ Ltd', customerName: 'Trần Thị B',
      customerEmail: 'b@example.com', matterTypeKey: null,
      status: 'pending_review', priority: 'MEDIUM', specialistName: null,
      createdAt: '17/07/2026', updatedAt: '17/07/2026', workspaceSlug: '',
    },
  ],
  stats: { pending: 2, approved: 0, revisionRequired: 0 },
  total: 2, page: 1, pageSize: 10, totalPages: 1,
};

describe('ReviewConsole', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('Whitebox: Component structure', () => {
    it('renders stats from response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      const statValues = document.querySelectorAll('.stat-value');
      expect(statValues[0].textContent).toBe('2');
      expect(statValues[1].textContent).toBe('0');
      expect(statValues[2].textContent).toBe('0');
    });

    it('renders approve and revise buttons per row', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      const approveBtns = screen.getAllByText('Duyệt');
      const reviseBtns = screen.getAllByText('Yêu cầu sửa');
      expect(approveBtns).toHaveLength(2);
      expect(reviseBtns).toHaveLength(2);
    });

    it('shows specialist name when available', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText(/Chuyên viên:/)).toBeInTheDocument(); });
      expect(screen.getAllByText(/Specialist 1/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows — for null matter type', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1); });
    });
  });

  describe('Blackbox: User interactions', () => {
    it('opens ReviewDialog on Approve click', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      fireEvent.click(screen.getAllByText('Duyệt')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-review-dialog')).toBeInTheDocument(); });
      expect(screen.getByTestId('mock-action').textContent).toBe('approve');
    });

    it('opens ReviewDialog on Revise click', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      fireEvent.click(screen.getAllByText('Yêu cầu sửa')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-review-dialog')).toBeInTheDocument(); });
      expect(screen.getByTestId('mock-action').textContent).toBe('revise');
    });

    it('closes dialog on close', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      fireEvent.click(screen.getAllByText('Duyệt')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-review-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-review-close'));
      await waitFor(() => { expect(screen.queryByTestId('mock-review-dialog')).not.toBeInTheDocument(); });
    });

    it('refetches after successful review', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      fireEvent.click(screen.getAllByText('Duyệt')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-review-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-review-success'));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledTimes(2); });
    });

    it('searches by text input', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => mockData });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      const input = screen.getByPlaceholderText('Tìm theo mã, tiêu đề...');
      fireEvent.change(input, { target: { value: 'REQ-001' } });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
    });
  });

  describe('Abnormal: Edge cases', () => {
    it('shows empty state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], stats: { pending: 0, approved: 0, revisionRequired: 0 }, total: 0, page: 1, pageSize: 10, totalPages: 1 }),
      });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Không có hồ sơ nào cần kiểm tra')).toBeInTheDocument(); });
    });

    it('renders pagination when totalPages > 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, totalPages: 3, page: 1 }),
      });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
      expect(screen.getByText('Trước')).toBeDisabled();
    });
  });

  describe('Error: API failure', () => {
    it('shows error on network failure', async () => {
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });

    it('shows forbidden', async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
      await act(async () => { render(<ReviewConsole />); });
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền.')).toBeInTheDocument(); });
    });
  });
});
