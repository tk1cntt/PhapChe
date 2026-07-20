import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadItem, ThreadData } from './ThreadItem';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

function createThread(overrides: Partial<ThreadData> = {}): ThreadData {
  return {
    id: 'thread-1',
    requestCode: 'REQ-2026-001',
    title: 'Hợp đồng thuê văn phòng',
    preview: 'Cần rà soát điều khoản bảo hiểm...',
    senderInitials: 'NA',
    senderColor: 'blue',
    timestamp: '2h',
    isActive: false,
    isRead: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// WHITEBOX: component structure, props, states
// ═══════════════════════════════════════════════════════════
describe('ThreadItem — Whitebox', () => {
  it('renders all required elements (avatar, code, title, preview, timestamp)', () => {
    const thread = createThread();
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);

    // REQ-2026-001 · Hợp đồng thuê văn phòng — combined in <strong>
    expect(screen.getByText(/REQ-2026-001/)).toBeInTheDocument();
    expect(screen.getByText(/Hợp đồng thuê văn phòng/)).toBeInTheDocument();
    expect(screen.getByText('Cần rà soát điều khoản bảo hiểm...')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('NA')).toBeInTheDocument(); // avatar initials
  });

  it('applies active class when isActive=true', () => {
    const thread = createThread({ isActive: true });
    const { container } = render(
      <ThreadItem thread={thread} isActive={true} onClick={vi.fn()} />
    );
    const threadEl = container.querySelector('.thread');
    expect(threadEl).toHaveClass('active');
  });

  it('does not have active class when isActive=false', () => {
    const thread = createThread({ isActive: false });
    const { container } = render(
      <ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />
    );
    const threadEl = container.querySelector('.thread');
    expect(threadEl).not.toHaveClass('active');
  });

  it('renders without requestCode prefix when undefined', () => {
    const thread = createThread({ requestCode: '' });
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    expect(screen.queryByText(/REQ/)).not.toBeInTheDocument();
    // title + preview still render
    expect(screen.getByText('Hợp đồng thuê văn phòng')).toBeInTheDocument();
    expect(screen.getByText('Cần rà soát điều khoản bảo hiểm...')).toBeInTheDocument();
  });

  it('has role=button and tabIndex=0 for accessibility', () => {
    const thread = createThread();
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    const el = screen.getByRole('button');
    expect(el).toHaveAttribute('tabIndex', '0');
  });

  it('applies avatar background color from senderColor prop', () => {
    const thread = createThread({ senderColor: 'purple' });
    const { container } = render(
      <ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />
    );
    const avatar = container.querySelector('.thread-avatar');
    expect(avatar).not.toBeNull();
    // getComputedStyle handles inline style correctly in jsdom
    expect(avatar!.getAttribute('style')).toContain('background-color: purple');
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: user interactions
// ═══════════════════════════════════════════════════════════
describe('ThreadItem — Blackbox', () => {
  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    const thread = createThread();
    render(<ThreadItem thread={thread} isActive={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick on Enter key press', () => {
    const onClick = vi.fn();
    const thread = createThread();
    render(<ThreadItem thread={thread} isActive={false} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick on Space key press', () => {
    const onClick = vi.fn();
    const thread = createThread();
    render(<ThreadItem thread={thread} isActive={false} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick on unrelated key press (e.g., Tab)', () => {
    const onClick = vi.fn();
    const thread = createThread();
    render(<ThreadItem thread={thread} isActive={false} onClick={onClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: edge cases, unusual data
// ═══════════════════════════════════════════════════════════
describe('ThreadItem — Abnormal', () => {
  it('handles very long title (truncated by CSS ellipsis)', () => {
    const thread = createThread({
      title: 'A'.repeat(500),
    });
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    // REQ-2026-001 · AAAAA... — combined in <strong>
    expect(screen.getByText(/REQ-2026-001/)).toBeInTheDocument();
    expect(screen.getByText(/A{50}/)).toBeInTheDocument();
  });

  it('handles very long preview (truncated by CSS line-clamp)', () => {
    const thread = createThread({
      preview: 'B'.repeat(1000),
    });
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    expect(screen.getByText(/^B{1000}$/)).toBeInTheDocument();
  });

  it('handles empty preview string', () => {
    const thread = createThread({ preview: '' });
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    // preview <p> will be empty but component should not crash
    const p = screen.getByText(/REQ-2026-001/);
    expect(p).toBeInTheDocument();
  });

  it('handles special characters in title', () => {
    const thread = createThread({ title: '<script>alert("xss")</script>' });
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    // React escapes by default — combined with code in <strong>
    const codeEl = screen.getByText(/REQ-2026-001/);
    expect(codeEl).toBeInTheDocument();
    expect(codeEl.parentElement?.textContent).toContain('<script>alert("xss")</script>');
  });

  it('handles unicode/emoji in title and preview', () => {
    const thread = createThread({
      title: 'Hợp đồng 📄✨ kiểm tra',
      preview: 'Nội dung 🚀 quan trọng ⚠️',
    });
    render(<ThreadItem thread={thread} isActive={false} onClick={vi.fn()} />);
    // code and title combined in <strong>
    const strong = screen.getByText(/REQ-2026-001/).parentElement;
    expect(strong?.textContent).toContain('Hợp đồng 📄✨ kiểm tra');
    expect(screen.getByText('Nội dung 🚀 quan trọng ⚠️')).toBeInTheDocument();
  });
});
