import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AssignmentDialog } from '../AssignmentDialog';

// Stable translator
const AD_TRANSLATIONS: Record<string, Record<string, string>> = {
  AdminTriage: {
    dialogTitle: 'Phân công xử lý', dialogSubtitle: 'HD:{code}', close: 'Đóng',
    labelSpecialist: 'Chuyên viên xử lý', labelReviewer: 'Người kiểm tra (Reviewer)',
    placeholderSelectSpecialist: '-- Chọn chuyên viên --',
    placeholderSelectReviewer: '-- Chọn reviewer (không bắt buộc) --',
    noSpecialistsAvailable: 'Không có chuyên viên nào trong workspace này',
    noReviewersAvailable: 'Không có reviewer nào trong workspace này',
    noteDraftToAssigned: 'Hồ sơ đang ở trạng thái Nháp.',
    noteTriageToAssigned: 'Hồ sơ đã được phân loại.',
    btnCancel: 'Hủy', btnSaving: 'Đang lưu...', btnConfirmAssign: 'Xác nhận gán',
    colTitle: 'Tiêu đề', colCustomer: 'Khách hàng', colWorkspace: 'Workspace',
    colStatus: 'Trạng thái', statusTriage: 'Cần phân loại', statusDraft: 'Nháp',
    errorNoSpecialist: 'Vui lòng chọn chuyên viên xử lý',
    errorAssignFailed: 'Không thể gán chuyên viên',
    errorStatusTransition: 'Lỗi chuyển trạng thái: {detail}',
    errorUnknown: 'Đã xảy ra lỗi không xác định',
    successAssigned: 'Đã phân công thành công!', none: '(không có)',
  },
  RequestWorkflow: { transitionNote: 'Gán specialist: {specialist}, reviewer: {reviewer}' },
};

function makeT(ns: string) {
  const nso = AD_TRANSLATIONS[ns] ?? {};
  return (key: string, params?: Record<string, string>) => {
    const val = nso[key];
    if (!val) return key;
    if (params) return val.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? `{${k}}`);
    return val;
  };
}
const stableT = { AdminTriage: makeT('AdminTriage'), RequestWorkflow: makeT('RequestWorkflow') };

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => stableT[ns as keyof typeof stableT] ?? ((k: string) => k),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockRequest = {
  id: 'req-1', code: 'REQ-2026-001', title: 'Hợp đồng lao động ABC Corp',
  description: 'Cần soạn hợp đồng lao động', workspaceId: 'ws-1',
  workspaceName: 'ABC Corp', status: 'triage', priority: 'HIGH',
  customerName: 'Nguyễn Văn A', customerEmail: 'nguyenvana@example.com',
  matterTypeKey: 'labor_contract',
};

const mockSpecialists = [
  { id: 'sp-1', name: 'Lê Văn S', email: 'levans@example.com', workspaceId: 'ws-1' },
  { id: 'sp-2', name: 'Phạm Thị T', email: 'phamthit@example.com', workspaceId: 'ws-2' },
];
const mockReviewers = [
  { id: 'rv-1', name: 'Reviewer 1', email: 'rv1@example.com', workspaceId: 'ws-1' },
];

