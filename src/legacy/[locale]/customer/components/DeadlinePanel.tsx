'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ProgressBar } from './ProgressBar';

interface Deadline {
  id: string;
  title: string;
  timeRemaining: string;
  progress: number;
  status: 'ok' | 'warn' | 'danger';
  note: string;
}

export interface DeadlinePanelProps {
  deadlines: Deadline[];
}

export function DeadlinePanel({ deadlines }: DeadlinePanelProps): React.ReactElement {
  const t = useTranslations('UserDashboard');

  return (
    <div className="panel">
      <div className="panel-title">{t('deadlineSla')}</div>
      <div className="deadline-list">
        {deadlines.length === 0 ? (
          <div className="empty-state">{t('noDeadlines')}</div>
        ) : (
          deadlines.map((item) => (
            <div key={item.id} className="deadline-item">
              <div className="deadline-top">
                <strong>{item.title}</strong>
                <span className="time-remaining">{item.timeRemaining}</span>
              </div>
              <ProgressBar value={item.progress} status={item.status} />
              <p className="deadline-note">{item.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DeadlinePanel;
