import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { SpecialistWorkbench } from '../SpecialistWorkbench';

// Stable translator
const TRANSLATIONS: Record<string, Record<string, string>> = {
  SpecialistWorkbench: {
    statAssigned: 'Đã phân công', statInProgress: 'Đang xử lý', statPendingReview: 'Chờ kiểm tra',
    statRevision: 'Cần sửa', searchPlaceholder: 'Tìm theo mã, tiêu đề...', filterAll: 'Tất cả',
    loading: 'Đang tải...', retry: 'Thử lại', emptyTitle: 'Không có hồ sơ nào được gán',
    emptyDesc: 'Các hồ sơ được phân công sẽ hiển thị ở đây.',
    colCode: 'Mã', colTitle: 'Tiêu đề', colCustomer: 'Khách hàng',
    colWorkspace: 'WS', colType: 'Loại việc', colPriority: 'Ưu tiên',
    colStatus: 'Trạng thái', colAction: 'Thao tác',
    btnStartWork: 'Bắt đầu xử lý', btnSubmitReview: 'Gửi kiểm tra', btnResubmit: 'Gửi lại',
    prev: 'Trước', next: 'Sau', reviewerLabel: 'Reviewer',
    errorForbidden: 'Bạn không có quyền.', errorUnknown: 'Đã xảy ra lỗi.',
  },
  RequestStatus: {
    assigned: 'Đã phân công', in_progress: 'Đang xử lý', pending_review: 'Chờ kiểm tra',
    revision_required: 'Cần sửa', statusJustUpdated: 'Vừa cập nhật',
  },
  MatterTypes: { labor_contract: 'Soạn hợp đồng lao động' },
};

function makeT(ns: string) {
  const nso = TRANSLATIONS[ns] ?? {};
  return (key: string, params?: Record<string, string>) => nso[key] ?? key;
}
const stableT = {
  SpecialistWorkbench: makeT('SpecialistWorkbench'),
  RequestStatus: makeT('RequestStatus'),
  MatterTypes: makeT('MatterTypes'),
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

// Mock UpdateStatusDialog
vi.mock('../UpdateStatusDialog', () => ({
  UpdateStatusDialog: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="mock-update-dialog">
      <button data-testid="mock-update-close" onClick={onClose}>Close</button>
      <button data-testid="mock-update-success" onClick={onSuccess}>Success</button>
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
      status: 'assigned', priority: 'HIGH', reviewerName: 'Reviewer 1',
      createdAt: '18/07/2026', updatedAt: '18/07/2026',
      workspaceSlug: '',
    },
    {
      id: 'r2', code: 'REQ-002', title: 'Đăng ký nhãn hiệu', description: '',
      workspaceId: 'ws-2', workspaceName: 'XYZ Ltd', customerName: 'Trần Thị B',
      customerEmail: 'b@example.com', matterTypeKey: null,
      status: 'in_progress', priority: 'MEDIUM', reviewerName: null,
      createdAt: '17/07/2026', updatedAt: '17/07/2026',
      workspaceSlug: '',
    },
  ],
  stats: { assigned: 1, inProgress: 1, pendingReview: 0, revisionRequired: 0 },
  total: 2, page: 1, pageSize: 10, totalPages: 1,
};

describe('SpecialistWorkbench', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('Whitebox: Component structure', () => {
    it('renders stats from response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      // Stats values
      const statValues = document.querySelectorAll('.stat-value');
      expect(statValues[0].textContent).toBe('1'); // assigned
      expect(statValues[1].textContent).toBe('1'); // inProgress
      expect(statValues[2].textContent).toBe('0'); // pendingReview
    });

    it('renders action button per status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Bắt đầu xử lý')).toBeInTheDocument(); });
      expect(screen.getByText('Gửi kiểm tra')).toBeInTheDocument();
    });

    it('shows reviewer name when available', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText(/Reviewer:/)).toBeInTheDocument(); });
    });

    it('shows — for null matter type', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1); });
    });
  });

  describe('Blackbox: User interactions', () => {
    it('opens UpdateStatusDialog on action click', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Bắt đầu xử lý')).toBeInTheDocument(); });

      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByTestId('mock-update-dialog')).toBeInTheDocument(); });
    });

    it('closes dialog on close', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Bắt đầu xử lý')).toBeInTheDocument(); });

      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByTestId('mock-update-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-update-close'));
      await waitFor(() => { expect(screen.queryByTestId('mock-update-dialog')).not.toBeInTheDocument(); });
    });

    it('refetches after successful transition', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockData, data: [mockData.data[1]] }) });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Bắt đầu xử lý')).toBeInTheDocument(); });

      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByTestId('mock-update-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-update-success'));

      await waitFor(() => { expect(mockFetch).toHaveBeenCalledTimes(2); });
    });

    it('filters by status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });

      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'in_progress' } });
      await waitFor(() => { expect(screen.queryByText('Hợp đồng ABC')).not.toBeInTheDocument(); });
      expect(screen.getByText('Đăng ký nhãn hiệu')).toBeInTheDocument();
    });
  });

  describe('Abnormal: Edge cases', () => {
    it('shows empty state', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [], stats: { assigned: 0, inProgress: 0, pendingReview: 0, revisionRequired: 0 }, total: 0, page: 1, pageSize: 10, totalPages: 1 }) });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Không có hồ sơ nào được gán')).toBeInTheDocument(); });
    });

    it('no action button for pending_review status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockData, data: [{ ...mockData.data[0], status: 'pending_review' }], stats: { ...mockData.stats, pendingReview: 1 } }) });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      expect(screen.queryByText('Bắt đầu xử lý')).not.toBeInTheDocument();
      expect(screen.queryByText('Gửi kiểm tra')).not.toBeInTheDocument();
    });
  });

  describe('Abnormal: Pagination', () => {
    it('renders pagination when totalPages > 1', async () => {
      // Paging computes totalPages = Math.ceil(total/pageSize), so total must be > pageSize (10)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, total: 25, page: 1 }),
      });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      expect(screen.getByTestId("common-paging")).toBeInTheDocument();
      // Paging uses SVG arrows — check aria-label
      expect(screen.getByLabelText('previousPage')).toBeDisabled();
      expect(screen.getByLabelText('nextPage')).not.toBeDisabled();
    });

    it('navigates to next page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, total: 25, page: 1 }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, total: 25, page: 2 }),
      });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      fireEvent.click(screen.getByLabelText('nextPage'));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledTimes(2); });
    });
  });

  describe('Abnormal: Client-side operations', () => {
    it('filters by search input', async () => {
      // Set initial + re-fetch mock upfront
      mockFetch.mockResolvedValue({ ok: true, json: async () => mockData });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      const input = screen.getByPlaceholderText('Tìm theo mã, tiêu đề...');
      fireEvent.change(input, { target: { value: 'REQ-001' } });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
    });
  });

  describe('Error: API failure', () => {
    it('shows error on network failure', async () => {
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });

    it('shows forbidden', async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
      await act(async () => { render(<SpecialistWorkbench />); });
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền.')).toBeInTheDocument(); });
    });
  });
});
