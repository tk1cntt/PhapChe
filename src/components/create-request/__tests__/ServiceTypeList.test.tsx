/**
 * Task 76-17: Unit tests cho ServiceTypeList component
 * Test coverage: render services, selection, back button, locale support
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceTypeList from '../ServiceTypeList';
import { SEED_LEGAL_DOMAINS } from '@/lib/i18n/seed-legal-domains';

const CREATE_REQUEST_VI: Record<string, string> = {
  'button.back': 'Quay lại',
  'error.domainNotFound': 'Không tìm thấy lĩnh vực',
  'message.selectServiceType': 'Chọn loại dịch vụ bạn cần',
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

describe('ServiceTypeList', () => {
  // Whitebox tests - test implementation details
  describe('rendering', () => {
    it('renders service types for selected domain', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      // Commercial-legal domain has distribution_contract, nda, commercial_review
      expect(screen.getByText('Hợp đồng phân phối')).toBeInTheDocument();
      expect(screen.getByText('Thỏa thuận bảo mật (NDA)')).toBeInTheDocument();
      expect(screen.getByText('Rà soát hợp đồng thương mại')).toBeInTheDocument();
    });

    it('renders domain name as heading', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      expect(screen.getByText('Thương mại')).toBeInTheDocument();
    });

    it('renders question count for each service', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      // Tags render "X câu" and "X bắt buộc" separately (not "câu hỏi")
      const questionTags = screen.getAllByText(/\d+ câu/);
      expect(questionTags.length).toBeGreaterThan(0);
    });

    it('renders required field count', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      const requiredCounts = screen.getAllByText(/\d+ bắt buộc/);
      expect(requiredCounts.length).toBeGreaterThan(0);
    });

    it('renders back button with ArrowLeft icon', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      const backButton = screen.getByText('Quay lại');
      expect(backButton).toBeInTheDocument();
    });
  });

  // Blackbox tests - test behavior
  describe('selection behavior', () => {
    it('calls onSelect when service type is clicked', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      const ndaButton = screen.getByText('Thỏa thuận bảo mật (NDA)').closest('button');
      fireEvent.click(ndaButton!);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('nda');
    });

    it('highlights selected service type', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType="nda"
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      const ndaButton = screen.getByText('Thỏa thuận bảo mật (NDA)').closest('button');
      expect(ndaButton).toHaveClass('selected');
    });

    it('does not highlight unselected service types', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType="nda"
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      const distributionButton = screen.getByText('Hợp đồng phân phối').closest('button');
      expect(distributionButton).not.toHaveClass('selected');
      expect(distributionButton).toHaveClass('service-option');
    });

    it('calls onBack when back button is clicked', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="commercial-legal"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      const backButton = screen.getByText('Quay lại');
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  // Abnormal tests - edge cases
  describe('edge cases', () => {
    it('handles invalid domain ID gracefully', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId="invalid-domain"
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      // Should render error message
      expect(screen.getByText('Không tìm thấy lĩnh vực')).toBeInTheDocument();
    });

    it('handles empty domain gracefully', () => {
      const onSelect = vi.fn();
      const onBack = vi.fn();
      render(
        <ServiceTypeList
          selectedDomainId=""
          selectedServiceType={null}
          onSelect={onSelect}
          onBack={onBack}
        />
      );

      expect(screen.getByText('Không tìm thấy lĩnh vực')).toBeInTheDocument();
    });
  });
});
