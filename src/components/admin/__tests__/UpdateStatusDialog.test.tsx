import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { UpdateStatusDialog } from '../UpdateStatusDialog';

// Stable translator
const TRANSLATIONS: Record<string, Record<string, string>> = {
  SpecialistWorkbench: {
    dialogTitle: 'Cập nhật trạng thái', close: 'Đóng',
    labelNote: 'Ghi chú', placeholderNote: 'Nhập ghi chú...',
    noteStartWork: 'Bạn đang bắt đầu xử lý hồ sơ này.',
    noteSubmitReview: 'Bạn đang gửi hồ sơ lên reviewer.',
    noteResubmit: 'Bạn đang gửi lại hồ sơ.',
    btnCancel: 'Hủy', btnSaving: 'Đang lưu...', btnConfirm: 'Xác nhận',
    btnStartWork: 'Bắt đầu xử lý', btnSubmitReview: 'Gửi kiểm tra', btnResubmit: 'Gửi lại',
    colWorkspace: 'Workspace', colCustomer: 'Khách hàng', colStatus: 'Trạng thái',
    defaultTransitionNote: '{from} → {to}',
    errorForbidden: 'Bạn không có quyền.', errorUnknown: 'Đã xảy ra lỗi.',
    errorTransitionFailed: 'Chuyển trạng thái thất bại.',
    successTransitioned: 'Đã chuyển sang: {status}!',
  },
  RequestStatus: {
    assigned: 'Đã phân công', in_progress: 'Đang xử lý', pending_review: 'Chờ kiểm tra',
    revision_required: 'Cần sửa',
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
const stableT = { SpecialistWorkbench: makeT('SpecialistWorkbench'), RequestStatus: makeT('RequestStatus') };
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const baseReq = {
  id: 'r1', code: 'REQ-001', title: 'Hợp đồng ABC',
  status: 'assigned', priority: 'HIGH',
  workspaceName: 'ABC Corp', customerName: 'Nguyễn Văn A', reviewerName: null,
};

describe('UpdateStatusDialog', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('Whitebox: Structure', () => {
    it('renders title and request code', () => {
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Cập nhật trạng thái')).toBeInTheDocument();
      expect(screen.getByText(/REQ-001/)).toBeInTheDocument();
    });

    it('shows status transition arrow', () => {
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Đã phân công')).toBeInTheDocument();
      expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('shows correct note for assigned status', () => {
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bạn đang bắt đầu xử lý hồ sơ này.')).toBeInTheDocument();
    });

    it('shows correct note for in_progress', () => {
      render(<UpdateStatusDialog request={{ ...baseReq, status: 'in_progress' }} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bạn đang gửi hồ sơ lên reviewer.')).toBeInTheDocument();
    });

    it('shows correct note for revision_required', () => {
      render(<UpdateStatusDialog request={{ ...baseReq, status: 'revision_required' }} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bạn đang gửi lại hồ sơ.')).toBeInTheDocument();
    });

    it('has note textarea', () => {
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByPlaceholderText('Nhập ghi chú...')).toBeInTheDocument();
    });
  });

  describe('Blackbox: Interactions', () => {
    it('calls onClose via cancel', () => {
      const onClose = vi.fn();
      render(<UpdateStatusDialog request={baseReq} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Hủy'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via close icon', () => {
      const onClose = vi.fn();
      render(<UpdateStatusDialog request={baseReq} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByLabelText('Đóng'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via overlay', () => {
      const onClose = vi.fn();
      render(<UpdateStatusDialog request={baseReq} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(document.querySelector('.dialog-overlay')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submits status transition on confirm', async () => {
      const onSuccess = vi.fn();
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={onSuccess} />);
      fireEvent.click(screen.getByText('Bắt đầu xử lý'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/requests/r1/status', expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('in_progress'),
        }));
      });

      await waitFor(() => { expect(screen.getByText(/Đã chuyển sang/)).toBeInTheDocument(); });
    });

    it('shows saving state', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);

      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bắt đầu xử lý'));

      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      expect(screen.getByText('Hủy')).toBeDisabled();

      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });

  describe('Abnormal: Edge cases', () => {
    it('shows correct button for in_progress', () => {
      render(<UpdateStatusDialog request={{ ...baseReq, status: 'in_progress' }} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Gửi kiểm tra')).toBeInTheDocument();
    });

    it('shows correct button for revision_required', () => {
      render(<UpdateStatusDialog request={{ ...baseReq, status: 'revision_required' }} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Gửi lại')).toBeInTheDocument();
    });
  });

  describe('Whitebox: Note textarea', () => {
    it('updates note on textarea change', () => {
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const textarea = screen.getByPlaceholderText('Nhập ghi chú...');
      fireEvent.change(textarea, { target: { value: 'Ghi chú test' } });
      expect(textarea).toHaveValue('Ghi chú test');
    });

    it('textarea is disabled when saving', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      expect(screen.getByPlaceholderText('Nhập ghi chú...')).toBeDisabled();
      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });

  describe('Error: API failures', () => {
    it('shows error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'INVALID_TRANSITION' }) });
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByText('INVALID_TRANSITION')).toBeInTheDocument(); });
    });

    it('shows forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'FORBIDDEN' }) });
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền.')).toBeInTheDocument(); });
    });

    it('shows error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      render(<UpdateStatusDialog request={baseReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bắt đầu xử lý'));
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });
  });
});
