'use client';

import { useTranslations } from 'next-intl';

export interface AuditEventTimeline {
  id: string;
  action: string;
  createdAt: string;
  actor?: { email: string | null; name: string | null } | null;
  workspace: { name: string };
}

interface AdminAuditTimelineProps {
  events: AuditEventTimeline[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' });

  if (Math.abs(diffMin) < 60) {
    return rtf.format(-Math.abs(diffMin), 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(-Math.abs(diffHour), 'hour');
  } else {
    return rtf.format(-Math.abs(diffDay), 'day');
  }
}

export function AdminAuditTimeline({ events }: AdminAuditTimelineProps) {
  const t = useTranslations('AuditEvents');
  const displayEvents = events.slice(0, 4);

  if (displayEvents.length === 0) {
    return (
      <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
        Chua co su kien nao.
      </div>
    );
  }

  return (
    <div className="audit-timeline">
      {displayEvents.map((event) => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-action">{event.action}</div>
          <div className="timeline-desc">
            {event.actor?.email || 'system'} - {event.workspace.name}
          </div>
          <div className="timeline-time">{formatRelativeTime(event.createdAt)}</div>
        </div>
      ))}
      <style>{`
        .audit-timeline {
          position: relative;
          display: grid;
          gap: 18px;
        }
        .audit-timeline::before {
          content: "";
          position: absolute;
          left: 13px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: #e2e8f0;
        }
        .audit-timeline .timeline-item {
          position: relative;
          padding-left: 38px;
        }
        .audit-timeline .timeline-dot {
          position: absolute;
          left: 5px;
          top: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #087f78;
          border: 4px solid #d9f8f4;
          z-index: 2;
        }
        .audit-timeline .timeline-action {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 5px;
          color: #0f172a;
        }
        .audit-timeline .timeline-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }
        .audit-timeline .timeline-time {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 5px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
