'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Paging from '@/components/ui/Paging';
import { CaseItem } from './DashboardClient';

interface CasesTableProps {
  cases: CaseItem[];
}

const STATUS_BADGE_MAP: Record<string, string> = {
  green: 'badge green',
  blue: 'badge blue',
  orange: 'badge orange',
  red: 'badge red',
  purple: 'badge purple',
};

function getStatusBadgeClass(variant: string): string {
  return STATUS_BADGE_MAP[variant] || 'badge blue';
}
}
export default function CasesTable({ cases }: CasesTableProps) {
  const t = useTranslations('CasesTable');
  const [currentPage, setCurrentPage] = useState(1);
const DEFAULT_PAGE_SIZE = 10;

  // … inside component:
  const pageSize = DEFAULT_PAGE_SIZE;

  // … inside component:
  const pageSize = DEFAULT_PAGE_SIZE;
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
interface CaseRowProps {
  caseItem: CaseItem;
  viewDetailsLabel: string;
}

function CaseRow({ caseItem: c, viewDetailsLabel }: CaseRowProps) {
  return (
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
          {viewDetailsLabel} →
        </a>
      </div>
    </div>
  );
}

  // usage in parent:
  {paginatedCases.map((c) => (
    <CaseRow key={c.id} caseItem={c} viewDetailsLabel={t('viewDetails')} />
  ))}
        <a className="action-link" href={`/cases/${c.id}`}>
          {viewDetailsLabel} →
        </a>
      </div>
    </div>
  );
}

  // usage in parent:
  {paginatedCases.map((c) => (
    <CaseRow key={c.id} caseItem={c} viewDetailsLabel={t('viewDetails')} />
  ))}
    </>
  );
}
