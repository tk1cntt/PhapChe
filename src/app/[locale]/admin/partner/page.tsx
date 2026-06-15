'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import { REQUEST_STATUS_LABELS } from '@/lib/constants/partner-statuses';

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
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 11px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        background: style.bg,
        color: style.color,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          marginRight: 7,
          background: style.dot,
        }}
      />
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

  const totalPages = Math.ceil(total / pageSize);

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
        <div className="bg-white border rounded-[15px] p-8 mb-6">
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
        <div className="bg-white border rounded-[15px] p-8 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[#64748b]">{tCommon('loading')}</div>
        </div>
      ) : !error ? (
        <>
          <div
            className="bg-white border rounded-[15px] overflow-hidden"
            style={{ borderColor: '#dfe7f1', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)' }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr 0.9fr 0.7fr',
                background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
                borderBottom: '1px solid #dfe7f1',
              }}
            >
              {[columns.id, columns.partner, columns.customer, columns.status, columns.updated, columns.action].map((header, i) => (
                <div
                  key={i}
                  style={{
                    minHeight: 54,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 18px',
                    color: '#59687e',
                    fontSize: 14,
                    fontWeight: 700,
                    borderRight: i === 5 ? 'none' : '1px solid #dfe7f1',
                  }}
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
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
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr 0.9fr 0.7fr',
                    minHeight: 68,
                    borderBottom: rowIndex === requests.length - 1 ? 'none' : '1px solid #dfe7f1',
                    background: '#fff',
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fbfdff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  {/* ID */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800, color: '#0f172a' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#2563eb' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-[#0f172a] font-mono">{req.id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Partner */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <span>{getPartnerName(req)}</span>
                  </div>

                  {/* Customer */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 13, background: '#eef2f7', color: '#334155' }}>
                        {req.customer?.name ? req.customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '—'}
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{req.customer?.name || '—'}</span>
                        {req.customer?.email && (
                          <span style={{ fontSize: 12, color: '#64748b' }}>{req.customer.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1' }}>
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Updated */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#64748b', fontWeight: 500, borderRight: '1px solid #dfe7f1' }}>
                    {new Date(req.updatedAt).toLocaleDateString()}
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: 'none' }}>
                    <button
                      onClick={() => {
                        const locale = window.location.pathname.split('/')[1] || 'vi';
                        router.push(`/${locale}/admin/partner/${req.id}`);
                      }}
                      style={{ color: '#087f78', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {t('view')} →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {t('showing')} {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} {t('of')} {total} {t('requests')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('prev')}
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg ${
                          page === pageNum
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
