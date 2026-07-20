import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { TriagePanel } from '../TriagePanel';

// -- Stable translator functions to prevent useCallback dependency cycles --
const TRANSLATIONS: Record<string, Record<string, string>> = {
  AdminTriage: {
    statTotal: 'Tổng hồ sơ', statNeedsTriage: 'Cần phân loại', statDraft: 'Nháp',
    searchPlaceholder: 'Tìm theo mã, tiêu đề...', filterAll: 'Tất cả trạng thái',
    loading: 'Đang tải...', retry: 'Thử lại', emptyTitle: 'Không có hồ sơ cần phân loại',
    emptyDesc: 'Tất cả hồ sơ đã được phân loại.', colCode: 'Mã hồ sơ',
    colTitle: 'Tiêu đề / Mô tả', colCustomer: 'Khách hàng', colWorkspace: 'Workspace',
    colType: 'Loại việc', colPriority: 'Ưu tiên', colStatus: 'Trạng thái',
    colAction: 'Thao tác', btnAssign: 'Gán', prev: 'Trước', next: 'Sau',
    dialogTitle: 'Phân công xử lý', dialogSubtitle: 'HD:{code}', close: 'Đóng',
    labelSpecialist: 'Chuyên viên xử lý', labelReviewer: 'Người kiểm tra',
    placeholderSelectSpecialist: '-- Chọn chuyên viên --',
    placeholderSelectReviewer: '-- Chọn reviewer --',
    noSpecialistsAvailable: 'Không có chuyên viên',
    noReviewersAvailable: 'Không có reviewer',
    noteDraftToAssigned: 'Hồ sơ đang ở trạng thái Nháp.',
    noteTriageToAssigned: 'Hồ sơ đã được phân loại.',
    btnCancel: 'Hủy', btnSaving: 'Đang lưu...', btnConfirmAssign: 'Xác nhận gán',
    statusTriage: 'Cần phân loại', statusDraft: 'Nháp',
    errorNoSpecialist: 'Vui lòng chọn chuyên viên',
    errorAssignFailed: 'Không thể gán chuyên viên',
    errorStatusTransition: 'Lỗi chuyển trạng thái: {detail}',
    errorUnknown: 'Đã xảy ra lỗi', errorForbidden: 'Bạn không có quyền truy cập',
    successAssigned: 'Đã phân công thành công!', none: '(không có)',
  },
  RequestStatus: { draft_intake: 'Đang nhập thông tin', triage: 'Cần phân loại' },
  MatterTypes: { labor_contract: 'Soạn hợp đồng lao động' },
};

function makeT(namespace: string) {
  const ns = TRANSLATIONS[namespace] ?? {};
  return (key: string, params?: Record<string, string>) => {
    const val = ns[key];
    if (!val) return key;
    if (params) return val.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? `{${k}}`);
    return val;
  };
}

const stableT = {
  AdminTriage: makeT('AdminTriage'),
  RequestStatus: makeT('RequestStatus'),
  MatterTypes: makeT('MatterTypes'),
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
  useLocale: () => 'vi',
  useNow: () => new Date(),
  useTimeZone: () => 'Asia/Ho_Chi_Minh',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AssignmentDialog
vi.mock('../AssignmentDialog', () => ({
  AssignmentDialog: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="mock-assignment-dialog">
      <button data-testid="mock-dialog-close" onClick={onClose}>Close</button>
      <button data-testid="mock-dialog-success" onClick={onSuccess}>Success</button>
    </div>
  ),
}));

const mockTriageData = {
  data: [
    {
      id: 'req-1', code: 'REQ-2026-001', title: 'Hợp đồng lao động ABC Corp',
      description: 'Cần soạn hợp đồng lao động cho nhân viên mới',
      workspaceId: 'ws-1', workspaceName: 'ABC Corp', workspaceSlug: 'abc-corp',
      customerName: 'Nguyễn Văn A', customerEmail: 'nguyenvana@example.com',
      matterTypeKey: 'labor_contract', status: 'triage', priority: 'HIGH',
      date: '18/07/2026', hasAnswers: true,
    },
    {
      id: 'req-2', code: 'REQ-2026-002', title: 'Đăng ký nhãn hiệu XYZ',
      description: '', workspaceId: 'ws-2', workspaceName: 'XYZ Ltd',
      workspaceSlug: 'xyz-ltd', customerName: 'Trần Thị B',
      customerEmail: 'tranthib@example.com', matterTypeKey: 'trademark_registration',
      status: 'draft_intake', priority: 'MEDIUM', date: '17/07/2026', hasAnswers: false,
    },
  ],
  specialists: [
    { id: 'sp-1', name: 'Lê Văn S', email: 'levans@example.com', workspaceId: 'ws-1' },
    { id: 'sp-2', name: 'Phạm Thị T', email: 'phamthit@example.com', workspaceId: 'ws-2' },
  ],
  reviewers: [
    { id: 'rv-1', name: 'Reviewer 1', email: 'rv1@example.com', workspaceId: 'ws-1' },
  ],
  total: 2, page: 1, pageSize: 10, totalPages: 1,
};

