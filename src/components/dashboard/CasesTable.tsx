'use client';

import { useTranslations } from 'next-intl';

export interface CaseItem {
  id: string;
  code: string;
  title: string;
  matterType: string;
  status: string;
  statusVariant: string;
  statusText: string;
  assignee: string;
  assigneeRole: string;
  updatedAt: string;
}

interface CasesTableProps {
  cases: CaseItem[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
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

export default function CasesTable({
  cases,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
}: CasesTableProps) {
  const t = useTranslations('CasesTable');

  const totalPages = Math.ceil(totalCount / pageSize);
  const pagingStart = (currentPage - 1) * pageSize + 1;
  const pagingEnd = Math.min(currentPage * pageSize, totalCount);

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

        {cases.length === 0 ? (
          <div className="empty-state">{t('noCases')}</div>
        ) : (
          cases.map((c) => (
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
                <a className="action-link" href="#">
                  {t('viewDetails')} →
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paging */}
      {totalPages > 1 && (
        <div className="paging-bar">
          <span className="paging-info">
            {t('pagingInfo', { start: pagingStart, end: pagingEnd, total: totalCount })}
          </span>
          <div className="paging-controls">
            <button
              className="paging-btn"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`paging-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="paging-btn"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
