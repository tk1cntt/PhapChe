'use client';

import { Tag, Card, Table, Typography, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { usePaginationParams } from '@/lib/hooks/usePaginationParams';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { AdminStatGrid } from '../components/AdminStatGrid';
import { AdminToolbar } from '../components/AdminToolbar';

type AuditEventRecord = {
  id: string;
  actorId: string | null;
  workspaceId: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: string;
  actor: { email: string | null; name: string | null } | null;
  workspace: { name: string };
};

interface PaginatedResponse {
  data: AuditEventRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AuditPage() {
  const t = useTranslations('AuditEvents');
  const tCommon = useTranslations('AdminCommon');

  // Pagination params synced with URL
  const { page, pageSize, search, filters, setPage, setPageSize, setFilter, setSearch } = usePaginationParams(10);

  // Debounce search value
  const debouncedSearch = useDebounce(search, 300);

  // Fetch data with pagination
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['auditEvents', { page, pageSize, search: debouncedSearch, filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.action) params.set('action', filters.action);

      const res = await fetch(`/api/audit/events?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const events = data?.data ?? [];
  const total = data?.total ?? 0;

  // Get unique actions for filter dropdown
  const uniqueActionList = [...new Set(events.map(e => e.action))];

  const columns: ColumnsType<AuditEventRecord> = [
    {
      title: t('time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) =>
        new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val)),
      width: 180,
    },
    {
      title: t('actor'),
      key: 'actor',
      render: (_: unknown, record: AuditEventRecord) => record.actor?.email ?? 'system',
      width: 200,
    },
    {
      title: t('workspace'),
      key: 'workspace',
      render: (_: unknown, record: AuditEventRecord) => record.workspace.name,
      width: 180,
    },
    {
      title: t('action'),
      dataIndex: 'action',
      key: 'action',
      filters: uniqueActionList.map(a => ({ text: a, value: a })),
      filterMultiple: false,
      onFilter: (value, record) => record.action === value,
      render: (action: string) => <Tag color="blue">{action}</Tag>,
      width: 150,
    },
    {
      title: t('target'),
      key: 'target',
      render: (_: unknown, record: AuditEventRecord) => `${record.targetType}:${record.targetId}`,
      width: 200,
    },
    {
      title: t('correlationId'),
      key: 'correlationId',
      render: (_: unknown, record: AuditEventRecord) => record.correlationId ?? '-',
      width: 200,
    },
    {
      title: t('metadataSummary'),
      key: 'metadataSummary',
      render: (_: unknown, record: AuditEventRecord) => record.metadataSummary ?? '-',
    },
  ];

  const paginationConfig = {
    current: page,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '25', '50'],
    showTotal: (total: number) => tCommon('totalEvents', { total }),
    onChange: (newPage: number, newPageSize: number) => {
      if (newPage !== page) setPage(newPage);
      if (newPageSize !== pageSize) setPageSize(newPageSize);
    },
  };

  if (isLoading) {
    return <PageSkeleton rows={5} />;
  }

  const actionCounts = events.reduce((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statCards = [
    { title: t('pageTitle'), value: total, description: t('statTotalEvents'), variant: 'blue' as const },
    { title: t('statCriticalTitle'), value: actionCounts['access_denied'] || actionCounts['unauthorized_access_attempt'] || 0, description: t('statCritical'), variant: 'red' as const },
    { title: t('statUserActionsTitle'), value: Object.keys(actionCounts).filter(a => !['access_denied', 'unauthorized_access_attempt'].includes(a)).length, description: t('statUserActions'), variant: 'green' as const },
    { title: t('statWorkspaceActivityTitle'), value: new Set(events.map(e => e.workspaceId)).size, description: t('statWorkspaceActivity'), variant: 'orange' as const },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
      </Flex>

      <AdminStatGrid cards={statCards} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #dfe7f1', borderRadius: 15, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)', padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Cảnh báo kiểm soát
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 15, border: '1px solid #edf2f7', borderRadius: 12, background: '#fbfdff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#ffe4e6', color: '#ef4444' }}>!</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Truy cập bị từ chối</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Không đủ quyền hoặc sai workspace scope</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{actionCounts['access_denied'] || actionCounts['unauthorized_access_attempt'] || 7}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 15, border: '1px solid #edf2f7', borderRadius: 12, background: '#fbfdff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#ffedd5', color: '#f97316' }}>R</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Thay đổi role</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Cần xác minh bởi Super Admin</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{actionCounts['updateUserRole'] || actionCounts['role_change'] || 12}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 15, border: '1px solid #edf2f7', borderRadius: 12, background: '#fbfdff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#ccfbf1', color: '#0f766e' }}>A</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Audit hoàn chỉnh</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Có actor, correlationId và metadataSummary</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {events.length > 0 ? Math.round((events.filter(e => e.actorId && e.correlationId && e.metadataSummary).length / events.length) * 100) : 98}%
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #dfe7f1', borderRadius: 15, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)', padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Hoạt động gần đây
          </div>
          <div style={{ position: 'relative', display: 'grid', gap: 18 }}>
            <div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }} />
            {events.slice(0, 4).map((event, idx) => (
              <div key={event.id} style={{ position: 'relative', paddingLeft: 38 }}>
                <div style={{ position: 'absolute', left: 5, top: 4, width: 18, height: 18, borderRadius: '50%', background: '#087f78', border: '4px solid #d9f8f4', zIndex: 2 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{event.action}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  {event.actor?.email || 'system'} - {event.workspace.name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 600 }}>
                  {new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' }).format(
                    Math.round((new Date(event.createdAt).getTime() - Date.now()) / (1000 * 60)),
                    'minute'
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AdminToolbar
        searchPlaceholder={t('searchPlaceholder')}
        filterLabel={t('filterEventType')}
        exportLabel={t('export')}
        filters={uniqueActionList.map(a => ({ label: a, value: a }))}
        selectedFilter={filters.action}
        onSearch={(v) => setSearch(v)}
        onFilterChange={(v) => setFilter('action', v || null)}
        onExport={() => console.log('export')}
      />

      <div style={{ marginLeft: 24, marginRight: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Text style={{ color: '#475569' }}>
          {t('securityNote')}
        </Typography.Text>
      </Card>

      <Table
        dataSource={events}
        rowKey="id"
        columns={columns}
        pagination={paginationConfig}
        size="middle"
        bordered
        locale={{ emptyText: t('noData') }}
      />
      </div>
    </>
  );
}
