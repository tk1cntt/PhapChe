'use client';

import { useTranslations } from 'next-intl';

interface WorkloadItemProps {
  initials: string;
  name: string;
  role: string;
  progress: number;
  status: 'ok' | 'warn' | 'danger';
  count: string;
}

function WorkloadItem({ initials, name, role, progress, status, count }: WorkloadItemProps) {
  return (
    <div className="workload-item">
      <div className="person">
        <div className="person-avatar">{initials}</div>
        <div>
          <strong>{name}</strong>
          <span>{role}</span>
        </div>
      </div>
      <div className="progress">
        <span
          className={status === 'warn' ? 'warn' : status === 'danger' ? 'danger' : ''}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="workload-count">{count}</div>
    </div>
  );
}

export function WorkloadPanel({ specialists = [] }: { specialists?: WorkloadItemProps[] }) {
  const t = useTranslations('AdminDashboard');

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-4 3 3 6-8" />
          </svg>
          {t('workloadPanel')}
        </div>
        <a className="small-link" href="#">
          {t('viewDetail')} →
        </a>
      </div>

      <div className="workload-list">
        {specialists.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
            {t('noWorkloadData')}
          </div>
        ) : (
          specialists.map((spec, index) => <WorkloadItem key={index} {...spec} />)
        )}
      </div>
    </div>
  );
}

export default WorkloadPanel;
