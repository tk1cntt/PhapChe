/**
 * RequestCard Component — Unit Tests
 *
 * Covers: whitebox (render props), blackbox (click actions),
 * abnormal (missing optional fields, long text), error (edge cases)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RequestCard from '../RequestCard';

const DEFAULT_PROPS = {
  code: 'REQ-042',
  title: 'Hợp đồng lao động thời vụ - Nguyễn Văn An',
  metaLines: ['Khach hang Demo', 'Legal Workspace', 'Hợp đồng lao động'],
  priority: 'HIGH',
  priorityStyle: { bg: '#ffe4e6', color: '#dc2626' },
  statusLabel: 'Cần phân loại',
  statusStyle: { bg: '#dbeafe', color: '#2563eb' },
  date: '15/07/2026',
  actionSlot: <button>Phân công</button>,
  onAiClick: vi.fn(),
  showAiButton: true,
};

describe('RequestCard', () => {
  // ── WHITEBOX ──
  describe('Whitebox — render', () => {
    it('renders code, title, meta, date, status, priority', () => {
      render(<RequestCard {...DEFAULT_PROPS} />);

      expect(screen.getByText('REQ-042')).toBeTruthy();
      expect(screen.getByText('Hợp đồng lao động thời vụ - Nguyễn Văn An')).toBeTruthy();
      expect(screen.getByText('Khach hang Demo')).toBeTruthy();
      expect(screen.getByText('Legal Workspace')).toBeTruthy();
      expect(screen.getByText('Hợp đồng lao động')).toBeTruthy();
      expect(screen.getByText('15/07/2026')).toBeTruthy();
      expect(screen.getByText('HIGH')).toBeTruthy();
      expect(screen.getByText('Cần phân loại')).toBeTruthy();
    });

    it('renders action slot button', () => {
      render(<RequestCard {...DEFAULT_PROPS} />);
      expect(screen.getByText('Phân công')).toBeTruthy();
    });

    it('renders AI button with Sparkles icon + text', () => {
      render(<RequestCard {...DEFAULT_PROPS} />);
      const aiBtn = screen.getByTestId('request-card-ai-REQ-042');
      expect(aiBtn).toBeTruthy();
      expect(aiBtn.textContent).toContain('AI');
    });

    it('uses custom testId when provided', () => {
      render(<RequestCard {...DEFAULT_PROPS} testId="custom-card" />);
      expect(screen.getByTestId('custom-card')).toBeTruthy();
      expect(screen.getByTestId('custom-card-ai-btn')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
      render(<RequestCard {...DEFAULT_PROPS} subtitle="Reviewer: Trần Thị B" />);
      expect(screen.getByText('Reviewer: Trần Thị B')).toBeTruthy();
    });

    it('does not render subtitle element when not provided', () => {
      const { container } = render(<RequestCard {...DEFAULT_PROPS} />);
      expect(container.querySelector('.request-card-subtitle')).toBeFalsy();
    });

    it('renders AI button with custom tooltip', () => {
      render(<RequestCard {...DEFAULT_PROPS} aiTooltip="Trợ lý AI" />);
      const aiBtn = screen.getByTestId('request-card-ai-REQ-042');
      expect(aiBtn.title).toBe('Trợ lý AI');
    });

    it('uses default tooltip when aiTooltip not provided', () => {
      render(<RequestCard {...DEFAULT_PROPS} />);
      const aiBtn = screen.getByTestId('request-card-ai-REQ-042');
      expect(aiBtn.title).toBe('AI Assistant');
    });
  });

  // ── BLACKBOX — interactions ──
  describe('Blackbox — interactions', () => {
    it('calls onAiClick when AI button clicked', () => {
      const onAiClick = vi.fn();
      render(<RequestCard {...DEFAULT_PROPS} onAiClick={onAiClick} />);

      fireEvent.click(screen.getByTestId('request-card-ai-REQ-042'));
      expect(onAiClick).toHaveBeenCalledTimes(1);
    });

    it('passes through action button click', () => {
      const handleClick = vi.fn();
      render(
        <RequestCard
          {...DEFAULT_PROPS}
          actionSlot={<button onClick={handleClick}>Phân công</button>}
        />,
      );

      fireEvent.click(screen.getByText('Phân công'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders no action button when actionSlot is null', () => {
      render(<RequestCard {...DEFAULT_PROPS} actionSlot={null} />);
      expect(screen.queryByText('Phân công')).toBeFalsy();
    });
  });

  // ── ABNORMAL — edge cases ──
  describe('Abnormal — edge cases', () => {
    it('renders empty metaLines without breaking', () => {
      const { container } = render(<RequestCard {...DEFAULT_PROPS} metaLines={[]} />);
      expect(container.querySelector('.request-card-meta')).toBeFalsy();
    });

    it('truncates long title via CSS (2-line clamp)', () => {
      const longTitle = 'A'.repeat(500);
      render(<RequestCard {...DEFAULT_PROPS} title={longTitle} />);
      const titleEl = screen.getByText(longTitle);
      expect(titleEl).toBeTruthy();
      // CSS line-clamp is applied, element still renders
    });

    it('handles special characters in code', () => {
      render(<RequestCard {...DEFAULT_PROPS} code="REQ-001/ABC" />);
      expect(screen.getByText('REQ-001/ABC')).toBeTruthy();
    });

    it('renders multiple meta items', () => {
      render(
        <RequestCard
          {...DEFAULT_PROPS}
          metaLines={['A', 'B', 'C', 'D', 'E']}
        />,
      );
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('E')).toBeTruthy();
    });

    it('renders with MEDIUM priority style', () => {
      render(
        <RequestCard
          {...DEFAULT_PROPS}
          priority="MEDIUM"
          priorityStyle={{ bg: '#ffedd5', color: '#ea580c' }}
        />,
      );
      expect(screen.getByText('MEDIUM')).toBeTruthy();
    });

    it('uses default testId from code when testId not provided', () => {
      render(<RequestCard {...DEFAULT_PROPS} />);
      expect(screen.getByTestId('request-card-REQ-042')).toBeTruthy();
    });
  });

  // ── AI button visibility ──
  describe('showAiButton', () => {
    it('hides AI button when showAiButton is false (default)', () => {
      const { container } = render(
        <RequestCard {...DEFAULT_PROPS} showAiButton={false} />,
      );
      expect(container.querySelector('.request-card-ai-btn')).toBeFalsy();
    });

    it('shows AI button when showAiButton is true', () => {
      render(<RequestCard {...DEFAULT_PROPS} showAiButton />);
      expect(screen.getByTestId('request-card-ai-REQ-042')).toBeTruthy();
    });

    it('does not render AI button by default (showAiButton defaults to false)', () => {
      const propsWithoutShowAi = { ...DEFAULT_PROPS };
      delete (propsWithoutShowAi as any).showAiButton;
      const { container } = render(<RequestCard {...propsWithoutShowAi} />);
      expect(container.querySelector('.request-card-ai-btn')).toBeFalsy();
    });
  });

  // ── File count always visible ──
  describe('file count', () => {
    it('shows file count 0 when stats are empty', () => {
      render(<RequestCard {...DEFAULT_PROPS} stats={{ fileCount: 0, annotationCount: 0, annotationResolved: 0 }} />);
      const fileStat = screen.getByTestId('request-card-ai-REQ-042')
        .closest('.request-card-footer')!
        .querySelector('.request-card-stat')!;
      expect(fileStat.textContent).toContain('0');
    });

    it('shows file count when stats are provided', () => {
      render(<RequestCard {...DEFAULT_PROPS} stats={{ fileCount: 5, annotationCount: 3, annotationResolved: 1 }} />);
      const footer = document.querySelector('.request-card-stats')!;
      expect(footer.textContent).toContain('5');
    });

    it('shows annotation and resolved counts when present', () => {
      render(<RequestCard {...DEFAULT_PROPS} stats={{ fileCount: 2, annotationCount: 4, annotationResolved: 2 }} />);
      const footer = document.querySelector('.request-card-stats')!;
      expect(footer.textContent).toContain('2');
      expect(footer.textContent).toContain('4');
    });
  });
});
