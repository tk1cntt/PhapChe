import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble, { MessageData } from './MessageBubble';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

function createMessage(overrides: Partial<MessageData> = {}): MessageData {
  return {
    id: 'msg-1',
    content: 'Xin chào, tôi cần tư vấn về hợp đồng',
    senderId: 'user-1',
    senderName: 'Nguyễn Văn A',
    isOutgoing: false,
    createdAt: new Date('2026-07-20T10:00:00Z'),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// WHITEBOX: component structure, states
// ═══════════════════════════════════════════════════════════
describe('MessageBubble — Whitebox', () => {
  it('renders outgoing message with .msg.out class', () => {
    const msg = createMessage({ isOutgoing: true });
    const { container } = render(
      <MessageBubble message={msg} currentUserId="user-1" />
    );
    const bubble = container.querySelector('.msg');
    expect(bubble).toHaveClass('out');
    expect(bubble).not.toHaveClass('in');
  });

  it('renders incoming message with .msg.in class', () => {
    const msg = createMessage({ senderId: 'user-x' });
    const { container } = render(
      <MessageBubble message={msg} currentUserId="user-1" />
    );
    const bubble = container.querySelector('.msg');
    expect(bubble).toHaveClass('in');
    expect(bubble).not.toHaveClass('out');
  });

  it('shows sender name for incoming messages', () => {
    const msg = createMessage({ senderId: 'user-x', senderName: 'Chuyên viên B' });
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    expect(screen.getByText('Chuyên viên B')).toBeInTheDocument();
  });

  it('does not show sender name for outgoing messages', () => {
    const msg = createMessage({ isOutgoing: true, senderName: 'Tôi' });
    const { container } = render(
      <MessageBubble message={msg} currentUserId="user-1" />
    );
    expect(container.querySelector('.msg-sender-name')).toBeNull();
  });

  it('renders message content text', () => {
    const msg = createMessage();
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    expect(screen.getByText('Xin chào, tôi cần tư vấn về hợp đồng')).toBeInTheDocument();
  });

  it('determines isOutgoing by matching senderId === currentUserId', () => {
    const msg = createMessage({ senderId: 'user-x', isOutgoing: false });
    const { container } = render(
      <MessageBubble message={msg} currentUserId="user-x" />
    );
    // should be treated as outgoing even though isOutgoing=false in data
    const bubble = container.querySelector('.msg');
    expect(bubble).toHaveClass('out');
  });

  it('falls back to unknownSender translation when senderName is empty', () => {
    const msg = createMessage({ senderId: 'user-x', senderName: '' });
    render(<MessageBubble message={msg} currentUserId="user-2" />);
    expect(screen.getByText('unknownSender')).toBeInTheDocument();
  });

  it('applies deterministic color based on senderId', () => {
    const msg1 = createMessage({ senderId: 'user-a' });
    const msg2 = createMessage({ senderId: 'user-a' });
    const { container: c1 } = render(
      <MessageBubble message={msg1} currentUserId="user-b" />
    );
    const { container: c2 } = render(
      <MessageBubble message={msg2} currentUserId="user-b" />
    );
    const bg1 = (c1.querySelector('.msg.in') as HTMLElement)?.style.backgroundColor;
    const bg2 = (c2.querySelector('.msg.in') as HTMLElement)?.style.backgroundColor;
    expect(bg1).toBe(bg2); // Same sender = same color
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: visual rendering for user
// ═══════════════════════════════════════════════════════════
describe('MessageBubble — Blackbox', () => {
  it('outgoing message content is visible', () => {
    const msg = createMessage({ isOutgoing: true });
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    expect(screen.getByText('Xin chào, tôi cần tư vấn về hợp đồng')).toBeInTheDocument();
  });

  it('incoming message shows both sender name and content', () => {
    const msg = createMessage({ senderName: 'Luật sư X', content: 'Đã nhận hồ sơ' });
    render(<MessageBubble message={msg} currentUserId="user-2" />);
    expect(screen.getByText('Luật sư X')).toBeInTheDocument();
    expect(screen.getByText('Đã nhận hồ sơ')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: edge cases
// ═══════════════════════════════════════════════════════════
describe('MessageBubble — Abnormal', () => {
  it('handles empty content gracefully', () => {
    const msg = createMessage({ senderId: 'user-x', content: '' });
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    // Should render without crashing; msg-content div will be empty
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
  });

  it('handles very long content text', () => {
    const msg = createMessage({ content: 'A'.repeat(10000) });
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    expect(screen.getByText('A'.repeat(10000))).toBeInTheDocument();
  });

  it('handles HTML-like content (renders as text, not HTML)', () => {
    const msg = createMessage({ content: '<script>alert("xss")</script>' });
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    // React JSX escapes; should not execute HTML
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });

  it('handles unicode/emoji content', () => {
    const msg = createMessage({ content: 'Hợp đồng OK ✅. Cần điều chỉnh điều 3 📝' });
    render(<MessageBubble message={msg} currentUserId="user-1" />);
    expect(screen.getByText('Hợp đồng OK ✅. Cần điều chỉnh điều 3 📝')).toBeInTheDocument();
  });

  it('handles null currentUserId (treated as incoming for all)', () => {
    const msg = createMessage({ senderId: 'user-x' });
    const { container } = render(
      <MessageBubble message={msg} currentUserId={undefined} />
    );
    const bubble = container.querySelector('.msg');
    expect(bubble).toHaveClass('in');
  });
});

// ═══════════════════════════════════════════════════════════
// ERROR: missing data
// ═══════════════════════════════════════════════════════════
describe('MessageBubble — Error', () => {
  it('renders with minimal content (empty name + empty content)', () => {
    const msg = createMessage({ senderName: '', content: '' });
    render(<MessageBubble message={msg} currentUserId="user-2" />);
    expect(screen.getByText('unknownSender')).toBeInTheDocument();
    // msg-content will be empty but component should not crash
  });

  it('renders with Date object createdAt', () => {
    const msg = createMessage({ createdAt: new Date('2026-01-01') });
    render(<MessageBubble message={msg} currentUserId="user-2" />);
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
  });

  it('renders with string createdAt', () => {
    const msg = createMessage({ createdAt: '2026-07-20T10:00:00Z' });
    render(<MessageBubble message={msg} currentUserId="user-2" />);
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
  });
});
