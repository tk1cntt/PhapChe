'use client';

import { useTranslations } from 'next-intl';
import { CaseItem } from './DashboardClient';

interface DeadlineSLAProps {
  cases: CaseItem[];
}

interface Deadline {
  id: string;
  title: string;
  code: string;
  slaDeadline: string;
  progress: number;
  status: 'ok' | 'warn' | 'danger';
  timeText: string;
}

function getDeadlineStatus(deadline: Date): { status: 'ok' | 'warn' | 'danger'; progress: number; timeText: string } {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffMs < 0) {
    return { status: 'danger', progress: 100, timeText: `Trễ ${Math.abs(Math.round(diffDays))} ngày` };
  } else if (diffHours < 24) {
    return { status: 'warn', progress: 75, timeText: `Còn ${Math.round(diffHours)}h` };
  } else if (diffDays < 3) {
    return { status: 'warn', progress: 50, timeText: `Còn ${Math.round(diffDays)} ngày` };
  } else {
    return { status: 'ok', progress: 25, timeText: `Còn ${Math.round(diffDays)} ngày` };
  }
}

const progressClass: Record<string, string> = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
};

export default function DeadlineSLA({ cases }: DeadlineSLAProps) {
  const t = useTranslations('DeadlineSLA');

  // Get active cases with deadlines (excluding completed/closed/cancelled)
  const activeCases = cases.filter(c =>
    !['approved', 'delivered', 'closed', 'cancelled'].includes(c.status)
  );

  // Map to deadlines - for now using createdAt as deadline (in real app would use slaDeadline)
  const deadlines: Deadline[] = activeCases.slice(0, 5).map(c => {
    const deadlineDate = new Date(c.updatedAt);
    deadlineDate.setDate(deadlineDate.getDate() + 7); // Simulate 7-day SLA
    const deadlineInfo = getDeadlineStatus(deadlineDate);

    return {
      id: c.id,
      title: c.title,
      code: c.code,
      slaDeadline: deadlineDate.toISOString(),
      ...deadlineInfo,
    };
  });

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

      <div className="deadline-list">
        {deadlines.length === 0 ? (
          <div className="empty-state">{t('empty')}</div>
        ) : (
          deadlines.map((d) => (
            <div key={d.id} className="deadline-item">
              <div className="deadline-top">
                <strong>{d.title}</strong>
                <span>{d.timeText}</span>
              </div>
              <div className="progress">
                <span
                  className={progressClass[d.status] || 'ok'}
                  style={{ width: `${d.progress}%` }}
                />
              </div>
              <p className="deadline-note">
                {d.status === 'danger' && t('urgent')}
                {d.status === 'warn' && t('warning')}
                {d.status === 'ok' && t('safe')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
