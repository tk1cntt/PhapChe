'use client';

import { useTranslations } from 'next-intl';
import type { OpsTimelineItemDto } from '@/lib/ops/ops-service';

interface AdminOperationsTimelineProps {
  timeline: OpsTimelineItemDto[];
}

function formatRelativeTime(date: Date, t: ReturnType<typeof useTranslations>): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return t('justNow');
  if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes });
  if (diffHours < 24) return t('hoursAgo', { count: diffHours });
  return t('daysAgo', { count: diffDays });
}

function getTimelineTitle(item: OpsTimelineItemDto, t: ReturnType<typeof useTranslations>): string {
  if (item.kind === 'workflow' && item.toStatus) {
    return t('statusChanged', { status: item.toStatus });
  }
  return item.action;
}

export function AdminOperationsTimeline({ timeline }: AdminOperationsTimelineProps) {
  const t = useTranslations('AdminOps');

  return (
    <div style={{ position: 'relative', maxHeight: 420, overflowY: 'auto' }}>
      {timeline.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          {t('noTimelineEvents')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {timeline.map((item) => (
            <div key={item.id} style={{ position: 'relative', paddingLeft: 38 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 13,
                  top: 8,
                  bottom: -10,
                  width: 2,
                  background: '#e2e8f0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#087f78',
                  border: '4px solid #d9f8f4',
                  zIndex: 2,
                }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 5, color: '#0f172a' }}>
                  {getTimelineTitle(item, t)}
                </strong>
                {item.metadataSummary && (
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 5px' }}>
                    {item.metadataSummary}
                  </p>
                )}
                {item.actorName && (
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 5px' }}>
                    {item.actorName}
                  </p>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {formatRelativeTime(item.at, t)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
