'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminStatGrid, StatCardProps } from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminRequestsTable, { RequestRow } from '@/components/admin/AdminRequestsTable';

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
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
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
  }, [page, debouncedSearch, statusFilter, priorityFilter, workspaceFilter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ErrorDisplay = () => (
    <div className="bg-white border rounded-[15px] p-8">
      <div className="flex items-center gap-3 text-red-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div><strong className="block">Lỗi khi tải dữ liệu</strong><span className="text-sm text-red-500">{error}</span></div>
      </div>
      <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">Thử lại</button>
    </div>
  );
  const handleWorkspaceChange = (workspaceId: string | null) => {
    setWorkspaceFilter(workspaceId);
    setPage(1);
  };

  const handleActionClick = (row: RequestRow) => {
    const action = row.action;
    const fullId = row.fullId || row.id;
    if (action === 'Điều phối') { console.log('Open dispatch modal for:', fullId); }
    else if (action === 'Xem') {
      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/requests/${fullId}`);
    } else if (action === 'Audit' || action === 'Xem log') {
      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/audit?requestId=${fullId}`);
    }
  };

  const handleSearch = (query: string) => { setSearch(query); };
  const handleFilter = () => { console.log('Open filter modal'); };
  const handleExport = () => { console.log('Export to CSV'); };
  const handleRefresh = () => { fetchData(); };

  const statCards = [
    { title: 'Tổng số yêu cầu', value: stats.total, description: 'Tất cả yêu cầu pháp lý', variant: 'blue' as const },
    { title: 'Chờ xử lý', value: stats.pending, description: 'Yêu cầu cần phân công', variant: 'orange' as const },
    { title: 'Đã duyệt', value: stats.approved, description: 'Đã duyệt & đã giao', variant: 'green' as const },
    { title: 'Ưu tiên cao', value: stats.highPriority, description: 'Yêu cầu ưu tiên HIGH', variant: 'red' as const },
  ];

  const toolbarTranslations = {
    searchPlaceholder: 'Tìm hồ sơ, mã yêu cầu...',
    filter: 'Bộ lọc',
    status: 'Trạng thái',
    workspace: 'Workspace',
    export: 'Export',
    columns: 'Cột hiển thị',
    refresh: 'Làm mới',
    allWorkspaces: 'Tất cả workspaces',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Yêu cầu pháp lý</h1>
        <p className="text-sm text-[#64748b]">Quản lý và theo dõi các yêu cầu pháp lý</p>
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
          <div className="text-[#64748b]">Đang tải...</div>
        </div>
      ) : !error ? (
        <>
          <AdminRequestsTable rows={requests} />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[#64748b]">Trang {page} / {totalPages} ({total} kết quả)</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white" style={{ borderColor: 'var(--border)' }}>Trước</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white" style={{ borderColor: 'var(--border)' }}>Sau</button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}