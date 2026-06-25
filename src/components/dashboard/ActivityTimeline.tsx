'use client';

import { useTranslations } from 'next-intl';
import {
  User,
  Building2,
  FileText,
  FileUp,
  CheckCircle,
  MessageSquare,
  Archive,
  Handshake,
  Settings,
} from 'lucide-react';
import type { ActivityItem, ActivityType } from '@/lib/types';

// Icon mapping cho từng loại activity (dùng cho type badge)
const ACTIVITY_ICONS: Record<ActivityType, React.ComponentType<{ size?: number; className?: string }>> = {
  user: User,
  workspace: Building2,
  request: FileText,
  document: FileUp,
  review: CheckCircle,
  message: MessageSquare,
  vault: Archive,
  partner: Handshake,
  system: Settings,
};

// Color mapping cho timeline dot theo activity type
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  user: '#2563eb',      // Blue
  workspace: '#7c3aed', // Purple
  request: '#10b981',   // Green
  document: '#f97316',  // Orange
  review: '#ef4444',    // Red
  message: '#0891b2',   // Cyan
  vault: '#eab308',     // Yellow
  partner: '#6366f1',   // Indigo
  system: '#087f78',    // Teal (matches panel title)
};

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
  showType?: boolean;
}

export default function ActivityTimeline({
  activities = [],
  maxItems,
  showType = false,
}: ActivityTimelineProps) {
  const t = useTranslations('ActivityTimeline');

  // Ensure activities is always an array and filter out null/undefined items
  const safeActivities = Array.isArray(activities)
    ? activities.filter((a): a is ActivityItem => a != null && typeof a === 'object')
    : [];
  const displayActivities = maxItems ? safeActivities.slice(0, maxItems) : safeActivities;

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
        {displayActivities.length === 0 ? (
          <div className="empty-state">
            <p>{t('empty')}</p>
          </div>
        ) : (
          displayActivities.map((activity, index) => {
            // Validate and get type with fallback to 'system'
            const validTypes: ActivityType[] = ['user', 'workspace', 'request', 'document', 'review', 'message', 'vault', 'partner', 'system'];
            const activityType: ActivityType = validTypes.includes(activity.type as ActivityType) ? activity.type as ActivityType : 'system';
            const dotColor = ACTIVITY_COLORS[activityType];

            return (
              <div key={activity.id || `activity-${index}`} className="timeline-item">
                <div className="timeline-dot" style={{ background: dotColor, borderColor: `${dotColor}20` }} />
                {showType && (
                  <span className="activity-type-badge" style={{ color: dotColor }}>
                    {t(`types.${activityType}`)}
                  </span>
                )}
                <strong>{activity.action}</strong>
                <p>{activity.description}</p>
                <div className="timeline-time">{activity.relativeTime}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
