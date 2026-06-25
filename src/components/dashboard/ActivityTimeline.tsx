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
  LucideIcon,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/ui/EmptyState';
import type { ActivityItem, ActivityType } from '@/lib/types';

// Icon mapping cho từng loại activity
const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
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

// Color classes cho từng loại activity
const ACTIVITY_STYLES: Record<ActivityType, { dot: string; icon: string; bg: string }> = {
  user: {
    dot: 'bg-blue-500',
    icon: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  workspace: {
    dot: 'bg-purple-500',
    icon: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
  request: {
    dot: 'bg-green-500',
    icon: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  document: {
    dot: 'bg-orange-500',
    icon: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
  review: {
    dot: 'bg-red-500',
    icon: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
  },
  message: {
    dot: 'bg-cyan-500',
    icon: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950',
  },
  vault: {
    dot: 'bg-yellow-500',
    icon: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
  },
  partner: {
    dot: 'bg-indigo-500',
    icon: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950',
  },
  system: {
    dot: 'bg-gray-500',
    icon: 'text-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-900',
  },
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
          <EmptyState
            icon={
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title={t('empty')}
          />
        ) : (
          displayActivities.map((activity, index) => {
            // Validate and get type with fallback to 'system'
            const validTypes: ActivityType[] = ['user', 'workspace', 'request', 'document', 'review', 'message', 'vault', 'partner', 'system'];
            const activityType: ActivityType = validTypes.includes(activity.type as ActivityType) ? activity.type as ActivityType : 'system';
            const IconComponent = ACTIVITY_ICONS[activityType];
            const styles = ACTIVITY_STYLES[activityType];

            return (
              <div key={activity.id || `activity-${index}`} className={`timeline-item ${styles.bg}`}>
                <div className="timeline-icon-wrapper">
                  <div className={`timeline-dot ${styles.dot}`} />
                  <IconComponent className={`timeline-icon ${styles.icon}`} size={18} />
                </div>
                <div className="timeline-content">
                  {showType && (
                    <span className={`activity-type-badge ${styles.icon}`}>
                      {t(`types.${activityType}`)}
                    </span>
                  )}
                  <strong className="timeline-action">{activity.action}</strong>
                  <p className="timeline-description">{activity.description}</p>
                  <div className="timeline-meta">
                    <span className="timeline-actor">{activity.actor}</span>
                    {activity.targetLabel && (
                      <>
                        <span className="timeline-separator">•</span>
                        <span className="timeline-target">{activity.targetLabel}</span>
                      </>
                    )}
                    <span className="timeline-separator">•</span>
                    <span className="timeline-time">{activity.relativeTime}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
