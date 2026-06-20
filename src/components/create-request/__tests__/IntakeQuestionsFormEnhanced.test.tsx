/**
 * Task 76-17: Unit tests cho IntakeQuestionsFormEnhanced component
 * Test coverage: render questions, validation, error display, user input
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntakeQuestionsFormEnhanced, { validateQuestionsForm } from '../IntakeQuestionsFormEnhanced';
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-legal-domains';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('IntakeQuestionsFormEnhanced', () => {
  // Whitebox tests - test implementation details
  describe('rendering', () => {
    it('renders questions for service type', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      // agency_contract has questions about partner_name, commission_rate, etc.
      expect(screen.getByText(/Thông tin chi tiết/i)).toBeInTheDocument();
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('renders service description', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      const serviceType = SEED_MATTER_TYPES['agency_contract'];
      expect(screen.getByText(serviceType.description.vi)).toBeInTheDocument();
    });

    it('renders required field indicators', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('renders textarea for long text fields', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      // agency_contract has special_terms as textarea
      const textarea = screen.getByPlaceholderText(/yêu cầu đặc biệt/i);
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders all question labels', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      expect(screen.getByText(/Tên đối tác đại lý/i)).toBeInTheDocument();
      expect(screen.getByText(/Tỷ lệ hoa hồng/i)).toBeInTheDocument();
      expect(screen.getByText(/Yêu cầu đặc biệt/i)).toBeInTheDocument();
    });
  });

  // Blackbox tests - test behavior
  describe('user input handling', () => {
    it('calls onAnswerChange when input value changes', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      const partnerNameInput = screen.getByPlaceholderText(/tên đối tác/i);
      fireEvent.change(partnerNameInput, { target: { value: 'Test Partner' } });

      expect(onAnswerChange).toHaveBeenCalledWith('partner_name', 'Test Partner');
    });

    it('displays existing answers in inputs', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{ partner_name: 'Existing Partner' }}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      const partnerNameInput = screen.getByPlaceholderText(/tên đối tác/i);
      expect(partnerNameInput).toHaveValue('Existing Partner');
    });

    it('displays errors after field is touched', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{ partner_name: 'Trường này là bắt buộc' }}
        />
      );

      const partnerNameInput = screen.getByPlaceholderText(/tên đối tác/i);
      fireEvent.blur(partnerNameInput);

      expect(screen.getByText('Trường này là bắt buộc')).toBeInTheDocument();
    });

    it('does not display errors before field is touched', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{ partner_name: 'Trường này là bắt buộc' }}
        />
      );

      expect(screen.queryByText('Trường này là bắt buộc')).not.toBeInTheDocument();
    });

    it('marks field as touched on blur', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{ partner_name: 'Required' }}
        />
      );

      const partnerNameInput = screen.getByPlaceholderText(/tên đối tác/i);
      fireEvent.blur(partnerNameInput);

      // After blur, error should be shown
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  // Abnormal tests - edge cases
  describe('edge cases', () => {
    it('handles service type with questions', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="unsupported"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      // unsupported service has questions
      expect(screen.getByText(/Tóm tắt nhu cầu hỗ trợ/i)).toBeInTheDocument();
    });

    it('handles empty answers object', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="agency_contract"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      // Check specific fields are empty
      const partnerInput = screen.getByPlaceholderText(/tên đối tác/i);
      const commissionInput = screen.getByPlaceholderText(/hoa hồng/i);
      expect(partnerInput).toHaveValue('');
      expect(commissionInput).toHaveValue('');
    });

    it('handles invalid service type gracefully', () => {
      const onAnswerChange = vi.fn();
      render(
        <IntakeQuestionsFormEnhanced
          serviceType="invalid_service"
          answers={{}}
          onAnswerChange={onAnswerChange}
          errors={{}}
        />
      );

      // Invalid service type returns empty questions array
      expect(screen.getByText(/Không có câu hỏi/i)).toBeInTheDocument();
    });
  });

  // Error tests - validation
  describe('validation', () => {
    it('validates required fields', () => {
      const errors = validateQuestionsForm('agency_contract', {});
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.partner_name).toBe('Trường này là bắt buộc');
    });

    it('validates all required fields', () => {
      const errors = validateQuestionsForm('agency_contract', {
        partner_name: 'Test',
      });
      // commission_rate and contract_term are also required
      expect(errors.commission_rate).toBe('Trường này là bắt buộc');
      expect(errors.contract_term).toBe('Trường này là bắt buộc');
    });

    it('passes validation when all required fields are filled', () => {
      const errors = validateQuestionsForm('agency_contract', {
        partner_name: 'Test Partner',
        commission_rate: '10%',
        contract_term: '12 months',
      });
      expect(Object.keys(errors).length).toBe(0);
    });

    it('accepts optional fields as empty', () => {
      const errors = validateQuestionsForm('agency_contract', {
        partner_name: 'Test Partner',
        commission_rate: '10%',
        contract_term: '12 months',
        special_terms: '',
      });
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
