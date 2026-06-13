'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { Badge } from './Badge';

export interface MyCaseRow {
  id: string;
  code: string;
  statusText: string;
  type: string;
  typeEn: string;
  statusBadge: 'review' | 'pending' | 'approved' | 'overdue' | 'submitted';
  specialistName: string;
  specialistRole: string;
  updatedDate: string;
  updatedTime: string;
  slaText: string;
  slaVariant: 'green' | 'orange' | 'red' | 'blue';
  actionText: string;
  actionHref: string;
}

export interface MyCasesTableProps {
  requests: MyCaseRow[];
}

function getStatusBadgeVariant(status: MyCaseRow['statusBadge']): 'green' | 'orange' | 'blue' | 'red' | 'purple' {
  switch (status) {
    case 'review':
      return 'blue';
    case 'pending':
      return 'orange';
    case 'approved':
      return 'green';
    case 'overdue':
      return 'red';
    case 'submitted':
      return 'blue';
    default:
      return 'blue';
  }
}

export function MyCasesTable({ requests }: MyCasesTableProps): React.ReactElement {
  const t = useTranslations('UserCases');

  if (requests.length === 0) {
    return (
      <div className="table-card">
        <div className="table-head table-head-7col">
          <div className="th">{t('colCode')}</div>
          <div className="th">{t('colType')}</div>
          <div className="th">{t('colStatus')}</div>
          <div className="th">{t('colAssignee')}</div>
          <div className="th">{t('colUpdatedAt')}</div>
          <div className="th">{t('colSla')}</div>
          <div className="th">{t('colAction')}</div>
        </div>
        <div className="table-empty">{t('noData')}</div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-head table-head-7col">
        <div className="th">{t('colCode')}</div>
        <div className="th">{t('colType')}</div>
        <div className="th">{t('colStatus')}</div>
        <div className="th">{t('colAssignee')}</div>
        <div className="th">{t('colUpdatedAt')}</div>
        <div className="th">{t('colSla')}</div>
        <div className="th">{t('colAction')}</div>
      </div>
      {requests.map((item) => (
        <div key={item.id} className="table-row table-row-7col">
          <div className="td">
            <div className="case-main">
              <div className="case-icon case-icon-table">
                <FileText size={16} />
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
            <Badge variant={getStatusBadgeVariant(item.statusBadge)}>
              {item.statusText}
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
          <div className="td">
            <Badge variant={item.slaVariant}>
              {item.slaText}
            </Badge>
          </div>
          <div className="td">
            <a href={item.actionHref} className="action-link">
              {item.actionText} →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyCasesTable;
