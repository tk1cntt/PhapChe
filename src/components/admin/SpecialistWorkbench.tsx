'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Paging from '@/components/ui/Paging';
import RequestCard from './RequestCard';
import { UpdateStatusDialog } from './UpdateStatusDialog';
import { formatDate } from '@/lib/i18n/date-format';

interface WorkbenchRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  customerName: string;
  customerEmail: string;
  matterTypeKey: string | null;
  status: string;
  priority: string;
  reviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkbenchStats {
  assigned: number;
  inProgress: number;
  pendingReview: number;
  revisionRequired: number;
}

interface WorkbenchResponse {
  data: WorkbenchRequest[];
  stats: WorkbenchStats;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  assigned: { bg: '#f1f5f9', color: '#64748b' },
  in_progress: { bg: '#dbeafe', color: '#2563eb' },
  pending_review: { bg: '#fef3c7', color: '#d97706' },
  revision_required: { bg: '#fee2e2', color: '#dc2626' },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#ffe4e6', color: '#dc2626' },
  MEDIUM: { bg: '#ffedd5', color: '#ea580c' },
  LOW: { bg: '#ccfbf1', color: '#0d9488' },
};

export function SpecialistWorkbench() {
  const t = useTranslations('SpecialistWorkbench');
  const tStatus = useTranslations('RequestStatus');
  const tMatter = useTranslations('MatterTypes');
  const locale = useLocale();
  const [data, setData] = useState<WorkbenchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const router = useRouter();
  const [dialogTarget, setDialogTarget] = useState<WorkbenchRequest | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);

      const res = await fetch(`/api/partner/requests/my-work?${params}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError(t('errorForbidden'));
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorUnknown'));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDialogSuccess = () => {
    setDialogTarget(null);
    fetchData();
  };

  const filteredData = (data?.data ?? []).filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q)
        || item.code.toLowerCase().includes(q)
        || item.customerName.toLowerCase().includes(q);
    }
    return true;
  });

  const s = data?.stats;

  return (
    <div className="workbench-panel">
      {/* Stats Row */}
      <div className="triage-stats">
        <div
          className={`triage-stat clickable${statusFilter === 'assigned' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'assigned' ? 'all' : 'assigned'); setPage(1); }}
        >
          <div className="stat-value">{s?.assigned ?? 0}</div>
          <div className="stat-label">{tStatus('assigned') || t('statAssigned')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'in_progress' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'in_progress' ? 'all' : 'in_progress'); setPage(1); }}
        >
          <div className="stat-value">{s?.inProgress ?? 0}</div>
          <div className="stat-label">{tStatus('in_progress') || t('statInProgress')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'pending_review' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'pending_review' ? 'all' : 'pending_review'); setPage(1); }}
        >
          <div className="stat-value">{s?.pendingReview ?? 0}</div>
          <div className="stat-label">{tStatus('pending_review') || t('statPendingReview')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'revision_required' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'revision_required' ? 'all' : 'revision_required'); setPage(1); }}
        >
          <div className="stat-value">{s?.revisionRequired ?? 0}</div>
          <div className="stat-label">{tStatus('revision_required') || t('statRevision')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="triage-toolbar">
        <div className="search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="all">{t('filterAll')}</option>
          <option value="assigned">{tStatus('assigned')}</option>
          <option value="in_progress">{tStatus('in_progress')}</option>
          <option value="pending_review">{tStatus('pending_review')}</option>
          <option value="revision_required">{tStatus('revision_required')}</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="triage-loading">
          <div className="spinner" />
          <span>{t('loading')}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="triage-error">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={fetchData} className="retry-btn">{t('retry')}</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="triage-empty">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>{t('emptyTitle')}</h3>
          <p>{t('emptyDesc')}</p>
        </div>
      )}

      {/* Request Cards */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="request-cards-grid">
          {filteredData.map(req => {
            const sBadge = STATUS_STYLE[req.status] || STATUS_STYLE.assigned;
            const pBadge = PRIORITY_STYLE[req.priority] || PRIORITY_STYLE.MEDIUM;
            const matterLabel = req.matterTypeKey ? (tMatter(req.matterTypeKey as any) as string) : '—';

            let actionLabel = '';
            if (req.status === 'assigned') { actionLabel = t('btnStartWork'); }
            else if (req.status === 'in_progress') { actionLabel = t('btnSubmitReview'); }
            else if (req.status === 'revision_required') { actionLabel = t('btnResubmit'); }

            return (
              <RequestCard
                key={req.id}
                code={req.code}
                title={req.title}
                subtitle={req.reviewerName ? `${t('reviewerLabel')}: ${req.reviewerName}` : undefined}
                metaLines={[req.customerName, req.workspaceName, matterLabel]}
                priority={req.priority}
                priorityStyle={pBadge}
                statusLabel={(tStatus(req.status) as string) || req.status}
                statusStyle={sBadge}
                date={formatDate(req.createdAt, locale)}
                actionSlot={
                  actionLabel ? (
                    <button
                      className="request-card-action-btn"
                      style={{ background: 'var(--color-primary)', color: '#fff', border: 'none' }}
                      onClick={() => setDialogTarget(req)}
                    >
                      {actionLabel}
                    </button>
                  ) : null
                }
                onAiClick={() => {
                  const locale = window.location.pathname.split('/')[1] || 'vi';
                  router.push(`/${locale}/admin/requests/${req.id}/chat`);
                }}
                aiTooltip={t('btnAiAssist') ?? 'AI Assistant'}
                testId={`workbench-card-${req.id}`}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredData.length > 0 && (
        <Paging
          current={page}
          pageSize={10}
          total={data?.total ?? 0}
          onChange={(p) => setPage(p)}
        />
      )}

      {/* Update Status Dialog */}
      {dialogTarget && (
        <UpdateStatusDialog
          request={dialogTarget}
          onClose={() => setDialogTarget(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
