'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { SlaBadge } from './SlaBadge';
import Paging from '@/components/ui/Paging';

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
  remainingHours: number;
  actionText: string;
  actionHref: string;
}

export interface MyCasesTableProps {
  requests: MyCaseRow[];
  totalRequests?: number;
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
      return 'green';
    default:
      return 'blue';
  }
}

function getSlaBadgeVariant(slaText: string, remainingHours: number): 'green' | 'orange' | 'red' | 'blue' {
  // Theo dõi (completed) → blue
  if (slaText === 'Theo dõi') {
    return 'blue';
  }
  // Trễ → red
  if (slaText.startsWith('Trễ')) {
    return 'red';
  }
  // Còn Xh (dưới 24h) → orange (sắp hết hạn)
  if (slaText.includes('Còn') && slaText.endsWith('h')) {
    return 'orange';
  }
  // Còn X ngày (dưới 3 ngày) → orange (cần chú ý)
  if (slaText.includes('Còn') && slaText.includes('ngày')) {
    const days = parseInt(slaText.match(/\d+/)?.[0] ?? '0', 10);
    if (days < 3) return 'orange';
    return 'green';
  }
  // Mặc định → green (đúng hạn)
  return 'green';
}

export function MyCasesTable({ requests, totalRequests }: MyCasesTableProps): React.ReactElement {
  const t = useTranslations('UserCases');
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const total = totalRequests ?? requests.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (current - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedRequests = requests.slice(startIndex, endIndex);

  const handlePageChange = (page: number, size: number) => {
    setCurrent(page);
    setPageSize(size);
  };

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
      {paginatedRequests.map((item) => (
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
            <StatusBadge variant={getStatusBadgeVariant(item.statusBadge)}>
              {item.statusText}
            </StatusBadge>
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
            <SlaBadge variant={getSlaBadgeVariant(item.slaText, item.remainingHours)}>
              {item.slaText}
            </SlaBadge>
          </div>
          <div className="td">
            <a href={item.actionHref} className="action-link">
              {item.actionText} →
            </a>
          </div>
        </div>
      ))}

      <Paging
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
        totalLabel={`${total} hồ sơ`}
      />
    </div>
  );
}

export default MyCasesTable;
