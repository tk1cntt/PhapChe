'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from './Badge';

export interface SLAData {
  deadline: string;
  deadlineText: string;
  progress: number; // 0-100
  status: 'ok' | 'warn' | 'danger';
}

export interface RequestRow {
  id: string;
  code: string;
  statusText: string;
  type: string;
  typeEn: string;
  specialistName: string;
  specialistRole: string;
  updatedDate: string;
  updatedTime: string;
  status: 'review' | 'pending' | 'approved' | 'overdue';
  actionText: string;
  sla: SLAData;
}

export interface RequestsTableProps {
  requests: RequestRow[];
}

function getStatusVariant(status: RequestRow['status']): BadgeProps['variant'] {
  switch (status) {
    case 'review':
      return 'blue';
    case 'pending':
      return 'orange';
    case 'approved':
      return 'green';
    case 'overdue':
      return 'red';
    default:
      return 'blue';
  }
}

type BadgeProps = {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
};

const STATUS_I18N_MAP: Record<RequestRow['status'], string> = {
  review: 'in_progress',
  pending: 'pending_review',
  approved: 'delivered',
  overdue: 'cancelled',
};

function ProgressBar({ value, status }: { value: number; status: 'ok' | 'warn' | 'danger' }): React.ReactElement {
  return (
    <div className="sla-progress">
      <div className="sla-progress-bar">
        <div className={`sla-progress-fill ${status}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

export function RequestsTable({ requests }: RequestsTableProps): React.ReactElement {
  const t = useTranslations('UserDashboard');
  const tStatus = useTranslations('RequestStatus');

  return (
    <div className="table-card">
      <div className="table-head table-head-7col">
        <div className="th">{t('requestCode')}</div>
        <div className="th">{t('requestType')}</div>
        <div className="th">{t('status')}</div>
        <div className="th">{t('assignee')}</div>
        <div className="th">{t('lastUpdate')}</div>
        <div className="th">SLA</div>
        <div className="th">{t('actions')}</div>
      </div>
      {requests.length === 0 ? (
        <div className="table-empty">{t('noData')}</div>
      ) : (
        requests.map((item) => (
          <div key={item.id} className="table-row table-row-7col">
            <div className="td">
              <div className="case-main">
                <div className="case-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="case-info">
                  <strong>{item.code}</strong>
                  <span>{item.statusText}</span>
                </div>
              </div>
            </div>
            <div className="td">
              <div className="stack">
                <strong>{item.type}</strong>
                <span>{item.typeEn}</span>
              </div>
            </div>
            <div className="td">
              <Badge variant={getStatusVariant(item.status)}>
                {tStatus(STATUS_I18N_MAP[item.status])}
              </Badge>
            </div>
            <div className="td">
              <div className="stack">
                <strong>{item.specialistName}</strong>
                <span>{item.specialistRole}</span>
              </div>
            </div>
            <div className="td">
              <div className="stack">
                <strong>{item.updatedDate}</strong>
                <span>{item.updatedTime}</span>
              </div>
            </div>
            <div className="td sla-cell">
              <div className="sla-info">
                <span className="sla-deadline">{item.sla.deadlineText}</span>
                <ProgressBar value={item.sla.progress} status={item.sla.status} />
              </div>
            </div>
            <div className="td">
              <a href={`/customer/cases/${item.id}`} className="action-link">
                {item.actionText}
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default RequestsTable;
