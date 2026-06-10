import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseListPanel } from '@/app/[locale]/customer/components/CaseListPanel';
import { DeadlinePanel } from '@/app/[locale]/customer/components/DeadlinePanel';
import { DocumentPanel } from '@/app/[locale]/customer/components/DocumentPanel';
import { ActivityTimeline } from '@/app/[locale]/customer/components/ActivityTimeline';
import { FloatingChatButton } from '@/app/[locale]/customer/components/FloatingChatButton';

describe('CaseListPanel Component', () => {
  // WHITEBOX: Unit test for panel rendering
  it('renders case list with badges', () => {
    const cases = [
      { id: '1', code: 'REQ-2026-001', title: 'Test Request', specialistName: 'John', specialistRole: 'Specialist', status: 'review' as const },
      { id: '2', code: 'REQ-2026-002', title: 'Test Request 2', specialistName: 'Jane', specialistRole: 'Reviewer', status: 'pending' as const },
    ];
    render(<CaseListPanel cases={cases} />);
    expect(screen.getByText('REQ-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Test Request')).toBeInTheDocument();
  });

  // ABNORMAL: Empty cases
  it('handles empty cases array', () => {
    render(<CaseListPanel cases={[]} />);
    expect(screen.getByText('Hồ sơ đang xử lý')).toBeInTheDocument();
  });

  // BLACKBOX: Test status badge mapping
  ['review', 'pending', 'approved'].forEach(status => {
    it(`renders ${status} status correctly`, () => {
      const cases = [{ id: '1', code: 'REQ-1', title: 'Test', specialistName: 'User', specialistRole: 'Role', status }];
      render(<CaseListPanel cases={cases} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});

describe('DeadlinePanel Component', () => {
  // WHITEBOX: Test progress bar integration
  it('renders deadlines with progress bars', () => {
    const deadlines = [
      { id: '1', title: 'Deadline 1', timeRemaining: 'Còn 5 giờ', progress: 78, status: 'warn' as const, note: 'Note 1' },
      { id: '2', title: 'Deadline 2', timeRemaining: 'Còn 2 ngày', progress: 42, status: 'ok' as const, note: 'Note 2' },
    ];
    render(<DeadlinePanel deadlines={deadlines} />);
    expect(screen.getByText('Deadline 1')).toBeInTheDocument();
    expect(screen.getByText('Deadline 2')).toBeInTheDocument();
  });

  // ABNORMAL: Empty deadlines
  it('handles empty deadlines', () => {
    render(<DeadlinePanel deadlines={[]} />);
    expect(screen.getByText('Deadline & SLA')).toBeInTheDocument();
  });

  // ERROR: Danger status
  it('renders danger status correctly', () => {
    const deadlines = [{ id: '1', title: 'Overdue', timeRemaining: 'Quá hạn', progress: 100, status: 'danger' as const, note: 'Overdue note' }];
    render(<DeadlinePanel deadlines={deadlines} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});

describe('DocumentPanel Component', () => {
  // WHITEBOX: Test document rendering
  it('renders documents with file icons', () => {
    const documents = [
      { id: '1', filename: 'test.pdf', size: '100 KB', updatedAt: '10/06/2026', status: 'pending' as const },
    ];
    render(<DocumentPanel documents={documents} />);
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  // ABNORMAL: Empty documents
  it('handles empty documents', () => {
    render(<DocumentPanel documents={[]} />);
    expect(screen.getByText('Tài liệu gần đây')).toBeInTheDocument();
  });

  // BLACKBOX: Test file extension display
  it('displays PDF file extension correctly', () => {
    const documents = [{ id: '1', filename: 'contract.pdf', size: '100 KB', updatedAt: '10/06/2026', status: 'pending' as const }];
    render(<DocumentPanel documents={documents} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});

describe('ActivityTimeline Component', () => {
  // WHITEBOX: Test timeline rendering
  it('renders activities with timestamps', () => {
    const activities = [
      { id: '1', title: 'Action 1', description: 'Desc 1', timestamp: '12 phút trước' },
      { id: '2', title: 'Action 2', description: 'Desc 2', timestamp: '2 giờ trước' },
    ];
    render(<ActivityTimeline activities={activities} />);
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('12 phút trước')).toBeInTheDocument();
  });

  // ABNORMAL: Empty timeline
  it('handles empty activities', () => {
    render(<ActivityTimeline activities={[]} />);
    expect(screen.getByText('Hoạt động gần đây')).toBeInTheDocument();
  });
});

describe('FloatingChatButton Component', () => {
  // WHITEBOX: Test notification display
  it('renders with notification count', () => {
    render(<FloatingChatButton notificationCount={5} notificationText="Tin mới" />);
    expect(screen.getByText('5 Tin mới')).toBeInTheDocument();
  });

  // ABNORMAL: Zero notifications
  it('returns null when notification count is zero', () => {
    const { container } = render(<FloatingChatButton notificationCount={0} notificationText="Tin mới" />);
    expect(container.firstChild).toBeNull();
  });

  // WHITEBOX: Test default values
  it('uses default notification text', () => {
    render(<FloatingChatButton notificationCount={1} />);
    expect(screen.getByText('1 Tin mới')).toBeInTheDocument();
  });

  // ERROR: Negative count handled
  it('returns null when notification count is negative', () => {
    const { container } = render(<FloatingChatButton notificationCount={-1} />);
    expect(container.firstChild).toBeNull();
  });
});
