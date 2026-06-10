'use client';

import React from 'react';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps): JSX.Element {
  return (
    <div className="panel">
      <div className="panel-title">Hoạt động gần đây</div>
      <div className="timeline">
        {activities.length === 0 ? (
          <div className="empty-state">Không có hoạt động nào gần đây</div>
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
