'use client';

import { useTranslations } from 'next-intl';

export interface AuditEntry {
  title: string;
  description: string;
  time: string;
}

interface AuditTimelineProps {
  entries?: AuditEntry[];
}

export default function AuditTimeline({ entries = [] }: AuditTimelineProps) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="panel">
      {/* Panel Title */}
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {t('timelinePanel')}
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline">
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '16px 0' }}>
            {t('noTimeline')}
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot" />
              <strong>{entry.title}</strong>
              <p>{entry.description}</p>
              <div className="timeline-time">{entry.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
