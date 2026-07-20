'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Paging from '@/components/ui/Paging';
import RequestCard from './RequestCard';
import { DeliveryDialog } from './DeliveryDialog';
import { formatDate } from '@/lib/i18n/date-format';

interface DeliveryRequest {
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
  specialistName: string | null;
  reviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryStats {
  approved: number;
  delivered: number;
  closed: number;
}

interface DeliveryResponse {
  data: DeliveryRequest[];
  stats: DeliveryStats;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  approved: { bg: '#dcfce7', color: '#16a34a' },
  delivered: { bg: '#dbeafe', color: '#2563eb' },
  closed: { bg: '#f1f5f9', color: '#64748b' },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#ffe4e6', color: '#dc2626' },
  MEDIUM: { bg: '#ffedd5', color: '#ea580c' },
  LOW: { bg: '#ccfbf1', color: '#0d9488' },
};

export function DeliveryConsole() {
  const t = useTranslations('DeliveryConsole');
  const tStatus = useTranslations('RequestStatus');
  const tMatter = useTranslations('MatterTypes');
  const locale = useLocale();
  const [data, setData] = useState<DeliveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [dialogTarget, setDialogTarget] = useState<DeliveryRequest | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/requests/delivery?${params}`);
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
  }, [page, search, statusFilter, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDialogSuccess = () => {
    setDialogTarget(null);
    fetchData();
  };

  const s = data?.stats;

  return (
    <div className="workbench-panel">
      {/* Stats Row */}
      <div className="triage-stats">
        <div
          className={`triage-stat clickable${statusFilter === 'approved' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'approved' ? 'all' : 'approved'); setPage(1); }}
        >
          <div className="stat-value">{s?.approved ?? 0}</div>
          <div className="stat-label">{tStatus('approved') || t('statApproved')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'delivered' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'delivered' ? 'all' : 'delivered'); setPage(1); }}
        >
          <div className="stat-value">{s?.delivered ?? 0}</div>
          <div className="stat-label">{tStatus('delivered') || t('statDelivered')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'closed' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'closed' ? 'all' : 'closed'); setPage(1); }}
        >
          <div className="stat-value">{s?.closed ?? 0}</div>
          <div className="stat-label">{tStatus('closed') || t('statClosed')}</div>
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
          <option value="approved">{tStatus('approved')}</option>
          <option value="delivered">{tStatus('delivered')}</option>
          <option value="closed">{tStatus('closed')}</option>
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
      {!loading && !error && data && data.data.length === 0 && (
        <div className="triage-empty">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>{t('emptyTitle')}</h3>
          <p>{t('emptyDesc')}</p>
        </div>
      )}

      {/* Request Cards */}
      {!loading && !error && data && data.data.length > 0 && (
        <div className="request-cards-grid">
          {data.data.map(req => {
            const sBadge = STATUS_STYLE[req.status] || STATUS_STYLE.approved;
            const pBadge = PRIORITY_STYLE[req.priority] || PRIORITY_STYLE.MEDIUM;
            const matterLabel = req.matterTypeKey ? (tMatter(req.matterTypeKey as any) as string) : '—';

            let actionLabel = '';
            if (req.status === 'approved') { actionLabel = t('btnDeliver'); }
            else if (req.status === 'delivered') { actionLabel = t('btnClose'); }

            const subtitleParts: string[] = [];
            if (req.specialistName) subtitleParts.push(`${t('specialistLabel')}: ${req.specialistName}`);
            if (req.reviewerName) subtitleParts.push(`${t('reviewerLabel')}: ${req.reviewerName}`);

            return (
              <RequestCard
                key={req.id}
                code={req.code}
                title={req.title}
                subtitle={subtitleParts.length > 0 ? subtitleParts.join(' | ') : undefined}
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
                  window.location.href = `/${locale}/admin/requests/${req.id}/chat`;
                }}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && data && data.data.length > 0 && (
        <Paging
          current={page}
          pageSize={10}
          total={data?.total ?? 0}
          onChange={(p) => setPage(p)}
        />
      )}

      {/* Delivery Dialog */}
      {dialogTarget && (
        <DeliveryDialog
          request={dialogTarget}
          onClose={() => setDialogTarget(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
