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

const badgeStyles: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  inactive: { bg: '#f1f5f9', color: '#64748b', dot: '#64748b' },
  pending: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
};

function StatusBadge({ status }: { status: string }) {
  const style = badgeStyles[status] || badgeStyles.inactive;
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
  };
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
      {labels[status] || status}
    </span>
  );
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

  const handleRefresh = () => { fetchData(); };
  const handleCreate = () => {
    const locale = window.location.pathname.split('/')[1] || 'vi';
    router.push(`/${locale}/admin/organizations/new`);
  };

  const statCards = [
    { title: t('statTotal'), value: stats.total, description: t('statTotalDesc'), variant: 'blue' as const },
    { title: t('statActive'), value: stats.active, description: t('statActiveDesc'), variant: 'green' as const },
    { title: t('statInactive'), value: stats.inactive, description: t('statInactiveDesc'), variant: 'purple' as const },
  ];

  const totalPages = Math.ceil(total / take);

  // Column translations
  const columns = {
    name: t('colName'),
    businessType: t('colBusinessType'),
    workspaces: t('colWorkspaces'),
    status: t('colStatus'),
    action: t('colActions'),
  };

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
          <div
            className="bg-white border rounded-[15px] overflow-hidden"
            style={{ borderColor: '#dfe7f1', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)' }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.7fr',
                background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
                borderBottom: '1px solid #dfe7f1',
              }}
            >
              {[columns.name, columns.businessType, columns.workspaces, columns.status, columns.action].map((header, i) => (
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
                    borderRight: i === 4 ? 'none' : '1px solid #dfe7f1',
                  }}
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {organizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-1">{t('emptyTitle')}</h3>
              </div>
            ) : (
              /* Table Rows */
              organizations.map((org, rowIndex) => (
                <div
                  key={org.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.7fr',
                    minHeight: 68,
                    borderBottom: rowIndex === organizations.length - 1 ? 'none' : '1px solid #dfe7f1',
                    background: '#fff',
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fbfdff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #ccfbf1, #eefbf8)', color: '#0f766e' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="text-sm font-bold text-[#0f172a]">{org.name}</span>
                          {org.isDefault && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: 20,
                                padding: '0 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 800,
                                background: '#ccfbf1',
                                color: '#0f766e',
                              }}
                            >
                              {t('default')}
                            </span>
                          )}
                        </div>
                        {org.contactEmail && (
                          <span style={{ fontSize: 12, color: '#64748b' }}>{org.contactEmail}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Type */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
                    <span>{org.businessType || '—'}</span>
                  </div>

                  {/* Workspaces */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1' }}>
                    <span>{org._count?.workspaces || 0}</span>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: '1px solid #dfe7f1' }}>
                    <StatusBadge status={org.status} />
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 14, color: '#0f172a', fontWeight: 500, borderRight: 'none' }}>
                    <button
                      onClick={() => {
                        const locale = window.location.pathname.split('/')[1] || 'vi';
                        router.push(`/${locale}/admin/organizations/${org.id}`);
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
