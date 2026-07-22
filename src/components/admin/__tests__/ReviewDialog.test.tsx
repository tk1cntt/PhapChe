import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ReviewDialog } from '../ReviewDialog';

// Stable translator
const TRANSLATIONS: Record<string, Record<string, string>> = {
  ReviewConsole: {
    dialogTitle: 'Kiểm duyệt hồ sơ', close: 'Đóng',
    colWorkspace: 'WS', colCustomer: 'Khách hàng', colSpecialist: 'Chuyên viên',
    colStatus: 'Trạng thái', labelDecision: 'Quyết định', labelNote: 'Ghi chú',
    placeholderApprove: 'Nhập ghi chú duyệt...', placeholderRevise: 'Nhập lý do yêu cầu sửa...',
    noteApprove: 'Hồ sơ sẽ được duyệt.', noteRevise: 'Chuyên viên sẽ nhận yêu cầu sửa.',
    btnApprove: 'Duyệt', btnRevise: 'Yêu cầu sửa', btnCancel: 'Hủy',
    btnSaving: 'Đang lưu...',
    defaultTransitionNote: '{from} → {to}',
    errorForbidden: 'Bạn không có quyền.', errorUnknown: 'Đã xảy ra lỗi.',
    errorTransitionFailed: 'Không thể kiểm duyệt.',
    successReviewed: 'Đã kiểm duyệt: {status}!',
  },
  RequestStatus: {
    pending_review: 'Chờ phê duyệt', approved: 'Đã phê duyệt', revision_required: 'Cần sửa',
  },
};

function makeT(ns: string) {
  const nso = TRANSLATIONS[ns] ?? {};
  return (key: string, params?: Record<string, string>) => {
    const val = nso[key];
    if (!val) return key;
    if (params) return val.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? `{${k}}`);
    return val;
  };
}
const stableT = { ReviewConsole: makeT('ReviewConsole'), RequestStatus: makeT('RequestStatus') };
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const baseReq = {
  id: 'r1', code: 'REQ-001', title: 'Hợp đồng ABC',
  status: 'pending_review', priority: 'HIGH',
  workspaceName: 'ABC Corp', customerName: 'Nguyễn Văn A', specialistName: 'Specialist 1',
};

describe('ReviewDialog', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('Whitebox: Structure', () => {
    it('renders title and request code', () => {
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Kiểm duyệt hồ sơ')).toBeInTheDocument();
      expect(screen.getByText(/REQ-001/)).toBeInTheDocument();
    });

    it('shows approve decision by default', () => {
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Đã phê duyệt')).toBeInTheDocument();
      // Confirm button shows "Duyệt"
      expect(screen.getByText('Duyệt')).toBeInTheDocument();
    });

    it('shows revise decision for revise action', () => {
      render(<ReviewDialog request={baseReq} defaultAction="revise" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Cần sửa')).toBeInTheDocument();
    });

    it('shows note placeholder for approve', () => {
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByPlaceholderText('Nhập ghi chú duyệt...')).toBeInTheDocument();
    });

    it('shows note placeholder for revise', () => {
      render(<ReviewDialog request={baseReq} defaultAction="revise" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByPlaceholderText('Nhập lý do yêu cầu sửa...')).toBeInTheDocument();
    });

    it('shows info note for approve', () => {
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Hồ sơ sẽ được duyệt.')).toBeInTheDocument();
    });

    it('shows info note for revise', () => {
      render(<ReviewDialog request={baseReq} defaultAction="revise" onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Chuyên viên sẽ nhận yêu cầu sửa.')).toBeInTheDocument();
    });
  });

  describe('Whitebox: Note textarea', () => {
    it('updates note on textarea change', () => {
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      const textarea = screen.getByPlaceholderText('Nhập ghi chú duyệt...');
      fireEvent.change(textarea, { target: { value: 'Test note' } });
      expect(textarea).toHaveValue('Test note');
    });

    it('textarea is disabled when saving', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Duyệt'));
      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      expect(screen.getByPlaceholderText('Nhập ghi chú duyệt...')).toBeDisabled();
      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });

  describe('Whitebox: Decision toggle', () => {
    it('toggles from approve to revise', () => {
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      // Click the 🔄 Yêu cầu sửa toggle button (not the confirm button)
      fireEvent.click(screen.getByText('🔄 Yêu cầu sửa'));
      // Note placeholder changes
      expect(screen.getByPlaceholderText('Nhập lý do yêu cầu sửa...')).toBeInTheDocument();
      // Info note changes
      expect(screen.getByText('Chuyên viên sẽ nhận yêu cầu sửa.')).toBeInTheDocument();
    });

    it('toggles from revise to approve', () => {
      render(<ReviewDialog request={baseReq} defaultAction="revise" onClose={vi.fn()} onSuccess={vi.fn()} />);
      // Click the ✅ Duyệt toggle button (not the confirm button)
      fireEvent.click(screen.getByText('✅ Duyệt'));
      expect(screen.getByPlaceholderText('Nhập ghi chú duyệt...')).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ sẽ được duyệt.')).toBeInTheDocument();
    });
  });

  describe('Blackbox: Interactions', () => {
    it('calls onClose via cancel', () => {
      const onClose = vi.fn();
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Hủy'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via close icon', () => {
      const onClose = vi.fn();
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByLabelText('Đóng'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via overlay', () => {
      const onClose = vi.fn();
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(document.querySelector('.dialog-overlay')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submits approve on confirm', async () => {
      const onSuccess = vi.fn();
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={onSuccess} />);
      fireEvent.click(screen.getByText('Duyệt'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/requests/r1/status', expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('approved'),
        }));
      });
      await waitFor(() => { expect(screen.getByText(/Đã kiểm duyệt/)).toBeInTheDocument(); });
    });

    it('submits revision on revise confirm', async () => {
      const onSuccess = vi.fn();
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

      render(<ReviewDialog request={baseReq} defaultAction="revise" onClose={vi.fn()} onSuccess={onSuccess} />);
      fireEvent.click(screen.getByText('Yêu cầu sửa'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/requests/r1/status', expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('revision_required'),
        }));
      });
    });

    it('shows saving state', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);

      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Duyệt'));

      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      expect(screen.getByText('Hủy')).toBeDisabled();

      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });

  describe('Error: API failures', () => {
    it('shows error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'INVALID_TRANSITION' }) });
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Duyệt'));
      await waitFor(() => { expect(screen.getByText('INVALID_TRANSITION')).toBeInTheDocument(); });
    });

    it('shows forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'FORBIDDEN' }) });
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Duyệt'));
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền.')).toBeInTheDocument(); });
    });

    it('shows error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      render(<ReviewDialog request={baseReq} defaultAction="approve" onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Duyệt'));
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });
  });
});
