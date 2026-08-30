/**
 * Task 76-17: Unit tests cho ReviewStep component
 * Test coverage: render summary, edit buttons, submit, validation
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewStep from '../ReviewStep';
import type { WizardState } from '@/lib/types/wizard';

const CREATE_REQUEST_VI: Record<string, string> = {
  'review.confirmAndSubmit': 'Xác nhận & Gửi',
  'review.domainAndService': 'Lĩnh vực & Dịch vụ',
  'review.domainSelected': 'Đã chọn lĩnh vực',
  'review.serviceSelected': 'Đã chọn dịch vụ',
  'review.emailEntered': 'Đã nhập email',
  'review.reviewBeforeSubmit': 'Vui lòng kiểm tra kỹ thông tin trước khi gửi',
  'review.submitting': 'Đang gửi...',
  'review.redirectingToRequests': 'Đang chuyển hướng đến trang yêu cầu...',
  'review.noDocuments': 'Chưa có tài liệu nào',
  'review.details': 'Thông tin chi tiết',
  'label.notSelected': 'Chưa chọn',
  'label.notEntered': 'Chưa nhập',
  'label.priority': 'Mức độ ưu tiên',
  'label.normal': 'Bình thường',
  'label.urgent': 'Khẩn cấp',
  'label.normalSla': 'Xử lý trong 72 giờ',
  'label.urgentSla': 'Xử lý trong 24 giờ',
  'label.contactInfo': 'Thông tin liên hệ',
  'label.email': 'Email',
  'label.phone': 'Số điện thoại',
  'label.companyName': 'Tên công ty',
  'label.taxCode': 'Mã số thuế',
  'label.domain': 'Lĩnh vực',
  'label.service': 'Dịch vụ',
  'button.submit': 'Gửi yêu cầu',
  'button.edit': 'Chỉnh sửa',
  'button.back': 'Quay lại',
  'error.fillAllRequired': 'Vui lòng điền đầy đủ thông tin bắt buộc',
  'error.submitGeneralError': 'Có lỗi xảy ra khi gửi yêu cầu',
  'fileUpload.title': 'Tài liệu đính kèm',
  'fileUpload.noFiles': 'Chưa có file nào được tải lên',
  'message.submitSuccessTitle': 'Yêu cầu đã được gửi!',
  'message.submitSuccessDesc': 'Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.',
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const map: Record<string, string> = ns === 'CreateRequest' ? CREATE_REQUEST_VI : {};
    return (key: string, params?: Record<string, unknown>) => {
      const val = map[key] ?? key;
      if (params) return val.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
      return val;
    };
  },
}));

describe('ReviewStep', () => {
  const mockState: WizardState = {
    step: 5,
    domainId: 'commercial-legal',
    serviceType: 'agency_contract',
    answers: {
      partner_name: 'ABC Partner',
      commission_rate: '10%',
      contract_term: '12 months',
    },
    files: [
      { vaultFileId: 'f1', filename: 'contract.pdf', size: 1024 * 1024 },
    ],
    priority: 'normal',
    contactInfo: {
      email: 'test@example.com',
      phone: '+84987654321',
      companyName: 'Test Company',
    },
    draftId: 'draft-123',
    isDirty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Whitebox tests
  describe('rendering', () => {
    it('renders review summary heading', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Xác nhận & Gửi')).toBeInTheDocument();
    });

    it('renders selected domain and service', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Thương mại')).toBeInTheDocument();
      expect(screen.getByText('Soạn hợp đồng đại lý')).toBeInTheDocument();
    });

    it('renders user answers', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('ABC Partner')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('renders uploaded files', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
    });

    it('renders priority selection', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Bình thường')).toBeInTheDocument();
      expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();
    });

    it('renders contact info section', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Thông tin liên hệ')).toBeInTheDocument();
      const emailInputs = screen.getAllByDisplayValue('test@example.com');
      expect(emailInputs.length).toBeGreaterThan(0);
    });

    it('renders edit buttons for each section', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      const editButtons = screen.getAllByText('Chỉnh sửa');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('renders submit button', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Gửi yêu cầu' })).toBeInTheDocument();
    });
  });

  // Blackbox tests
  describe('interaction', () => {
    it('calls onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();
      render(<ReviewStep state={mockState} onEdit={onEdit} onSubmit={vi.fn()} />);

      const editButtons = screen.getAllByText('Chỉnh sửa');
      fireEvent.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalled();
    });

    it('calls onEdit(3) when the service details edit button is clicked', () => {
      const onEdit = vi.fn();
      render(<ReviewStep state={mockState} onEdit={onEdit} onSubmit={vi.fn()} />);

      // Second "Chỉnh sửa" button is the service-details one (line 119).
      const editButtons = screen.getAllByText('Chỉnh sửa');
      fireEvent.click(editButtons[1]);
      expect(onEdit).toHaveBeenCalledWith(3);
    });

    it('calls onEdit(4) when the file-upload edit button is clicked', () => {
      const onEdit = vi.fn();
      render(<ReviewStep state={mockState} onEdit={onEdit} onSubmit={vi.fn()} />);

      // Third "Chỉnh sửa" button is the file-upload one (line 146).
      const editButtons = screen.getAllByText('Chỉnh sửa');
      fireEvent.click(editButtons[2]);
      expect(onEdit).toHaveBeenCalledWith(4);
    });

    it('calls onSubmit when submit button is clicked', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state while submitting', async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Đang gửi...')).toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', () => {
      const invalidState: WizardState = {
        ...mockState,
        domainId: null,
      };
      render(<ReviewStep state={invalidState} onEdit={vi.fn()} onSubmit={vi.fn()} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      expect(submitButton).toBeDisabled();
    });

    it('highlights selected priority', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);

      const normalPriority = screen.getByText('Bình thường').closest('label');
      expect(normalPriority).toHaveClass('selected');
    });

    it('shows validation checklist', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Đã chọn lĩnh vực')).toBeInTheDocument();
      expect(screen.getByText('Đã chọn dịch vụ')).toBeInTheDocument();
      expect(screen.getByText('Đã nhập email')).toBeInTheDocument();
    });

    it('redirects to the dashboard (not /cases) after successful submit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let assignedUrl = '';
      // jsdom's window.location.href is not assignable; swap in a stub object
      // whose href is an accessor so the component's redirect assignment is
      // captured without navigating.
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: Object.defineProperty({} as Location, 'href', {
          configurable: true,
          set: (v: string) => {
            assignedUrl = v;
          },
          get: () => assignedUrl || 'http://localhost/vi/review',
        }),
      });

      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // Advance the 2000ms redirect timer.
      await new Promise((r) => setTimeout(r, 2100));
      expect(assignedUrl).toBe('/vi/dashboard');
      expect(assignedUrl).not.toContain('/cases');
    });
  });

  // Abnormal tests
  describe('edge cases', () => {
    it('handles empty answers', () => {
      const emptyState: WizardState = {
        ...mockState,
        answers: {},
      };
      render(<ReviewStep state={emptyState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      const notEnteredItems = screen.getAllByText('Chưa nhập');
      expect(notEnteredItems.length).toBeGreaterThan(0);
    });

    it('handles no files uploaded', () => {
      const noFilesState: WizardState = {
        ...mockState,
        files: [],
      };
      render(<ReviewStep state={noFilesState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Chưa có tài liệu nào')).toBeInTheDocument();
    });

    it('handles missing domain gracefully', () => {
      const noDomainState: WizardState = {
        ...mockState,
        domainId: null,
      };
      render(<ReviewStep state={noDomainState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      const notSelectedItems = screen.getAllByText('Chưa chọn');
      expect(notSelectedItems.length).toBeGreaterThan(0);
    });

    it('handles missing service gracefully', () => {
      const noServiceState: WizardState = {
        ...mockState,
        serviceType: null,
      };
      render(<ReviewStep state={noServiceState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getAllByText('Chưa chọn').length).toBeGreaterThan(0);
    });
  });

  // Error tests
  describe('error handling', () => {
    it('displays error message when submission fails', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows retry button after error', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Failed'));
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Error text shown
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
      // Retry button is "Quay lại" (button.back)
      expect(screen.getByText('Quay lại')).toBeInTheDocument();
    });

    it('clears error when retry button is clicked', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Failed'));
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Quay lại'));

      await waitFor(() => {
        expect(screen.queryByText('Failed')).not.toBeInTheDocument();
      });
    });
  });
});
