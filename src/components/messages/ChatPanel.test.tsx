import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPanel from './ChatPanel';
import { MessageData } from './MessageBubble';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function makeMessages(count: number): MessageData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i + 1}`,
    content: `Nội dung tin nhắn ${i + 1}`,
    senderId: i % 2 === 0 ? 'current-user' : 'other-user',
    senderName: i % 2 === 0 ? 'Tôi' : 'Chuyên viên',
    isOutgoing: i % 2 === 0,
    createdAt: new Date(`2026-07-20T${String(i).padStart(2, '0')}:00:00Z`),
  }));
}

// ═══════════════════════════════════════════════════════════
// WHITEBOX
// ═══════════════════════════════════════════════════════════
describe('ChatPanel — Whitebox', () => {
  it('renders header with thread title and specialist name', () => {
    render(
      <ChatPanel
        threadTitle="Hợp đồng thuê văn phòng"
        specialistName="Nguyễn Văn B"
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    expect(screen.getByText('Hợp đồng thuê văn phòng')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn B')).toBeInTheDocument();
  });

  it('shows online status dot by default', () => {
    const { container } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    const statusDot = container.querySelector('.status-dot');
    expect(statusDot).toHaveClass('online');
  });

  it('shows offline status dot when specialistStatus is offline', () => {
    const { container } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        specialistStatus="offline"
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    const statusDot = container.querySelector('.status-dot');
    expect(statusDot).toHaveClass('offline');
  });

  it('renders empty state when no messages', () => {
    render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    expect(screen.getByText('startConversation')).toBeInTheDocument();
  });

  it('renders correct number of MessageBubble components', () => {
    const { container } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={makeMessages(5)}
        onSendMessage={vi.fn()}
      />
    );
    const bubbles = container.querySelectorAll('.msg');
    expect(bubbles).toHaveLength(5);
  });

  it('renders Composer component', () => {
    render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls scrollIntoView on messages change (auto-scroll)', () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { rerender } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={makeMessages(2)}
        onSendMessage={vi.fn()}
      />
    );
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);

    // Re-render with more messages should trigger scroll again
    rerender(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={makeMessages(4)}
        onSendMessage={vi.fn()}
      />
    );
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(2);

    scrollIntoViewSpy.mockRestore();
  });

  it('disables composer when disabled prop is true', () => {
    render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={[]}
        onSendMessage={vi.fn()}
        disabled
      />
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: user interaction
// ═══════════════════════════════════════════════════════════
describe('ChatPanel — Blackbox', () => {
  it('user can type and send message via Composer', () => {
    const onSendMessage = vi.fn();
    const { container } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={makeMessages(1)}
        onSendMessage={onSendMessage}
      />
    );

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSendMessage).toHaveBeenCalledWith('New message');
  });

  it('displays incoming and outgoing messages correctly', () => {
    const { container } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={makeMessages(2)}
        onSendMessage={vi.fn()}
        currentUserId="current-user"
      />
    );
    const bubbles = container.querySelectorAll('.msg');
    expect(bubbles[0]).toHaveClass('out'); // first msg from current-user
    expect(bubbles[1]).toHaveClass('in');  // second msg from other-user
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL
// ═══════════════════════════════════════════════════════════
describe('ChatPanel — Abnormal', () => {
  it('handles very long thread title', () => {
    render(
      <ChatPanel
        threadTitle={'A'.repeat(500)}
        specialistName="Test"
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
  });

  it('handles many messages (100+)', () => {
    const { container } = render(
      <ChatPanel
        threadTitle="Test"
        specialistName="Test"
        messages={makeMessages(100)}
        onSendMessage={vi.fn()}
      />
    );
    expect(container.querySelectorAll('.msg')).toHaveLength(100);
  });

  it('renders with empty specialist name', () => {
    render(
      <ChatPanel
        threadTitle="Test"
        specialistName=""
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );
    // Should render without crash
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
