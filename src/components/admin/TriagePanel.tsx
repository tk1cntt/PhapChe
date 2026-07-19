'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Paging from '@/components/ui/Paging';
import { AssignmentDialog } from './AssignmentDialog';

interface TriageRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  customerName: string;
  customerEmail: string;
  matterTypeKey: string | null;
  status: string;
  priority: string;
  date: string;
  hasAnswers: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
}

interface TriageResponse {
  data: TriageRequest[];
  specialists: StaffMember[];
  reviewers: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft_intake: { bg: '#f1f5f9', color: '#64748b', label: 'Nháp' },
  triage: { bg: '#dbeafe', color: '#2563eb', label: 'Cần phân loại' },
};

const PRIORITY_BADGE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#ffe4e6', color: '#dc2626' },
  MEDIUM: { bg: '#ffedd5', color: '#ea580c' },
  LOW: { bg: '#ccfbf1', color: '#0d9488' },
};

export function TriagePanel() {
  const t = useTranslations('AdminTriage');
  const tStatus = useTranslations('RequestStatus');
  const tMatter = useTranslations('MatterTypes');
  const [data, setData] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<TriageRequest | null>(null);

  const fetchTriage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/requests/triage?${params}`);
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

  useEffect(() => {
    fetchTriage();
  }, [fetchTriage]);

  const handleAssignSuccess = () => {
    setAssignTarget(null);
    fetchTriage();
  };

  const filteredData = (data?.data ?? []).filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const draftCount = data?.data.filter(r => r.status === 'draft_intake').length ?? 0;
  const triageCount = data?.data.filter(r => r.status === 'triage').length ?? 0;

  return (
    <div className="triage-panel">
      {/* Stats Row */}
      <div className="triage-stats">
        <div
          className={`triage-stat clickable${statusFilter === 'all' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter('all'); setPage(1); }}
        >
          <div className="stat-value">{data?.total ?? 0}</div>
          <div className="stat-label">{t('statTotal')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'triage' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'triage' ? 'all' : 'triage'); setPage(1); }}
        >
          <div className="stat-value">{triageCount}</div>
          <div className="stat-label">{t('statNeedsTriage')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'draft_intake' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'draft_intake' ? 'all' : 'draft_intake'); setPage(1); }}
        >
          <div className="stat-value">{draftCount}</div>
          <div className="stat-label">{t('statDraft')}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
          <option value="draft_intake">{tStatus('draft_intake')}</option>
          <option value="triage">{tStatus('triage')}</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="triage-loading">
          <div className="spinner" />
          <span>{t('loading')}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="triage-error">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={fetchTriage} className="retry-btn">{t('retry')}</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="triage-empty">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>{t('emptyTitle')}</h3>
          <p>{t('emptyDesc')}</p>
        </div>
      )}

      {/* Request List */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="triage-list">
          <div className="triage-header-row">
            <span className="col-code">{t('colCode')}</span>
            <span className="col-title">{t('colTitle')}</span>
            <span className="col-customer">{t('colCustomer')}</span>
            <span className="col-workspace">{t('colWorkspace')}</span>
            <span className="col-type">{t('colType')}</span>
            <span className="col-priority">{t('colPriority')}</span>
            <span className="col-status">{t('colStatus')}</span>
            <span className="col-action">{t('colAction')}</span>
          </div>

          {filteredData.map(req => {
            const sBadge = STATUS_BADGE[req.status] || STATUS_BADGE.draft_intake;
            const pBadge = PRIORITY_BADGE[req.priority] || PRIORITY_BADGE.MEDIUM;
            const matterLabel = req.matterTypeKey ? (tMatter(req.matterTypeKey as any) as string) : '—';

            return (
              <div key={req.id} className="triage-row">
                <span className="col-code" title={req.code}>{req.code}</span>
                <span className="col-title">
                  <div className="title-text">{req.title}</div>
                  {req.description && <div className="title-desc">{req.description.slice(0, 80)}{req.description.length > 80 ? '...' : ''}</div>}
                </span>
                <span className="col-customer">
                  <div className="customer-name">{req.customerName}</div>
                  <div className="customer-email">{req.customerEmail}</div>
                </span>
                <span className="col-workspace">{req.workspaceName}</span>
                <span className="col-type">{matterLabel}</span>
                <span className="col-priority">
                  <span className="priority-badge" style={{ background: pBadge.bg, color: pBadge.color }}>
                    {req.priority}
                  </span>
                </span>
                <span className="col-status">
                  <span className="status-badge" style={{ background: sBadge.bg, color: sBadge.color }}>
                    {sBadge.label}
                  </span>
                </span>
                <span className="col-action">
                  <button
                    className="assign-btn"
                    onClick={() => setAssignTarget(req)}
                  >
                    {t('btnAssign')}
                  </button>
                </span>
              </div>
            );
          })}

          {/* Pagination */}
          <Paging
            current={page}
            pageSize={10}
            total={data.total}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Assignment Dialog */}
      {assignTarget && data && (
        <AssignmentDialog
          request={assignTarget}
          specialists={data.specialists}
          reviewers={data.reviewers}
          onClose={() => setAssignTarget(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}