describe('TriagePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== WHITEBOX TESTS ====================
  describe('Whitebox: Component structure', () => {
    it('renders stats row', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('Tổng hồ sơ')).toBeInTheDocument(); });
      // "Cần phân loại" & "Nháp" appear in both stats bar + filter dropdown / status badges
      expect(screen.getAllByText('Cần phân loại').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Nháp').length).toBeGreaterThanOrEqual(1);
    });

    it('renders search and filter', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByPlaceholderText('Tìm theo mã, tiêu đề...')).toBeInTheDocument(); });
	    // Paging component adds another combobox (pageSize select)
	    const combos = screen.getAllByRole('combobox');
	    expect(combos.length).toBeGreaterThanOrEqual(1);
    });

    it('renders request cards with code, title, and meta', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });
      // Cards render code as mono text, title, customer/workspace in meta
      expect(screen.getByText('Hợp đồng lao động ABC Corp')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('ABC Corp')).toBeInTheDocument();
    });

    it('renders request rows', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('ABC Corp')).toBeInTheDocument();
    });

    it('renders assign buttons', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getAllByText('Gán')).toHaveLength(2); });
    });

    it('shows pagination only when multi-page', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTriageData, total: 25, totalPages: 3 }) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByTestId('common-paging')).toBeInTheDocument(); });
      // Paging shows page navigation buttons — next page should be enabled
      expect(screen.getByLabelText('nextPage')).not.toBeDisabled();
    });
  });

  // ==================== BLACKBOX TESTS ====================
  describe('Blackbox: User interactions', () => {
    it('opens and closes AssignmentDialog', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });

      fireEvent.click(screen.getAllByText('Gán')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-assignment-dialog')).toBeInTheDocument(); });

      fireEvent.click(screen.getByTestId('mock-dialog-close'));
      await waitFor(() => { expect(screen.queryByTestId('mock-assignment-dialog')).not.toBeInTheDocument(); });
    });

    it('refetches after successful assignment', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTriageData, data: [mockTriageData.data[1]] }) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });

      fireEvent.click(screen.getAllByText('Gán')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-assignment-dialog')).toBeInTheDocument(); });
      fireEvent.click(screen.getByTestId('mock-dialog-success'));

      await waitFor(() => { expect(mockFetch).toHaveBeenCalledTimes(2); });
    });

    it('filters by search text', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); expect(screen.getByText('REQ-2026-002')).toBeInTheDocument(); });

      fireEvent.change(screen.getByPlaceholderText('Tìm theo mã, tiêu đề...'), { target: { value: 'ABC' } });
      await waitFor(() => { expect(screen.queryByText('REQ-2026-002')).not.toBeInTheDocument(); });
      expect(screen.getByText('REQ-2026-001')).toBeInTheDocument();
    });

    it('filters by status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });

      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'draft_intake' } });
      await waitFor(() => { expect(screen.queryByText('REQ-2026-001')).not.toBeInTheDocument(); });
      expect(screen.getByText('REQ-2026-002')).toBeInTheDocument();
    });
  });

  // ==================== ABNORMAL TESTS ====================
  describe('Abnormal: Edge cases', () => {
    it('shows empty state', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [], specialists: [], reviewers: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('Không có hồ sơ cần phân loại')).toBeInTheDocument(); });
    });

    it('shows empty after search filtering', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });

      fireEvent.change(screen.getByPlaceholderText('Tìm theo mã, tiêu đề...'), { target: { value: 'ZZZZ_NONEXISTENT' } });
      await waitFor(() => { expect(screen.getByText('Không có hồ sơ cần phân loại')).toBeInTheDocument(); });
    });

    it('can open dialog even with no specialists', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTriageData, specialists: [], reviewers: [] }) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });
      fireEvent.click(screen.getAllByText('Gán')[0]);
      await waitFor(() => { expect(screen.getByTestId('mock-assignment-dialog')).toBeInTheDocument(); });
    });

    it('shows — for null matter type', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTriageData, data: [{ ...mockTriageData.data[0], matterTypeKey: null }] }) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('—')).toBeInTheDocument(); });
    });
  });

  // ==================== ERROR TESTS ====================
  describe('Error: API failure handling', () => {
    it('shows network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
      expect(screen.getByText('Thử lại')).toBeInTheDocument();
    });

    it('shows forbidden on 403', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền truy cập')).toBeInTheDocument(); });
    });

    it('shows generic on 500', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('HTTP 500')).toBeInTheDocument(); });
    });

    it('retry refetches', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockTriageData });
      await act(async () => { render(<TriagePanel />); });
      await waitFor(() => { expect(screen.getByText('Thử lại')).toBeInTheDocument(); });

      fireEvent.click(screen.getByText('Thử lại'));
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });
    });

    it('shows loading spinner', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);

      await act(async () => { render(<TriagePanel />); });
      expect(screen.getByText('Đang tải...')).toBeInTheDocument();

      await act(async () => { resolvePromise({ ok: true, json: async () => mockTriageData }); });
      await waitFor(() => { expect(screen.getByText('REQ-2026-001')).toBeInTheDocument(); });
    });
  });
});
