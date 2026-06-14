'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Paging from '@/components/ui/Paging';
import { CaseItem } from './DashboardClient';

interface CasesTableProps {
  cases: CaseItem[];
}

function getStatusBadgeClass(variant: string): string {
  const map: Record<string, string> = {
    green: 'badge green',
    blue: 'badge blue',
    orange: 'badge orange',
    red: 'badge red',
    purple: 'badge purple',
  };
  return map[variant] || 'badge blue';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CasesTable({ cases }: CasesTableProps) {
  const t = useTranslations('CasesTable');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalCount = cases.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCases = cases.slice(startIndex, startIndex + pageSize);

  return (
    <>
      {/* Table Card */}
      <div className="table-card">
        <div className="table-head">
          <div className="th">{t('caseCode')}</div>
          <div className="th">{t('requestType')}</div>
          <div className="th">{t('status')}</div>
          <div className="th">{t('assignee')}</div>
          <div className="th">{t('lastUpdated')}</div>
          <div className="th">{t('actions')}</div>
        </div>

        {paginatedCases.length === 0 ? (
          <div className="empty-state">{t('noCases')}</div>
        ) : (
          paginatedCases.map((c) => (
            <div key={c.id} className="table-row">
              <div className="td">
                <div className="case-main">
                  <div className="case-icon">📄</div>
                  <div className="case-info">
                    <strong>{c.code}</strong>
                    <span>{c.statusText}</span>
                  </div>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{c.title}</strong>
                  <span>{c.matterType}</span>
                </div>
              </div>
              <div className="td">
                <span className={getStatusBadgeClass(c.statusVariant)}>{c.statusText}</span>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{c.assignee}</strong>
                  <span>{c.assigneeRole}</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{formatDate(c.updatedAt)}</strong>
                </div>
              </div>
              <div className="td">
                <a className="action-link" href={`/cases/${c.id}`}>
                  {t('viewDetails')} →
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paging */}
      {totalCount > 0 && (
        <Paging
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
}
