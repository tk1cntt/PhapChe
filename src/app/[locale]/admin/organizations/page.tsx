'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminStatGrid } from '@/components/admin/AdminStatGrid';

interface Organization {
  id: string;
  name: string;
  tenantId: string;
  tenant?: { id: string; name: string };
  businessType: string | null;
  registrationNumber: string | null;
  address: string | null;
  contactEmail: string | null;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    workspaces: number;
  };
}

interface ApiResponse {
  data: Organization[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const t = useTranslations('AdminOrganizations');
  const tCommon = useTranslations('Common');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(20);
  const [search, setSearch] = useState('');
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
        skip: ((page - 1) * take).toString(),
        take: take.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/admin/organizations?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }

      const data: ApiResponse = await response.json();
      setOrganizations(data.data);
      setTotal(data.pagination.total);

      // Calculate stats
      const statsCalc: Stats = {
        total: data.pagination.total,
        active: data.data.filter(o => o.status === 'active').length,
        inactive: data.data.filter(o => o.status === 'inactive').length,
      };
      setStats(statsCalc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organizations';
      setError(errorMessage);
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, take, debouncedSearch, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (query: string) => { setSearch(query); };
  const handleRefresh = () => { fetchData(); };
  const handleCreate = () => {
    const locale = window.location.pathname.split('/')[1] || 'vi';
    router.push(`/${locale}/admin/organizations/new`);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
  };

  const statCards = [
    { title: t('statTotal'), value: stats.total, description: t('statTotalDesc'), variant: 'blue' as const },
    { title: t('statActive'), value: stats.active, description: t('statActiveDesc'), variant: 'green' as const },
    { title: t('statInactive'), value: stats.inactive, description: t('statInactiveDesc'), variant: 'gray' as const },
  ];

  const totalPages = Math.ceil(total / take);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('create')}
        </button>
      </div>

      {/* Stats Grid */}
      <AdminStatGrid cards={statCards} />

      {/* Toolbar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('refresh')}
        </button>
      </div>

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
          <div className="bg-white border rounded-[15px] overflow-hidden" style={{ borderColor: '#dfe7f1', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colName')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colBusinessType')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colWorkspaces')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colStatus')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {t('emptyTitle')}
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-teal-700 font-semibold text-sm">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {org.name}
                              {org.isDefault && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                  {t('default')}
                                </span>
                              )}
                            </div>
                            {org.contactEmail && (
                              <div className="text-xs text-gray-500">{org.contactEmail}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {org.businessType || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {org._count?.workspaces || 0} {t('workspaces')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(org.status)}`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            const locale = window.location.pathname.split('/')[1] || 'vi';
                            router.push(`/${locale}/admin/organizations/${org.id}`);
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
                {t('showing')} {(page - 1) * take + 1} - {Math.min(page * take, total)} {t('of')} {total} {t('organizations')}
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
