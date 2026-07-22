/**
 * RequestTimeline Unit Tests
 *
 * Test categories: Whitebox, Blackbox, Abnormal, Error
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { RequestTimeline } from '../RequestTimeline';

const DEFAULT_LABELS = {
  title: 'Lịch sử hoạt động',
  empty: 'Chưa có hoạt động nào',
  loading: 'Đang tải...',
  error: 'Không thể tải lịch sử',
  retry: 'Thử lại',
  specialist: 'Chuyên viên',
  reviewer: 'Người kiểm duyệt',
  unassigned: 'Chưa phân công',
};

// ── Helper ────────────────────────────────────────────────────

function mockFetch(response: unknown, status = 200) {
  (global as any).fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  });
}

const MOCK_DATA = {
  data: {
    timeline: [
      {
        id: 'tr_1',
        type: 'status_change' as const,
        ts: '2026-07-22T10:00:00Z',
        actor: { id: 'u1', name: 'Lê Văn C' },
        detail: 'pending_review → approved',
        note: 'Hồ sơ đạt yêu cầu',
        extra: { fromStatus: 'pending_review', toStatus: 'approved' },
      },
      {
        id: 'as_1',
        type: 'assignment' as const,
        ts: '2026-07-20T09:30:00Z',
        actor: { id: 'u2', name: 'Admin' },
        detail: 'Phân công Chuyên viên: Trần Thị B bởi Admin',
        note: null,
        extra: { kind: 'specialist', userId: 'u3', isCurrent: true },
      },
    ],
    current: {
      specialist: { id: 'u3', name: 'Trần Thị B' },
      reviewer: { id: 'u1', name: 'Lê Văn C' },
    },
  },
};

// ── Whitebox Tests ────────────────────────────────────────────

describe('RequestTimeline — Whitebox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    (global as any).fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);
    expect(screen.getByTestId('timeline-loading')).toBeInTheDocument();
  });

  it('renders timeline events after fetch', async () => {
    mockFetch(MOCK_DATA);
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('request-timeline')).toBeInTheDocument();
    });

    // "Lê Văn C" appears both in current assignment (reviewer) and timeline actor — 2 elements
    expect(screen.getAllByText('Lê Văn C').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('pending_review → approved')).toBeInTheDocument();
  });

  it('renders current assignment section', async () => {
    mockFetch(MOCK_DATA);
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-current')).toBeInTheDocument();
    });

    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    // "Lê Văn C" appears both in current assignment (reviewer) and timeline actor — 2 elements
    expect(screen.getAllByText('Lê Văn C').length).toBeGreaterThanOrEqual(2);
  });

  it('shows status_change dot class', async () => {
    mockFetch(MOCK_DATA);
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      const dot = document.querySelector('.request-timeline-dot--status_change');
      expect(dot).toBeInTheDocument();
    });
  });

  it('shows assignment dot class', async () => {
    mockFetch(MOCK_DATA);
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      const dot = document.querySelector('.request-timeline-dot--assignment');
      expect(dot).toBeInTheDocument();
    });
  });
});

// ── Blackbox Tests ────────────────────────────────────────────

describe('RequestTimeline — Blackbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays actor name for each event with actor', async () => {
    mockFetch(MOCK_DATA);
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      const actors = document.querySelectorAll('.request-timeline-actor');
      expect(actors.length).toBe(2);
    });
  });

  it('displays note for status_change with reason', async () => {
    mockFetch(MOCK_DATA);
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByText('Hồ sơ đạt yêu cầu')).toBeInTheDocument();
    });
  });

  it('displays unassigned for empty current assignments', async () => {
    mockFetch({
      data: {
        timeline: [],
        current: { specialist: null, reviewer: null },
      },
    });
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-empty')).toBeInTheDocument();
    });
  });
});

// ── Abnormal Tests ────────────────────────────────────────────

describe('RequestTimeline — Abnormal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when timeline has zero events', async () => {
    mockFetch({
      data: {
        timeline: [],
        current: { specialist: { id: 'u1', name: 'A' }, reviewer: { id: 'u2', name: 'B' } },
      },
    });
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-empty')).toBeInTheDocument();
    });
  });

  it('handles null actor gracefully', async () => {
    mockFetch({
      data: {
        timeline: [
          {
            id: 'tr_2',
            type: 'status_change' as const,
            ts: '2026-07-20T08:00:00Z',
            actor: null,
            detail: 'draft_intake → triage',
            note: null,
            extra: {},
          },
        ],
        current: { specialist: null, reviewer: null },
      },
    });
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByText('draft_intake → triage')).toBeInTheDocument();
      // No actor element rendered
      expect(document.querySelector('.request-timeline-actor')).toBeNull();
    });
  });

  it('handles many events without performance issues', async () => {
    const manyEvents = Array.from({ length: 50 }, (_, i) => ({
      id: `tr_${i}`,
      type: 'status_change' as const,
      ts: new Date(Date.now() - i * 60000).toISOString(),
      actor: { id: 'u1', name: 'User' },
      detail: `a${i} → b${i}`,
      note: null,
      extra: {},
    }));

    mockFetch({
      data: {
        timeline: manyEvents,
        current: { specialist: null, reviewer: null },
      },
    });

    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      const items = document.querySelectorAll('.request-timeline-item');
      expect(items.length).toBe(50);
    });
  });
});

// ── Error Tests ───────────────────────────────────────────────

describe('RequestTimeline — Error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error state on 500', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-error')).toBeInTheDocument();
    });
  });

  it('shows error state on 403 forbidden', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    });
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-error')).toBeInTheDocument();
    });
  });

  it('retry button re-fetches', async () => {
    (global as any).fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_DATA });

    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Thử lại'));

    await waitFor(() => {
      expect(screen.getByTestId('request-timeline')).toBeInTheDocument();
    });
  });

  it('shows error on network failure', async () => {
    (global as any).fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<RequestTimeline requestId="req-1" labels={DEFAULT_LABELS} />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline-error')).toBeInTheDocument();
    });
  });
});
