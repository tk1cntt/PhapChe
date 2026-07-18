import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { DeliveryConsole } from '../DeliveryConsole';

// Stable translator
const TRANSLATIONS: Record<string, Record<string, string>> = {
  DeliveryConsole: {
    statApproved: 'Đã duyệt', statDelivered: 'Đã bàn giao', statClosed: 'Đã đóng',
    searchPlaceholder: 'Tìm theo mã, tiêu đề...', filterAll: 'Tất cả',
    loading: 'Đang tải...', retry: 'Thử lại',
    emptyTitle: 'Không có hồ sơ nào', emptyDesc: 'Các hồ sơ đã duyệt.',
    colCode: 'Mã', colTitle: 'Tiêu đề', colCustomer: 'Khách hàng',
    colWorkspace: 'WS', colType: 'Loại việc', colStatus: 'Trạng thái',
    colPriority: 'Ưu tiên', colSpecialist: 'Chuyên viên', colReviewer: 'Reviewer',
    colAction: 'Thao tác', btnDeliver: 'Bàn giao', btnClose: 'Đóng hồ sơ',
    prev: 'Trước', next: 'Sau', specialistLabel: 'CV', reviewerLabel: 'RV',
    errorForbidden: 'Bạn không có quyền.', errorUnknown: 'Đã xảy ra lỗi.',
    dialogTitle: 'Bàn giao / Đóng hồ sơ', close: 'Đóng',
    labelNote: 'Ghi chú', placeholderNote: 'Nhập ghi chú...',
    noteDeliver: 'Bạn đang bàn giao hồ sơ.', noteClose: 'Bạn đang đóng hồ sơ.',
    btnCancel: 'Hủy', btnSaving: 'Đang lưu...',
    defaultTransitionNote: '{from} → {to}',
    errorTransitionFailed: 'Không thể thực hiện.',
    successTransitioned: 'Đã chuyển sang: {status}!',
  },
  RequestStatus: {
    approved: 'Đã duyệt', delivered: 'Đã bàn giao', closed: 'Đã đóng',
  },
  MatterTypes: { labor_contract: 'Soạn hợp đồng lao động' },
};

function makeT(ns: string) {
  const nso = TRANSLATIONS[ns] ?? {};
  return (key: string) => nso[key] ?? key;
}
const stableT = {
  DeliveryConsole: makeT('DeliveryConsole'),
  RequestStatus: makeT('RequestStatus'),
  MatterTypes: makeT('MatterTypes'),
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

// Mock DeliveryDialog
vi.mock('../DeliveryDialog', () => ({
  DeliveryDialog: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="mock-delivery-dialog">
      <button data-testid="mock-delivery-close" onClick={onClose}>Close</button>
      <button data-testid="mock-delivery-success" onClick={onSuccess}>Success</button>
    </div>
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockData = {
  data: [
    {
      id: 'r1', code: 'REQ-001', title: 'Hợp đồng ABC', description: '',
      workspaceId: 'ws-1', workspaceName: 'ABC Corp', customerName: 'Nguyễn Văn A',
      customerEmail: 'a@example.com', matterTypeKey: 'labor_contract',
      status: 'approved', priority: 'HIGH', specialistName: 'SP 1', reviewerName: 'RV 1',
      createdAt: '18/07/2026', updatedAt: '18/07/2026', workspaceSlug: '',
    },
    {
      id: 'r2', code: 'REQ-002', title: 'Đăng ký nhãn hiệu', description: '',
      workspaceId: 'ws-2', workspaceName: 'XYZ Ltd', customerName: 'Trần Thị B',
      customerEmail: 'b@example.com', matterTypeKey: null,
      status: 'delivered', priority: 'MEDIUM', specialistName: null, reviewerName: null,
      createdAt: '17/07/2026', updatedAt: '17/07/2026', workspaceSlug: '',
    },
  ],
  stats: { approved: 1, delivered: 1, closed: 0 },
  total: 2, page: 1, pageSize: 10, totalPages: 1,
};

describe('DeliveryConsole', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('Whitebox: Component structure', () => {
    it('renders stats from response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      const statValues = document.querySelectorAll('.stat-value');
      expect(statValues[0].textContent).toBe('1');
      expect(statValues[1].textContent).toBe('1');
      expect(statValues[2].textContent).toBe('0');
    });

    it('renders correct action buttons per status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      expect(screen.getByText('Bàn giao')).toBeInTheDocument();
      expect(screen.getByText('Đóng hồ sơ')).toBeInTheDocument();
    });

    it('shows — for closed status (no action)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, data: [{ ...mockData.data[0], status: 'closed' }] }),
      });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      expect(screen.queryByText('Bàn giao')).not.toBeInTheDocument();
      expect(screen.queryByText('Đóng hồ sơ')).not.toBeInTheDocument();
    });
  });

  describe('Blackbox: User interactions', () => {
    it('opens dialog on deliver click', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Bàn giao')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByTestId('mock-delivery-dialog')).toBeInTheDocument(); });
    });

    it('closes dialog on close', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Bàn giao')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByTestId('mock-delivery-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-delivery-close'));
      await waitFor(() => { expect(screen.queryByTestId('mock-delivery-dialog')).not.toBeInTheDocument(); });
    });

    it('refetches after success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Bàn giao')).toBeInTheDocument(); });
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByTestId('mock-delivery-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-delivery-success'));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledTimes(2); });
    });

    it('filters by status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockData, data: [mockData.data[0]] }) });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'approved' } });
      await waitFor(() => { expect(screen.getByText('Hợp đồng ABC')).toBeInTheDocument(); });
    });
  });

  describe('Abnormal: Edge cases', () => {
    it('shows empty state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], stats: { approved: 0, delivered: 0, closed: 0 }, total: 0, page: 1, pageSize: 10, totalPages: 1 }),
      });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Không có hồ sơ nào')).toBeInTheDocument(); });
    });

    it('renders pagination', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockData, totalPages: 5 }) });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument(); });
    });

    it('searches by text input', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => mockData });
      await act(async () => { render(<DeliveryConsole />); });
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
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });

    it('shows forbidden', async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
      await act(async () => { render(<DeliveryConsole />); });
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền.')).toBeInTheDocument(); });
    });
  });
});
