/**
 * Task 76-17: Unit tests cho ReviewStep component
 * Test coverage: render summary, edit buttons, submit, validation
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewStep from '../ReviewStep';
import type { WizardState } from '@/lib/types/wizard';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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

      const normalPriority = screen.getByText('Bình thường').closest('div');
      expect(normalPriority).toHaveClass('border-blue-500');
      expect(normalPriority).toHaveClass('bg-blue-50');
    });

    it('shows validation checklist', () => {
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={vi.fn()} />);
      expect(screen.getByText('Đã chọn lĩnh vực')).toBeInTheDocument();
      expect(screen.getByText('Đã chọn dịch vụ')).toBeInTheDocument();
      expect(screen.getByText('Đã nhập email')).toBeInTheDocument();
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
        expect(screen.getByText('Thử lại')).toBeInTheDocument();
      });
    });

    it('clears error when retry button is clicked', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Failed'));
      render(<ReviewStep state={mockState} onEdit={vi.fn()} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Thử lại')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Thử lại'));

      await waitFor(() => {
        expect(screen.queryByText('Failed')).not.toBeInTheDocument();
      });
    });
  });
});
