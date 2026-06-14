'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import { AdminAuditStats, type AuditStats } from './AdminAuditStats';
import { AdminAuditTimeline, type AuditEventTimeline } from './AdminAuditTimeline';
import { AdminAuditTable, type AuditEventRow } from './AdminAuditTable';
import Paging from '@/components/ui/Paging';

interface AuditEventResponse {
  data: AuditEventRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminAuditClient() {
  const t = useTranslations('AuditEvents');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  // State
  const [data, setData] = useState<AuditEventResponse | null>(null);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    criticalCount: 0,
    completeAuditPercent: 100,
    workspaceCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [initialized, setInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync pagination from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const pageSizeParam = params.get('pageSize');
    const searchParam = params.get('search');

    let hasChanges = false;
    const newPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
    const newPageSize = pageSizeParam ? parseInt(pageSizeParam, 10) || 10 : 10;

    if (newPage !== page) { setPage(newPage); hasChanges = true; }
    if (newPageSize !== pageSize) { setPageSize(newPageSize); hasChanges = true; }
    if (searchParam && searchParam !== search) { setSearch(searchParam); hasChanges = true; }

    setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit/stats');
      if (response.ok) {
        const result = await response.json();
        setStats(result);
      }
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!initialized) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/admin/audit?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch audit data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : tCommon('error');
      setError(errorMessage);
      console.error('Error fetching audit data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, router, initialized, tCommon]);

  // Fetch on mount
  useEffect(() => {
    fetchStats();
    if (initialized) {
      fetchData();
    }
  }, [fetchStats, fetchData, initialized]);

  // Pagination handlers
  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize) setPageSize(newPageSize);

    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    if (newPageSize) params.set('pageSize', newPageSize.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);

    const params = new URLSearchParams(window.location.search);
    if (q) params.set('search', q);
    else params.delete('search');
    params.set('page', '1');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  const handleRefresh = () => {
    fetchStats();
    fetchData();
  };

  const events = data?.data ?? [];
  const total = data?.total ?? 0;
  const timelineEvents: AuditEventTimeline[] = events.slice(0, 4);

  // Control alerts data
  const accessDeniedCount = events.filter(e =>
    e.action === 'access_denied' || e.action === 'unauthorized_access_attempt'
  ).length;
  const roleChangeCount = events.filter(e =>
    e.action.includes('role') || e.action.includes('Role') || e.action.includes('updateUserRole')
  ).length;
  const completeAuditCount = events.filter(e =>
    e.actor && e.correlationId && e.metadataSummary
  ).length;
  const completeAuditPercent = events.length > 0
    ? Math.round((completeAuditCount / events.length) * 100)
    : 100;

  return (
    <div className="audit-client">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
        <button
          data-testid="audit-export-btn"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          {t('export')}
        </button>
      </div>

      {/* Stats */}
      <AdminAuditStats stats={stats} />

      {/* Security notice card */}
      <Card
        style={{
          marginBottom: 24,
          background: '#fff',
          border: '1px solid #dfe7f1',
          borderRadius: 15,
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #d4f4ed, #eefbf8)',
              color: '#087f78',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <Typography.Text strong style={{ fontSize: 18, color: '#0f172a', display: 'block', marginBottom: 8 }}>
              {t('securityDisplayTitle') || 'Nguyên tắc hiển thị an toàn'}
            </Typography.Text>
            <Typography.Text style={{ color: '#59687e', fontSize: 14, lineHeight: 1.7 }}>
              {t('securityNote')}
            </Typography.Text>
          </div>
        </div>
      </Card>

      {/* Grid 2-col: control alerts + timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Control alerts panel */}
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t('controlAlertsTitle')}
          </div>
          <div className="security-list">
            <div className="security-item">
              <div className="security-left">
                <div className="security-badge danger">!</div>
                <div>
                  <strong>{t('accessDeniedTitle')}</strong>
                  <span>{t('accessDeniedDesc')}</span>
                </div>
              </div>
              <div className="security-count">{accessDeniedCount || 0}</div>
            </div>
            <div className="security-item">
              <div className="security-left">
                <div className="security-badge warning">R</div>
                <div>
                  <strong>{t('roleChangeTitle')}</strong>
                  <span>{t('roleChangeDesc')}</span>
                </div>
              </div>
              <div className="security-count">{roleChangeCount || 0}</div>
            </div>
            <div className="security-item">
              <div className="security-left">
                <div className="security-badge success">A</div>
                <div>
                  <strong>{t('completeAuditTitle')}</strong>
                  <span>{t('completeAuditDesc')}</span>
                </div>
              </div>
              <div className="security-count">{completeAuditPercent}%</div>
            </div>
          </div>
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {t('recentActivityTitle')}
          </div>
          <AdminAuditTimeline events={timelineEvents} />
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #dfe7f1',
          borderRadius: 15,
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 360,
                height: 44,
                border: '1px solid #dfe7f1',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '0 14px',
                color: '#718096',
                background: '#fff',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 14,
                  background: 'transparent',
                }}
              />
            </div>
            <button
              onClick={handleRefresh}
              style={{
                height: 44,
                border: '1px solid #dfe7f1',
                background: '#fff',
                borderRadius: 8,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 16v5h5" />
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 8V3h-5" />
              </svg>
              {t('refresh') || 'Refresh'}
            </button>
          </div>
        </div>
      </div>

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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <strong>{tCommon('error')}</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
            {t('errorLoading') || 'Đã xảy ra lỗi khi lấy dữ liệu từ máy chủ. Vui lòng thử lại.'}
          </p>
          <button
            onClick={handleRefresh}
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
            {t('retry') || 'Thử lại'}
          </button>
        </div>
      )}

      {/* Table + Paging */}
      {!error && (
        <>
          <AdminAuditTable events={events} loading={loading} />
          {total > pageSize && (
            <Paging
              current={page}
              pageSize={pageSize}
              total={total}
              totalLabel={`${total} ${t('totalEvents') || 'sự kiện'}`}
              onChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Floating warning button */}
      {stats.criticalCount > 0 && (
        <div
          data-testid="audit-floating-warning"
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
            !
          </span>
          <span>{stats.criticalCount} {t('warnings') || 'Cảnh báo'}</span>
        </div>
      )}

      {/* Inline styles for control alerts */}
      <style>{`
        .audit-client .security-list {
          display: grid;
          gap: 14px;
        }
        .audit-client .security-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 15px;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          background: #fbfdff;
        }
        .audit-client .security-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .audit-client .security-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }
        .audit-client .security-badge.danger {
          background: #ffe4e6;
          color: #ef4444;
        }
        .audit-client .security-badge.warning {
          background: #ffedd5;
          color: #f97316;
        }
        .audit-client .security-badge.success {
          background: #ccfbf1;
          color: #0f766e;
        }
        .audit-client .security-left strong {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .audit-client .security-left span {
          display: block;
          font-size: 12px;
          color: #64748b;
        }
        .audit-client .security-count {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
