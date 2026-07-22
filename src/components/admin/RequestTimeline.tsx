'use client';

/**
 * RequestTimeline — Hiển thị toàn bộ lịch sử traceability của 1 request.
 * Aggregate từ 3 nguồn: status changes, assignments, audit events.
 */
import React, { useEffect, useState, useCallback } from 'react';
import '@/styles/pages/admin/request-timeline.css';

// ── Types ──────────────────────────────────────────────────────

interface TimelineActor {
  id: string;
  name: string;
}

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'assignment' | 'audit';
  ts: string;
  actor: TimelineActor | null;
  detail: string;
  note: string | null;
  extra: Record<string, unknown>;
}

interface TimelineData {
  timeline: TimelineEvent[];
  current: {
    specialist: TimelineActor | null;
    reviewer: TimelineActor | null;
  };
}

export interface RequestTimelineProps {
  requestId: string;
  labels: {
    title: string;
    empty: string;
    loading: string;
    error: string;
    retry: string;
    specialist: string;
    reviewer: string;
    unassigned: string;
  };
}

// ── Format helpers ─────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffH < 24) return `${diffH} giờ trước`;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

// ── Dot icon ──────────────────────────────────────────────────

function DotIcon({ type }: { type: TimelineEvent['type'] }) {
  return <span className={`request-timeline-dot request-timeline-dot--${type}`} />;
}

// ── Component ──────────────────────────────────────────────────

export function RequestTimeline({ requestId, labels }: RequestTimelineProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/timeline`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('FORBIDDEN');
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setLoading(false);
    }
  }, [requestId, labels.error]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="request-timeline-loading" data-testid="timeline-loading">
        <div className="request-timeline-skeleton" />
        <div className="request-timeline-skeleton" />
        <div className="request-timeline-skeleton" />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="request-timeline-error" data-testid="timeline-error">
        <span>{labels.error}: {error}</span>
        <button className="request-timeline-retry-btn" onClick={fetchTimeline}>
          {labels.retry}
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (!data || data.timeline.length === 0) {
    return (
      <div className="request-timeline-empty" data-testid="timeline-empty">
        {labels.empty}
      </div>
    );
  }

  // ── Timeline ──
  return (
    <div data-testid="request-timeline">
      {/* Current assignments */}
      <div className="request-timeline-current" data-testid="timeline-current">
        <div className="request-timeline-current-item">
          <span className="request-timeline-current-label">{labels.specialist}</span>
          <span className={`request-timeline-current-value${!data.current.specialist ? ' request-timeline-current-value--empty' : ''}`}>
            {data.current.specialist?.name ?? labels.unassigned}
          </span>
        </div>
        <div className="request-timeline-current-item">
          <span className="request-timeline-current-label">{labels.reviewer}</span>
          <span className={`request-timeline-current-value${!data.current.reviewer ? ' request-timeline-current-value--empty' : ''}`}>
            {data.current.reviewer?.name ?? labels.unassigned}
          </span>
        </div>
      </div>

      {/* Events */}
      <div className="request-timeline">
        {data.timeline.map((event) => (
          <div key={event.id} className="request-timeline-item" data-testid={`timeline-event-${event.type}`}>
            <DotIcon type={event.type} />
            <div className="request-timeline-body">
              {event.actor && (
                <span className="request-timeline-actor">{event.actor.name}</span>
              )}
              <span className="request-timeline-detail">{event.detail}</span>
              {event.note && (
                <span className="request-timeline-note">{event.note}</span>
              )}
              <span className="request-timeline-time">{formatTime(event.ts)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
