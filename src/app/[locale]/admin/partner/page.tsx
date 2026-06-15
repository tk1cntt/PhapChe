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
    return '-';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
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
        <div className="bg-white border rounded-[15px] p-8 flex items-center justify-center">
          <div className="text-[#64748b]">{tCommon('loading')}</div>
        </div>
      ) : !error ? (
        <>
          <div className="bg-white border rounded-[15px] overflow-hidden border-[#dfe7f1] shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colId')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colPartner')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colCustomer')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colStatus')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colUpdated')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {t('emptyTitle')}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">{req.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{getPartnerName(req)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{req.customer?.name || '-'}</div>
                        {req.customer?.email && (
                          <div className="text-xs text-gray-500">{req.customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                          {REQUEST_STATUS_LABELS[req.status] || req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(req.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            const locale = window.location.pathname.split('/')[1] || 'vi';
                            router.push(`/${locale}/admin/partner/${req.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
