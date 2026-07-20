import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoPanel, { CaseInfo } from './InfoPanel';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

function createCaseInfo(overrides: Partial<CaseInfo> = {}): CaseInfo {
  return {
    caseCode: 'REQ-2026-001 · Hợp đồng',
    slaRemaining: '48h',
    slaDetail: 'Hạn: 22/07/2026',
    documents: 'hop-dong.docx, phu-luc.pdf',
    participants: 'Nguyễn Văn A',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// WHITEBOX
// ═══════════════════════════════════════════════════════════
describe('InfoPanel — Whitebox', () => {
  it('renders visible when isOpen=true', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} isOpen />);
    expect(screen.getByText('REQ-2026-001 · Hợp đồng')).toBeInTheDocument();
  });

  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <InfoPanel caseInfo={createCaseInfo()} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders close button when onClose is provided', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} onClose={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('×');
  });

  it('does not render close button when onClose is omitted', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders SLA section', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} />);
    expect(screen.getByText('slaDeadline')).toBeInTheDocument();
    expect(screen.getByText('48h')).toBeInTheDocument();
    expect(screen.getByText('Hạn: 22/07/2026')).toBeInTheDocument();
  });

  it('renders participants section', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} />);
    expect(screen.getByText('participants')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
  });

  it('renders documents section', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} />);
    expect(screen.getByText('attachedDocuments')).toBeInTheDocument();
    expect(screen.getByText(/hop-dong.docx/)).toBeInTheDocument();
    expect(screen.getByText(/phu-luc.pdf/)).toBeInTheDocument();
  });

  it('renders matter type section when matterType is provided', () => {
    const info = createCaseInfo({ matterType: 'Rà soát hợp đồng' });
    render(<InfoPanel caseInfo={info} />);
    expect(screen.getByText('requestType')).toBeInTheDocument();
    expect(screen.getByText('Rà soát hợp đồng')).toBeInTheDocument();
  });

  it('renders created date section when createdAt is provided', () => {
    const info = createCaseInfo({ createdAt: '20/07/2026' });
    render(<InfoPanel caseInfo={info} />);
    expect(screen.getByText('createdAt')).toBeInTheDocument();
    expect(screen.getByText('20/07/2026')).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    const { container } = render(<InfoPanel caseInfo={createCaseInfo()} />);
    expect(container.querySelector('.info-panel')).toBeInTheDocument();
    expect(container.querySelector('.case-info')).toBeInTheDocument();
    expect(container.querySelector('.sla')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: user interaction
// ═══════════════════════════════════════════════════════════
describe('InfoPanel — Blackbox', () => {
  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<InfoPanel caseInfo={createCaseInfo()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays correct i18n labels', () => {
    render(<InfoPanel caseInfo={createCaseInfo()} />);
    expect(screen.getByText('slaDeadline')).toBeInTheDocument();
    expect(screen.getByText('participants')).toBeInTheDocument();
    expect(screen.getByText('attachedDocuments')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: missing/partial data
// ═══════════════════════════════════════════════════════════
describe('InfoPanel — Abnormal', () => {
  it('renders without crash when documents is empty', () => {
    const info = createCaseInfo({ documents: undefined });
    render(<InfoPanel caseInfo={info} />);
    expect(screen.queryByText('attachedDocuments')).toBeNull();
  });

  it('renders without crash when participants is empty', () => {
    const info = createCaseInfo({ participants: '' });
    render(<InfoPanel caseInfo={info} />);
    // InfoPanel conditionally renders participants: condition is truthy string
    // Empty string '' is falsy so section is hidden — component should not crash
    expect(screen.queryByText('participants')).toBeNull();
  });

  it('renders with minimal caseInfo (only slaRemaining)', () => {
    const info: CaseInfo = { slaRemaining: '12h' };
    render(<InfoPanel caseInfo={info} />);
    expect(screen.getByText('12h')).toBeInTheDocument();
  });

  it('renders empty caseInfo without crash', () => {
    const { container } = render(<InfoPanel caseInfo={{}} />);
    // Should render the panel shell without crash — just the header
    expect(container.querySelector('.info-panel')).toBeInTheDocument();
    expect(container.querySelector('.info-header')).toBeInTheDocument();
  });

  it('handles very long caseCode', () => {
    const info = createCaseInfo({ caseCode: 'A'.repeat(200) });
    render(<InfoPanel caseInfo={info} />);
    expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
  });

  it('splits documents string by comma into multiple items', () => {
    const info = createCaseInfo({ documents: 'a.docx, b.docx, c.docx' });
    render(<InfoPanel caseInfo={info} />);
    const docItems = screen.getAllByText(/docx/);
    expect(docItems).toHaveLength(3);
  });
});
