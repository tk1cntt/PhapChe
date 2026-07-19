'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import Paging from '@/components/ui/Paging';
import { ReviewDialog } from './ReviewDialog';
import { AiAssistantPanel } from './AiAssistantPanel';

interface ReviewRequest {
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
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  pending: number;
  approved: number;
  revisionRequired: number;
}

interface ReviewResponse {
  data: ReviewRequest[];
  stats: ReviewStats;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#ffe4e6', color: '#dc2626' },
  MEDIUM: { bg: '#ffedd5', color: '#ea580c' },
  LOW: { bg: '#ccfbf1', color: '#0d9488' },
};

export function ReviewConsole() {
  const t = useTranslations('ReviewConsole');
  const tStatus = useTranslations('RequestStatus');
  const tMatter = useTranslations('MatterTypes');
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [dialogTarget, setDialogTarget] = useState<ReviewRequest | null>(null);
  const [aiTarget, setAiTarget] = useState<{ id: string; title: string; matterTypeKey: string | null } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');
      if (search) params.set('search', search);

      const res = await fetch(`/api/partner/requests/pending-review?${params}`);
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
          className={`triage-stat clickable${statusFilter === 'pending_review' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'pending_review' ? 'all' : 'pending_review'); setPage(1); }}
        >
          <div className="stat-value">{s?.pending ?? 0}</div>
          <div className="stat-label">{tStatus('pending_review') || t('statPending')}</div>
        </div>
        <div
          className={`triage-stat clickable${statusFilter === 'approved' ? ' highlight' : ''}`}
          onClick={() => { setStatusFilter(p => p === 'approved' ? 'all' : 'approved'); setPage(1); }}
        >
          <div className="stat-value">{s?.approved ?? 0}</div>
          <div className="stat-label">{tStatus('approved') || t('statApproved')}</div>
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

      {/* List */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="triage-list">
          <div className="triage-header-row">
            <span className="col-code">{t('colCode')}</span>
            <span className="col-title">{t('colTitle')}</span>
            <span className="col-customer">{t('colCustomer')}</span>
            <span className="col-workspace">{t('colWorkspace')}</span>
            <span className="col-type">{t('colType')}</span>
            <span className="col-priority">{t('colPriority')}</span>
            <span className="col-specialist">{t('colSpecialist')}</span>
            <span className="col-action">{t('colAction')}</span>
          </div>

          {filteredData.map(req => {
            const pBadge = PRIORITY_STYLE[req.priority] || PRIORITY_STYLE.MEDIUM;
            const matterLabel = req.matterTypeKey ? (tMatter(req.matterTypeKey as any) as string) : '—';

            return (
              <div key={req.id} className="triage-row">
                <span className="col-code" title={req.code}>{req.code}</span>
                <span className="col-title">
                  <div className="title-text">{req.title}</div>
                  {req.specialistName && <div className="title-desc">{t('specialistLabel')}: {req.specialistName}</div>}
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
                <span className="col-specialist">{req.specialistName || '—'}</span>
                <span className="col-action">
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="approve-btn"
                      onClick={() => setDialogTarget({ ...req, _reviewAction: 'approve' } as any)}
                      style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
                    >
                      {t('btnApprove')}
                    </button>
                    <button
                      className="revise-btn"
                      onClick={() => setDialogTarget({ ...req, _reviewAction: 'revise' } as any)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                      {t('btnRevise')}
                    </button>
                    <button
                      type="button"
                      className="ai-btn"
                      onClick={() => setAiTarget(aiTarget?.id === req.id ? null : { id: req.id, title: req.title, matterTypeKey: req.matterTypeKey })}
                      title={t('btnAiAssist')}
                      style={{
                        background: aiTarget?.id === req.id ? '#f3e8ff' : 'transparent',
                        color: aiTarget?.id === req.id ? '#9333ea' : '#a78bfa',
                        border: '1px solid #e9d5ff',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      data-testid={`ai-btn-${req.id}`}
                    >
                      <Sparkles size={12} />
                      AI
                    </button>
                  </div>
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

      {/* AI Assistant Panel */}
      {aiTarget && (
        <div className="mt-4">
          <AiAssistantPanel
            requestId={aiTarget.id}
            requestTitle={aiTarget.title}
            matterTypeKey={aiTarget.matterTypeKey}
          />
        </div>
      )}

      {/* Review Dialog */}
      {dialogTarget && (
        <ReviewDialog
          request={dialogTarget}
          defaultAction={(dialogTarget as any)._reviewAction || 'approve'}
          onClose={() => setDialogTarget(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
