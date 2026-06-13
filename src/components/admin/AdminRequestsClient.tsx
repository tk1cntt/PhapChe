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

interface ApiResponse {
  data: RequestRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: Stats;
}

export default function AdminRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      if (priorityFilter) {
        params.set('priority', priorityFilter);
      }

      const response = await fetch(`/api/admin/requests?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          // Redirect to login if not authorized
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch requests');
      }

      const data: ApiResponse = await response.json();
      setRequests(data.data);
      setTotal(data.total);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, priorityFilter, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle action button click
  const handleActionClick = (row: RequestRow) => {
    const action = row.action;
    const fullId = row.fullId || row.id;

    if (action === 'Điều phối') {
      // TODO: Open dispatch modal (stub for now)
      console.log('Open dispatch modal for:', fullId);
    } else if (action === 'Xem') {
      router.push(`/vi/admin/requests/${fullId}`);
    } else if (action === 'Audit' || action === 'Xem log') {
      router.push(`/vi/admin/audit?requestId=${fullId}`);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearch(query);
  };

  // Handle filter
  const handleFilter = () => {
    // TODO: Open filter modal (stub for now)
    console.log('Open filter modal');
  };

  // Handle export
  const handleExport = () => {
    // TODO: Export to CSV (stub for now)
    console.log('Export to CSV');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData();
  };

  // Stat cards configuration
  const statCards: StatCardProps[] = [
    {
      title: 'Tổng số yêu cầu',
      value: stats.total,
      description: 'Tất cả yêu cầu pháp lý',
      variant: 'blue',
    },
    {
      title: 'Chờ xử lý',
      value: stats.pending,
      description: 'Yêu cầu cần phân công',
      variant: 'orange',
    },
    {
      title: 'Đã duyệt',
      value: stats.approved,
      description: 'Đã duyệt & đã giao',
      variant: 'green',
    },
    {
      title: 'Ưu tiên cao',
      value: stats.highPriority,
      description: 'Yêu cầu ưu tiên HIGH',
      variant: 'red',
    },
  ];

  // Toolbar translations
  const toolbarTranslations = {
    searchPlaceholder: 'Tìm hồ sơ, mã yêu cầu...',
    filter: 'Bộ lọc',
    status: 'Trạng thái',
    workspace: 'Workspace',
    export: 'Export',
    columns: 'Cột hiển thị',
    refresh: 'Làm mới',
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Yêu cầu pháp lý</h1>
        <p className="text-sm text-[#64748b]">Quản lý và theo dõi các yêu cầu pháp lý</p>
      </div>

      {/* Stat Cards */}
      <AdminStatGrid cards={statCards} />

      {/* Toolbar */}
      <AdminToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        translations={toolbarTranslations}
      />

      {/* Table */}
      {loading ? (
        <div className="bg-white border rounded-[15px] p-8 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[#64748b]">Đang tải...</div>
        </div>
      ) : (
        <>
          <AdminRequestsTable rows={requests} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[#64748b]">
                Trang {page} / {totalPages} ({total} kết quả)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
