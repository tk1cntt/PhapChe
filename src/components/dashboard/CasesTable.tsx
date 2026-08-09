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

export default function CasesTable({ cases }: CasesTableProps) {
  const t = useTranslations('CasesTable');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalCount = cases.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCases = cases.slice(startIndex, startIndex + pageSize);

  if (cases.length === 0) {
    return (
      <div className="table-card">
        <div className="empty-state">{t('noCases')}</div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop: Table ── */}
      <div className="table-card cases-table-desktop">
        <div className="table-head">
          <div className="th">{t('caseCode')}</div>
          <div className="th">{t('requestType')}</div>
          <div className="th">{t('status')}</div>
          <div className="th">{t('assignee')}</div>
          <div className="th">{t('lastUpdated')}</div>
          <div className="th">{t('actions')}</div>
        </div>

        {paginatedCases.map((c) => (
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
                <strong>{c.formattedDate}</strong>
              </div>
            </div>
            <div className="td">
              <a className="action-link" href={`/cases/${c.id}`}>
                {t('viewDetails')} →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile: Card list ── */}
      <div className="cases-cards-mobile">
        {paginatedCases.map((c) => (
          <a key={c.id} href={`/cases/${c.id}`} className="case-card-mobile">
            <div className="case-card-mobile-top">
              <div className="case-card-mobile-code">
                <span className="case-card-mobile-icon">📄</span>
                <strong>{c.code}</strong>
              </div>
              <span className={getStatusBadgeClass(c.statusVariant)}>{c.statusText}</span>
            </div>
            <div className="case-card-mobile-body">
              <p className="case-card-mobile-title">{c.title}</p>
              <span className="case-card-mobile-type">{c.matterType}</span>
            </div>
            <div className="case-card-mobile-footer">
              <div className="case-card-mobile-assignee">
                <span>{c.assignee}</span>
                <span className="case-card-mobile-role">{c.assigneeRole}</span>
              </div>
              <span className="case-card-mobile-date">{c.formattedDate}</span>
            </div>
          </a>
        ))}
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
