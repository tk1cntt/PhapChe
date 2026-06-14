'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Activity {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: string;
  relativeTime: string;
}

interface ActivityTimelineProps {
  activities?: Activity[]; // Optional - will fetch if not provided
}

export default function ActivityTimeline({ activities: propActivities }: ActivityTimelineProps) {
  const t = useTranslations('ActivityTimeline');
  const [activities, setActivities] = useState<Activity[]>(propActivities || []);
  const [loading, setLoading] = useState(!propActivities);

  useEffect(() => {
    if (!propActivities) {
      fetch('/api/dashboard/activities')
        .then((res) => res.json())
        .then((data) => {
          setActivities(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [propActivities]);

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
        {loading ? (
          <div className="empty-state">{t('loading') || 'Loading...'}</div>
        ) : activities.length === 0 ? (
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
