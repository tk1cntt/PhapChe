'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import Paging from '@/components/ui/Paging';
import { REQUEST_STATUS_LABELS } from '@/lib/constants/partner-statuses';
import './partner.css';

interface PartnerRequest {
  id: string;
  status: string;
  statusNote?: string | null;
  title: string;
  description?: string;
  assignedPartner?: { id: string; name: string };
  engagement?: {
    partnerId: string;
    partner: { name: string };
  };
  customer?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
}

interface ApiResponse {
  data: PartnerRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const badgeStyles: Record<string, { bg: string; color: string; dot: string }> = {
  completed: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  delivered: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  in_progress: { bg: '#dbeafe', color: '#2563eb', dot: '#3b82f6' },
  pending_review: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
  cancelled: { bg: '#ffe4e6', color: '#ef4444', dot: '#ef4444' },
};

function StatusBadge({ status }: { status: string }) {
  const style = badgeStyles[status] || { bg: '#f1f5f9', color: '#64748b', dot: '#64748b' };
  const label = REQUEST_STATUS_LABELS[status] || status;
  return (
    <span className="status-badge" style={{ background: style.bg, color: style.color }}>
      <span className="status-dot" style={{ background: style.dot }} />
      {label}
    </span>
  );
}

export default function AdminPartnerPage() {
  const router = useRouter();
  const t = useTranslations('AdminPartner');
  const tCommon = useTranslations('Common');

  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, inProgress: 0, pendingReview: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/partner/requests?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Failed to fetch requests');
      }

      const data: ApiResponse = await response.json();
      setRequests(data.data);
      setTotal(data.pagination.total);

      // Calculate stats from data
      const statsCalc: Stats = {
        total: data.pagination.total,
        inProgress: data.data.filter(r => r.status === 'in_progress').length,
        pendingReview: data.data.filter(r => r.status === 'pending_review').length,
        completed: data.data.filter(r => r.status === 'completed' || r.status === 'delivered').length,
      };
      setStats(statsCalc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requests';
      setError(errorMessage);
      console.error('Error fetching partner requests:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (query: string) => { setSearch(query); };
  const handleFilter = () => { console.log('Open filter modal'); };
  const handleExport = () => { console.log('Export to CSV'); };
  const handleRefresh = () => { fetchData(); };

  const getPartnerName = (req: PartnerRequest) => {
    if (req.assignedPartner?.name) return req.assignedPartner.name;
    if (req.engagement?.partner?.name) return req.engagement.partner.name;
    return '—';
  };

  const getCustomerInitials = (name: string) => {
    if (!name) return '—';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const statCards = [
    { title: t('statTotal'), value: stats.total, description: t('statTotalDesc'), variant: 'blue' as const },
    { title: t('statInProgress'), value: stats.inProgress, description: t('statInProgressDesc'), variant: 'orange' as const },
    { title: t('statPendingReview'), value: stats.pendingReview, description: t('statPendingReviewDesc'), variant: 'purple' as const },
    { title: t('statCompleted'), value: stats.completed, description: t('statCompletedDesc'), variant: 'green' as const },
  ];

  const toolbarTranslations = {
    searchPlaceholder: t('searchPlaceholder'),
    filter: tCommon('filter'),
    status: tCommon('status'),
    export: tCommon('export'),
    refresh: t('refresh'),
  };

  // Column translations
  const columns = {
    id: t('colId'),
    partner: t('colPartner'),
    customer: t('colCustomer'),
    status: t('colStatus'),
    updated: t('colUpdated'),
    action: t('colActions'),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-3">
            {t('pageTitle')}
          </h1>
          <p className="text-sm font-medium text-slate-500 m-0">
            {t('pageDescription')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <AdminStatGrid cards={statCards} />

      {/* Toolbar */}
      <AdminToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        translations={toolbarTranslations}
      />

      {/* Error Display */}
      {error && (
        <div className="error-state">
          <div className="flex items-center gap-3 text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="block">{tCommon('error')}</strong>
              <span className="text-sm text-red-500">{error}</span>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-state">
          <div className="text-[#64748b]">{tCommon('loading')}</div>
        </div>
      ) : !error ? (
        <>
          <div className="table-container">
            {/* Table Header */}
            <div className="table-head" style={{ gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr 0.9fr 0.7fr' }}>
              {[columns.id, columns.partner, columns.customer, columns.status, columns.updated, columns.action].map((header, i) => (
                <div key={i} className="th" style={{ borderRight: i === 5 ? 'none' : '1px solid #dfe7f1' }}>
                  {header}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-1">{t('emptyTitle')}</h3>
              </div>
            ) : (
              /* Table Rows */
              requests.map((req, rowIndex) => (
                <div
                  key={req.id}
                  className="table-row"
                  style={{ gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr 0.9fr 0.7fr', borderBottom: rowIndex === requests.length - 1 ? 'none' : '1px solid #dfe7f1' }}
                >
                  {/* ID */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <div className="id-badge">
                      <div className="icon-badge" style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-[#0f172a] font-mono">{req.id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Partner */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <span>{getPartnerName(req)}</span>
                  </div>

                  {/* Customer */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <div className="flex items-center gap-3">
                      <div className="customer-avatar">
                        {getCustomerInitials(req.customer?.name || '')}
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{req.customer?.name || '—'}</span>
                        {req.customer?.email && (
                          <span className="text-xs text-[#64748b] block">{req.customer.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1' }}>
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Updated */}
                  <div className="td" style={{ borderRight: '1px solid #dfe7f1', color: '#64748b' }}>
                    {new Date(req.updatedAt).toLocaleDateString()}
                  </div>

                  {/* Action */}
                  <div className="td" style={{ borderRight: 'none' }}>
                    <button
                      className="action-link"
                      onClick={() => {
                        const locale = window.location.pathname.split('/')[1] || 'vi';
                        router.push(`/${locale}/admin/requests/${req.id}`);
                      }}
                    >
                      {t('view')} →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Paging
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(newPage, newPageSize) => {
              setPage(newPage);
              if (newPageSize !== pageSize) setPageSize(newPageSize);
            }}
            pageSizeOptions={[10, 25, 50]}
            totalLabel={`${t('of')} ${total} ${t('requests')}`}
          />
        </>
      ) : null}
    </div>
  );
}
