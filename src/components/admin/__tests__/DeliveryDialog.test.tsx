import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { DeliveryDialog } from '../DeliveryDialog';

// Stable translator
const TRANSLATIONS: Record<string, Record<string, string>> = {
  DeliveryConsole: {
    dialogTitle: 'Bàn giao / Đóng hồ sơ', close: 'Đóng',
    colWorkspace: 'WS', colCustomer: 'Khách hàng', colSpecialist: 'Chuyên viên',
    colReviewer: 'Reviewer', colStatus: 'Trạng thái', labelNote: 'Ghi chú',
    placeholderNote: 'Nhập ghi chú...',
    noteDeliver: 'Bạn đang bàn giao hồ sơ.', noteClose: 'Bạn đang đóng hồ sơ.',
    btnDeliver: 'Bàn giao', btnClose: 'Đóng hồ sơ', btnCancel: 'Hủy',
    btnSaving: 'Đang lưu...',
    defaultTransitionNote: '{from} → {to}',
    errorForbidden: 'Bạn không có quyền.', errorUnknown: 'Đã xảy ra lỗi.',
    errorTransitionFailed: 'Không thể thực hiện.',
    successTransitioned: 'Đã chuyển sang: {status}!',
  },
  RequestStatus: {
    approved: 'Đã duyệt', delivered: 'Đã bàn giao', closed: 'Đã đóng',
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
const stableT = { DeliveryConsole: makeT('DeliveryConsole'), RequestStatus: makeT('RequestStatus') };
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const approvedReq = {
  id: 'r1', code: 'REQ-001', title: 'Hợp đồng ABC',
  status: 'approved', priority: 'HIGH',
  workspaceName: 'ABC Corp', customerName: 'Nguyễn Văn A',
  specialistName: 'SP 1', reviewerName: 'RV 1',
};

const deliveredReq = {
  id: 'r2', code: 'REQ-002', title: 'Đăng ký nhãn hiệu',
  status: 'delivered', priority: 'MEDIUM',
  workspaceName: 'XYZ Ltd', customerName: 'Trần Thị B',
  specialistName: null, reviewerName: null,
};

describe('DeliveryDialog', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  describe('Whitebox: Structure', () => {
    it('renders title for approved → delivered', () => {
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bàn giao / Đóng hồ sơ')).toBeInTheDocument();
      expect(screen.getByText(/REQ-001/)).toBeInTheDocument();
      expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
      expect(screen.getByText('Đã bàn giao')).toBeInTheDocument();
    });

    it('renders title for delivered → closed', () => {
      render(<DeliveryDialog request={deliveredReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Đã bàn giao')).toBeInTheDocument();
      expect(screen.getByText('Đã đóng')).toBeInTheDocument();
    });

    it('shows confirm button for approved', () => {
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bàn giao')).toBeInTheDocument();
    });

    it('shows confirm button for delivered', () => {
      render(<DeliveryDialog request={deliveredReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Đóng hồ sơ')).toBeInTheDocument();
    });

    it('shows info note for deliver', () => {
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bạn đang bàn giao hồ sơ.')).toBeInTheDocument();
    });

    it('shows info note for close', () => {
      render(<DeliveryDialog request={deliveredReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Bạn đang đóng hồ sơ.')).toBeInTheDocument();
    });
  });

  describe('Blackbox: Interactions', () => {
    it('calls onClose via cancel', () => {
      const onClose = vi.fn();
      render(<DeliveryDialog request={approvedReq} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Hủy'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via close icon', () => {
      const onClose = vi.fn();
      render(<DeliveryDialog request={approvedReq} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByLabelText('Đóng'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via overlay', () => {
      const onClose = vi.fn();
      render(<DeliveryDialog request={approvedReq} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(document.querySelector('.dialog-overlay')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submits deliver transition', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/requests/r1/status', expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('delivered'),
        }));
      });
    });

    it('submits close transition', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });
      render(<DeliveryDialog request={deliveredReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Đóng hồ sơ'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/requests/r2/status', expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('closed'),
        }));
      });
    });

    it('shows saving state', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });

  describe('Abnormal: Note textarea', () => {
    it('updates note value', () => {
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const textarea = screen.getByPlaceholderText('Nhập ghi chú...');
      fireEvent.change(textarea, { target: { value: 'Test' } });
      expect(textarea).toHaveValue('Test');
    });

    it('textarea disabled when saving', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      expect(screen.getByPlaceholderText('Nhập ghi chú...')).toBeDisabled();
      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });

  describe('Error: API failures', () => {
    it('shows error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'INVALID_TRANSITION' }) });
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByText('INVALID_TRANSITION')).toBeInTheDocument(); });
    });

    it('shows forbidden', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'FORBIDDEN' }) });
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByText('Bạn không có quyền.')).toBeInTheDocument(); });
    });

    it('shows network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      render(<DeliveryDialog request={approvedReq} onClose={vi.fn()} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Bàn giao'));
      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });
  });
});
