import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThreadListPanel from './ThreadListPanel';
import { ThreadData } from './ThreadItem';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

function makeThreads(count: number): ThreadData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `thread-${i + 1}`,
    requestCode: `REQ-2026-${String(i + 1).padStart(3, '0')}`,
    title: `Hồ sơ ${i + 1}`,
    preview: `Nội dung tin nhắn ${i + 1}...`,
    senderInitials: 'CV',
    senderColor: 'blue',
    timestamp: `${(i + 1) * 2}h`,
    isActive: false,
    isRead: true,
  }));
}

// ═══════════════════════════════════════════════════════════
// WHITEBOX
// ═══════════════════════════════════════════════════════════
describe('ThreadListPanel — Whitebox', () => {
  it('renders search input when onSearchChange is provided', () => {
    render(
      <ThreadListPanel
        threads={makeThreads(3)}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('does not render search input when onSearchChange is omitted', () => {
    render(
      <ThreadListPanel
        threads={makeThreads(3)}
        activeThreadId={null}
        onSelectThread={vi.fn()}
      />
    );
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('renders correct number of ThreadItem components', () => {
    render(
      <ThreadListPanel
        threads={makeThreads(5)}
        activeThreadId={null}
        onSelectThread={vi.fn()}
      />
    );
    const items = screen.getAllByRole('button');
    expect(items).toHaveLength(5);
  });

  it('shows empty state when threads array is empty', () => {
    render(
      <ThreadListPanel
        threads={[]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
      />
    );
    expect(screen.getByText('noThreads')).toBeInTheDocument();
  });

  it('passes correct isActive to each ThreadItem', () => {
    const { container } = render(
      <ThreadListPanel
        threads={makeThreads(3)}
        activeThreadId="thread-2"
        onSelectThread={vi.fn()}
      />
    );
    const threads = container.querySelectorAll('.thread');
    expect(threads[0]).not.toHaveClass('active');
    expect(threads[1]).toHaveClass('active');
    expect(threads[2]).not.toHaveClass('active');
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: search filtering
// ═══════════════════════════════════════════════════════════
describe('ThreadListPanel — Blackbox', () => {
  it('filters threads by title (case-insensitive)', () => {
    const threads = makeThreads(5);
    render(
      <ThreadListPanel
        threads={threads}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        searchQuery="hồ sơ 2"
        onSearchChange={vi.fn()}
      />
    );
    const items = screen.getAllByRole('button');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Hồ sơ 2');
  });

  it('filters threads by preview', () => {
    const threads = makeThreads(5);
    render(
      <ThreadListPanel
        threads={threads}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        searchQuery="Nội dung tin nhắn 3"
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('filters threads by requestCode', () => {
    const threads = makeThreads(5);
    render(
      <ThreadListPanel
        threads={threads}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        searchQuery="REQ-2026-004"
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('shows all threads when search query is empty', () => {
    const threads = makeThreads(5);
    render(
      <ThreadListPanel
        threads={threads}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('calls onSearchChange when typing in search', () => {
    const onSearchChange = vi.fn();
    render(
      <ThreadListPanel
        threads={makeThreads(3)}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onSearchChange={onSearchChange}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });

  it('calls onSelectThread when a thread item is clicked', () => {
    const onSelectThread = vi.fn();
    render(
      <ThreadListPanel
        threads={makeThreads(3)}
        activeThreadId={null}
        onSelectThread={onSelectThread}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSelectThread).toHaveBeenCalledWith('thread-1');
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL
// ═══════════════════════════════════════════════════════════
describe('ThreadListPanel — Abnormal', () => {
  it('shows empty state when search matches nothing', () => {
    render(
      <ThreadListPanel
        threads={makeThreads(3)}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        searchQuery="xyzznonexistent"
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getByText('noThreads')).toBeInTheDocument();
  });

  it('handles threads with empty title in search', () => {
    const threads = [
      {
        id: 't1', requestCode: '', title: '', preview: '',
        senderInitials: 'X', senderColor: 'gray', timestamp: '1h',
        isActive: false, isRead: true,
      },
    ];
    render(
      <ThreadListPanel
        threads={threads}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        searchQuery="something"
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getByText('noThreads')).toBeInTheDocument();
  });

  it('renders many threads without performance issues', () => {
    render(
      <ThreadListPanel
        threads={makeThreads(50)}
        activeThreadId={null}
        onSelectThread={vi.fn()}
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(50);
  });
});
