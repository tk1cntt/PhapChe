'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { OpsAggregateDto } from '@/lib/ops/ops-service';
import { AdminOperationsStats } from '@/components/admin/AdminOperationsStats';
import { AdminOperationsWorkload } from '@/components/admin/AdminOperationsWorkload';
import { AdminOperationsTimeline } from '@/components/admin/AdminOperationsTimeline';
import AdminToolbar from '@/components/admin/AdminToolbar';
import { AdminOperationsTable } from '@/components/admin/AdminOperationsTable';
import Paging from '@/components/ui/Paging';

export interface OpsClientFilters {
  workspaceId?: string | null;
  matterTypeKey?: string;
  status?: string;
  assignedSpecialistId?: string;
  assignedReviewerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AdminOperationsClientProps {
  initialData?: OpsAggregateDto | null;
}

export default function AdminOperationsClient({ initialData }: AdminOperationsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<OpsAggregateDto | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OpsClientFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync pagination with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const pageSizeParam = params.get('pageSize');
    if (pageParam) setPage(parseInt(pageParam, 10) || 1);
    if (pageSizeParam) setPageSize(parseInt(pageSizeParam, 10) || 20);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search ?? '');
      setPage(1);
      // Update URL
      const params = new URLSearchParams(window.location.search);
      params.set('search', filters.search ?? '');
      params.set('page', '1');
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchData = useCallback(async () => {
    // Abort any in-flight request to prevent race conditions
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.workspaceId) params.set('workspaceId', filters.workspaceId);
      if (filters.matterTypeKey) params.set('matterTypeKey', filters.matterTypeKey);
      if (filters.status) params.set('status', filters.status);
      if (filters.assignedSpecialistId) params.set('assignedSpecialistId', filters.assignedSpecialistId);
      if (filters.assignedReviewerId) params.set('assignedReviewerId', filters.assignedReviewerId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const response = await fetch(`/api/admin/operations?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch operations data');
      }

      const result = await response.json();
      console.log('[Ops] Fetched:', {
        requestCount: result.requests?.length,
        pagination: result.pagination,
        page: page,
        pageSize: pageSize
      });
      setData(result);
    } catch (err) {
      // Ignore abort errors as they are expected when component unmounts or new request starts
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      console.error('Error fetching operations:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, page, pageSize, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pagination handlers - sync with URL
  const handlePageChange = (newPage: number, newPageSize?: number) => {
    if (newPage !== page) setPage(newPage);
    if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize);

    // Update URL
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    if (newPageSize) params.set('pageSize', newPageSize.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  const handleSearch = (q: string) => { setFilters((f) => ({ ...f, search: q })); };
  const handleFilter = () => { /* placeholder for filter modal */ };
  const handleExport = () => { /* placeholder for export */ };
  const handleRefresh = () => fetchData();

  const toolbarTranslations = {
    searchPlaceholder: 'Tìm hồ sơ, người phụ trách, workspace...',
    filter: 'Bộ lọc',
    status: 'Trạng thái',
    workspace: 'Workspace',
    export: 'Export',
    columns: 'Cột hiển thị',
    refresh: 'Làm mới',
    allWorkspaces: 'Tất cả workspaces',
  };

  const stats = data?.stats ?? { openRequests: 0, nearSla: 0, completedToday: 0, auditWarnings: 0 };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            Vận hành
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn.
          </p>
        </div>
        <button
          data-testid="ops-export-btn"
          style={{
            height: 45,
            padding: '0 18px',
            border: 'none',
            borderRadius: 8,
            background: 'linear-gradient(180deg, #0b8f86, #087970)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M7 15l4-4 4 4 5-7"/>
          </svg>
          Xuất báo cáo vận hành
        </button>
      </div>

      {/* Stats */}
      <AdminOperationsStats stats={stats} />

      {/* Grid 2-col: workload + timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: 20, marginBottom: 24 }}>
        {/* Workload panel */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7f1',
            borderRadius: 15,
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
            padding: 24,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M7 16l4-4 3 3 6-8"/>
            </svg>
            Tổng quan workload
          </div>
          <AdminOperationsWorkload workload={data?.workload ?? []} />
        </div>

        {/* Timeline panel */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7f1',
            borderRadius: 15,
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
            padding: 24,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Timeline audit
          </div>
          <AdminOperationsTimeline timeline={data?.timeline ?? []} />
        </div>
      </div>

      {/* Toolbar */}
      <AdminToolbar
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        workspaces={(data?.filters.workspaces ?? []).map((w) => ({ id: w.id, name: w.name, slug: '' }))}
        selectedWorkspace={filters.workspaceId}
        translations={toolbarTranslations}
      />

      {/* Error state */}
      {error && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #fee2e2',
            borderRadius: 15,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dc2626', marginBottom: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
            <strong>Không thể tải dữ liệu vận hành</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
            Đã xảy ra lỗi khi lấy dữ liệu từ máy chủ. Vui lòng thử lại.
          </p>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 16px',
              background: '#0b8f86',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Operations table + paging */}
      {!error && (
        <>
          <AdminOperationsTable
            requests={data?.requests ?? []}
            loading={loading}
          />
          {data?.pagination && data.pagination.total > pageSize && (
            <Paging
              current={page}
              pageSize={pageSize}
              total={data.pagination.total}
              totalLabel={`${data.pagination.total} hồ sơ`}
              onChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Floating SLA warning button */}
      {data && data.stats.nearSla > 0 && (
        <div
          data-testid="ops-floating-sla"
          style={{
            position: 'fixed',
            right: 22,
            bottom: 20,
            minWidth: 118,
            height: 48,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#fff',
            fontWeight: 700,
            padding: '0 14px',
            background: 'linear-gradient(180deg, #ef4444, #dc2626)',
            border: '3px solid #facc15',
            boxShadow: '0 12px 26px rgba(15, 23, 42, 0.22)',
            zIndex: 1000,
            cursor: 'default',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            N
          </span>
          <span>{data.stats.nearSla} Issue ×</span>
        </div>
      )}
    </div>
  );
}
