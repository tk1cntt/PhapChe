'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Deadline {
  id: string;
  title: string;
  code: string;
  slaDeadline: string;
  progress: number;
  status: 'ok' | 'warn' | 'danger';
  timeText: string;
}

interface DeadlineSLAProps {
  deadlines?: Deadline[]; // Optional - will fetch if not provided
}

const progressClass: Record<string, string> = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
};

export default function DeadlineSLA({ deadlines: propDeadlines }: DeadlineSLAProps) {
  const t = useTranslations('DeadlineSLA');
  const [deadlines, setDeadlines] = useState<Deadline[]>(propDeadlines || []);
  const [loading, setLoading] = useState(!propDeadlines);

  useEffect(() => {
    if (!propDeadlines) {
      fetch('/api/dashboard/deadlines')
        .then((res) => res.json())
        .then((data) => {
          setDeadlines(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [propDeadlines]);

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
        {loading ? (
          <div className="empty-state">{t('loading') || 'Loading...'}</div>
        ) : deadlines.length === 0 ? (
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
