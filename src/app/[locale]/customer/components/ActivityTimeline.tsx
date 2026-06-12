'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps): React.ReactElement {
  const t = useTranslations('UserDashboard');

  return (
    <div className="panel">
      <div className="panel-title">{t('recentActivity')}</div>
      <div className="timeline">
        {activities.length === 0 ? (
          <div className="empty-state">{t('noRecentActivity')}</div>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span className="timeline-time">{item.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityTimeline;
