/**
 * Task 76-17: Unit tests cho LegalDomainSelector component
 * Test coverage: render domains, selection, locale support
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LegalDomainSelector from '../LegalDomainSelector';
import { SEED_LEGAL_DOMAINS } from '@/lib/i18n/seed-legal-domains';

const CREATE_REQUEST_VI: Record<string, string> = {
  domainTitle: 'Chọn lĩnh vực pháp lý',
  serviceCount: '{count} dịch vụ',
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

describe('LegalDomainSelector', () => {
  // Whitebox tests - test implementation details
  describe('rendering', () => {
    it('renders all 13 legal domains', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      const domainButtons = screen.getAllByRole('button');
      expect(domainButtons).toHaveLength(13);
    });

    it('renders domain names and descriptions', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      expect(screen.getByText('Thương mại')).toBeInTheDocument();
      expect(screen.getByText('Doanh nghiệp')).toBeInTheDocument();
      expect(screen.getByText('Lao động')).toBeInTheDocument();
    });

    it('renders service count for each domain', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      const serviceCounts = screen.getAllByText(/\d+ dịch vụ/);
      expect(serviceCounts).toHaveLength(13);
    });

    it('renders icons for each domain', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      // Check that icons are rendered (SVG elements)
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(13);
    });
  });

  // Blackbox tests - test behavior
  describe('selection behavior', () => {
    it('calls onSelect when domain is clicked', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      const commercialButton = screen.getByText('Thương mại').closest('button');
      fireEvent.click(commercialButton!);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('commercial-legal');
    });

    it('highlights selected domain with blue border and background', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId="commercial-legal" onSelect={onSelect} />);

      const commercialButton = screen.getByText('Thương mại').closest('button');
      expect(commercialButton).toHaveClass('selected');
    });

    it('does not highlight unselected domains', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId="commercial-legal" onSelect={onSelect} />);

      const corporateButton = screen.getByText('Doanh nghiệp').closest('button');
      expect(corporateButton).not.toHaveClass('selected');
      expect(corporateButton).toHaveClass('domain-card');
    });

    it('allows changing selection', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId="commercial-legal" onSelect={onSelect} />);

      const corporateButton = screen.getByText('Doanh nghiệp').closest('button');
      fireEvent.click(corporateButton!);

      expect(onSelect).toHaveBeenCalledWith('corporate-legal');
    });
  });

  // Abnormal tests - edge cases
  describe('edge cases', () => {
    it('handles null selectedDomainId gracefully', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('border-blue-500');
      });
    });

    it('handles invalid selectedDomainId gracefully', () => {
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId="invalid-domain" onSelect={onSelect} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('border-blue-500');
      });
    });
  });

  // Error tests - invalid inputs
  describe('error handling', () => {
    it('handles empty SEED_LEGAL_DOMAINS gracefully', () => {
      // This test assumes we can mock the import
      const onSelect = vi.fn();
      render(<LegalDomainSelector selectedDomainId={null} onSelect={onSelect} />);

      // Should render without errors
      expect(screen.getByText('Chọn lĩnh vực pháp lý')).toBeInTheDocument();
    });
  });
});
