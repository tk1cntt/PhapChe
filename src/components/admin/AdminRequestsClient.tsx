'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminStatGrid, StatCardProps } from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminRequestsTable, { RequestRow } from '@/components/admin/AdminRequestsTable';
import Paging from '@/components/ui/Paging';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  highPriority: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface ApiResponse {
  data: RequestRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: Stats;
  workspaces?: Workspace[];
}

export default function AdminRequestsClient() {
  const router = useRouter();
  const t = useTranslations('AdminRequests');
  const tCommon = useTranslations('Common');
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
        pageSize: pageSize.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (workspaceFilter) params.set('workspace', workspaceFilter);

      const response = await fetch(`/api/admin/requests?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.data);
      setTotal(data.total);
      setStats(data.stats);
      if (data.workspaces) setWorkspaces(data.workspaces);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requests';
      setError(errorMessage);
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter, workspaceFilter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ErrorDisplay = () => (
    <div className="bg-white border rounded-[15px] p-8">
      <div className="flex items-center gap-3 text-red-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div><strong className="block">{tCommon('error')}</strong><span className="text-sm text-red-500">{error}</span></div>
      </div>
      <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">{t('retry') || 'Thử lại'}</button>
    </div>
  );
  const handleWorkspaceChange = (workspaceId: string | null) => {
    setWorkspaceFilter(workspaceId);
    setPage(1);
  };

  const handleActionClick = (row: RequestRow) => {
    const action = row.action;
    const fullId = row.fullId || row.id;
    if (action === t('dispatch') || action === 'Dispatch') { console.log('Open dispatch modal for:', fullId); }
    else if (action === t('view') || action === 'View') {
      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/requests/${fullId}`);
    } else if (action === t('audit') || action === 'Audit') {
      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/audit?requestId=${fullId}`);
    }
  };

  const handleSearch = (query: string) => { setSearch(query); };
  const handleFilter = () => { console.log('Open filter modal'); };
  const handleExport = () => { console.log('Export to CSV'); };
  const handleRefresh = () => { fetchData(); };

  const statCards = [
    { title: t('statTotal'), value: stats.total, description: t('statTotalDesc') || 'All workspaces', variant: 'blue' as const },
    { title: t('statProcessing'), value: stats.pending, description: t('statProcessingDesc') || 'Awaiting specialist', variant: 'orange' as const },
    { title: t('statCompleted'), value: stats.approved, description: t('statCompletedDesc') || 'Workflow completed', variant: 'green' as const },
    { title: t('statCancelled') || 'High Priority', value: stats.highPriority, description: t('statCancelledDesc') || 'Near deadline', variant: 'red' as const },
  ];

  const toolbarTranslations = {
    searchPlaceholder: t('searchPlaceholder'),
    filter: tCommon('filter'),
    status: tCommon('status'),
    workspace: t('workspace'),
    export: tCommon('export'),
    columns: t('columns') || 'Columns',
    refresh: t('refresh') || 'Refresh',
    allWorkspaces: t('allWorkspaces') || 'All workspaces',
  };

  const tableTranslations = {
    code: t('code'),
    workspace: t('workspace'),
    customer: t('customer'),
    status: t('status'),
    requestType: t('requestType'),
    assignee: t('assignee'),
    action: t('action'),
    dispatch: t('dispatch') || 'Dispatch',
    view: t('view') || 'View',
    audit: t('audit') || 'Audit',
    emptyTitle: t('emptyTitle') || 'No requests',
    emptyDesc: t('emptyDesc') || 'Request list is empty.',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
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
          data-testid="admin-requests-create"
          className="h-[45px] px-[18px] border-0 rounded-[8px] text-white flex items-center gap-[10px] font-bold text-sm"
          style={{
            background: 'linear-gradient(180deg, #3ba3e7, #2389d0)',
            boxShadow: '0 8px 18px rgba(35, 137, 208, 0.25)',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
          {t('createButton')}
        </button>
      </div>

      <AdminStatGrid cards={statCards} />

      <AdminToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onWorkspaceChange={handleWorkspaceChange}
        workspaces={workspaces}
        selectedWorkspace={workspaceFilter}
        isSuperAdmin={isSuperAdmin}
        translations={toolbarTranslations}
      />

      {error && <ErrorDisplay />}

      {loading ? (
        <div className="bg-white border rounded-[15px] p-8 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[#64748b]">{tCommon('loading')}</div>
        </div>
      ) : !error ? (
        <>
          <AdminRequestsTable rows={requests} translations={tableTranslations} />

          {totalPages > 1 && (
            <Paging
              current={page}
              pageSize={pageSize}
              total={total}
              totalLabel={`${total} ${t('totalLabel') || 'requests'}`}
              onChange={(nextPage, nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(nextPage);
              }}
            />
          )}
        </>
      ) : null}

      {/* Floating SLA warning button */}
      {stats.highPriority > 0 && (
        <div data-testid="admin-requests-floating-issue" className="fixed right-[22px] bottom-[20px] min-w-[118px] h-[48px] rounded-[999px] flex items-center justify-center gap-2 text-white font-bold px-[14px]"
          style={{
            background: 'linear-gradient(180deg, #ef4444, #dc2626)',
            border: '3px solid #facc15',
            boxShadow: '0 12px 26px rgba(15, 23, 42, 0.22)',
          }}
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
            N
          </span>
          <span>{stats.highPriority} Issue ×</span>
        </div>
      )}
    </div>
  );
}
