'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/ui/EmptyState';
import { CaseItem } from './DashboardClient';

interface RecentCasesProps {
  cases: CaseItem[];
}

const statusBadgeClass: Record<string, string> = {
  green: 'badge green',
  blue: 'badge blue',
  orange: 'badge orange',
  red: 'badge red',
  purple: 'badge purple',
};

export default function RecentCases({ cases }: RecentCasesProps) {
  const t = useTranslations('RecentCases');
  const router = useRouter();

  return (
    <div className="panel">
      <div className="panel-title">
        <div className="panel-title-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span>{t('title')}</span>
        </div>
        <Link className="small-link" href="/requests">{t('seeAll')}</Link>
      </div>

      <div className="case-list">
        {cases.length === 0 ? (
          <EmptyState
            icon={
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18v13H3zM3 7l3-4h12l3 4" />
              </svg>
            }
            title="Chưa có hồ sơ nào"
            description="Tạo hồ sơ mới để bắt đầu"
            action={{
              label: t('open').replace(' →', ''),
              onClick: () => router.push('/create'),
            }}
          />
        ) : (
          cases.map((c) => (
            <div key={c.id} className="case-item">
              <div className="case-main">
                <div className="case-icon">📄</div>
                <div className="case-info">
                  <strong>{c.code}</strong>
                  <span>{c.title}</span>
                </div>
              </div>
              <div className="stack">
                <strong>{c.assignee}</strong>
                <span>{c.assigneeRole}</span>
              </div>
              <div>
                <span className={statusBadgeClass[c.statusVariant] || 'badge blue'}>
                  {c.statusText}
                </span>
              </div>
              <div>
                <Link className="action-link" href={`/requests/${c.id}`}>{t('open')}</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
