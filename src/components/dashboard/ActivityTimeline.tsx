'use client';

interface Activity {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: string;
  relativeTime: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Hoạt động gần đây</span>
        </div>
      </div>

      <div className="timeline">
        {activities.length === 0 ? (
          <div className="empty-state">Không có hoạt động nào</div>
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