describe('AssignmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== WHITEBOX TESTS ====================
  describe('Whitebox: Component structure', () => {
    it('renders dialog title and subtitle', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Phân công xử lý')).toBeInTheDocument();
      expect(screen.getByText('HD:REQ-2026-001')).toBeInTheDocument();
    });

    it('renders request summary', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Hợp đồng lao động ABC Corp')).toBeInTheDocument();
      expect(screen.getByText(/Nguyễn Văn A/)).toBeInTheDocument();
    });

    it('renders specialist select with workspace-filtered options', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const specialistSelect = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      const labels = Array.from(specialistSelect.options).map(o => o.textContent);
      expect(labels).toContain('Lê Văn S (levans@example.com)');
      expect(labels).not.toContain('Phạm Thị T (phamthit@example.com)');
    });

    it('renders reviewer select', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const reviewerSelect = screen.getByText('Người kiểm tra (Reviewer)').nextElementSibling as HTMLSelectElement;
      const labels = Array.from(reviewerSelect.options).map(o => o.textContent);
      expect(labels).toContain('Reviewer 1 (rv1@example.com)');
    });

    it('confirm button disabled without specialist', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Xác nhận gán')).toBeDisabled();
    });

    it('shows triage note for triage status', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Hồ sơ đã được phân loại.')).toBeInTheDocument();
    });

    it('shows draft note for draft_intake', () => {
      render(<AssignmentDialog request={{ ...mockRequest, status: 'draft_intake' }} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Hồ sơ đang ở trạng thái Nháp.')).toBeInTheDocument();
    });
  });

  // ==================== BLACKBOX TESTS ====================
  describe('Blackbox: User interactions', () => {
    it('calls onClose via cancel button', () => {
      const onClose = vi.fn();
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByText('Hủy'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via close icon', () => {
      const onClose = vi.fn();
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(screen.getByLabelText('Đóng'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose via overlay click', () => {
      const onClose = vi.fn();
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(document.querySelector('.dialog-overlay')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT close on container click', () => {
      const onClose = vi.fn();
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={onClose} onSuccess={vi.fn()} />);
      fireEvent.click(document.querySelector('.dialog-container')!);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('enables confirm when specialist selected', () => {
      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      expect(screen.getByText('Xác nhận gán')).not.toBeDisabled();
    });

    it('performs assignment flow successfully', async () => {
      const onSuccess = vi.fn();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'req-1' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={onSuccess} />);

      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Đã phân công thành công!')).toBeInTheDocument();
      });
    });

    it('optional reviewer can be empty', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'req-1' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);

      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/requests/req-1/assign', expect.objectContaining({
          body: expect.stringContaining('"reviewerId":null'),
        }));
      });
    });
  });

  // ==================== ABNORMAL TESTS ====================
  describe('Abnormal: Edge cases', () => {
    it('shows empty specialists/reviewers messages', () => {
      render(<AssignmentDialog request={mockRequest} specialists={[]} reviewers={[]} onClose={vi.fn()} onSuccess={vi.fn()} />);
      expect(screen.getByText('Không có chuyên viên nào trong workspace này')).toBeInTheDocument();
      expect(screen.getByText('Không có reviewer nào trong workspace này')).toBeInTheDocument();
    });
  });

  // ==================== ERROR TESTS ====================
  describe('Error: API failure handling', () => {
    it('shows error on assign failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Specialist not found' }) });

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => { expect(screen.getByText('Specialist not found')).toBeInTheDocument(); });
    });

    it('shows error on status transition 400', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'req-1' }) })
        .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'INVALID_REQUEST_TRANSITION' }) });

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => { expect(screen.getByText(/Lỗi chuyển trạng thái/)).toBeInTheDocument(); });
    });

    it('shows error on status transition 403', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'req-1' }) })
        .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'FORBIDDEN' }) });

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => { expect(screen.getByText('FORBIDDEN')).toBeInTheDocument(); });
    });

    it('shows error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => { expect(screen.getByText('Network error')).toBeInTheDocument(); });
    });

    it('disables controls while saving', async () => {
      let resolvePromise!: (v: unknown) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      mockFetch.mockReturnValueOnce(promise);

      render(<AssignmentDialog request={mockRequest} specialists={mockSpecialists} reviewers={mockReviewers} onClose={vi.fn()} onSuccess={vi.fn()} />);
      const s = screen.getByText('Chuyên viên xử lý').nextElementSibling as HTMLSelectElement;
      fireEvent.change(s, { target: { value: 'sp-1' } });
      fireEvent.click(screen.getByText('Xác nhận gán'));

      await waitFor(() => { expect(screen.getByText('Đang lưu...')).toBeInTheDocument(); });
      expect(screen.getByText('Hủy')).toBeDisabled();
      expect(s).toBeDisabled();

      await act(async () => { resolvePromise({ ok: false, status: 400, json: async () => ({ error: 'ERR' }) }); });
    });
  });
});
