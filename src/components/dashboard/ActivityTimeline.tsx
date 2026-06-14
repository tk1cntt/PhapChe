'use client';

import { useTranslations } from 'next-intl';
import { ActivityItem } from './DashboardClient';

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const t = useTranslations('ActivityTimeline');

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{t('title')}</span>
        </div>
      </div>

      <div className="timeline">
        {activities.length === 0 ? (
          <div className="empty-state">{t('empty')}</div>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="timeline-item">
              <div className="timeline-dot" />
              <strong>{a.action}</strong>
              <p>{a.description}</p>
              <span className="timeline-time">{a.relativeTime}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
