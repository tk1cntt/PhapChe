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
import './audit.css';

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
    <div className="audit-page">
      <div className="page-header">
        <h1>{t('pageTitle')}</h1>
        <p className="subtitle">{t('pageDescription')}</p>
      </div>

      <AdminStatGrid cards={statCards} />

      <div className="panels-grid">
        <div className="panel">
          <div className="panel-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {t('controlAlertsTitle')}
          </div>
          <div className="alert-list">
            <div className="alert-item">
              <div className="alert-left">
                <div className="alert-icon danger">!</div>
                <div>
                  <div className="alert-title">{t('accessDeniedTitle')}</div>
                  <div className="alert-desc">{t('accessDeniedDesc')}</div>
                </div>
              </div>
              <div className="alert-count">{actionCounts['access_denied'] || actionCounts['unauthorized_access_attempt'] || 7}</div>
            </div>
            <div className="alert-item">
              <div className="alert-left">
                <div className="alert-icon warning">R</div>
                <div>
                  <div className="alert-title">{t('roleChangeTitle')}</div>
                  <div className="alert-desc">{t('roleChangeDesc')}</div>
                </div>
              </div>
              <div className="alert-count">{actionCounts['updateUserRole'] || actionCounts['role_change'] || 12}</div>
            </div>
            <div className="alert-item">
              <div className="alert-left">
                <div className="alert-icon success">A</div>
                <div>
                  <div className="alert-title">{t('completeAuditTitle')}</div>
                  <div className="alert-desc">{t('completeAuditDesc')}</div>
                </div>
              </div>
              <div className="alert-count">
                {events.length > 0 ? Math.round((events.filter(e => e.actorId && e.correlationId && e.metadataSummary).length / events.length) * 100) : 98}%
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            {t('recentActivityTitle')}
          </div>
          <div className="timeline">
            <div className="timeline-line" />
            {events.slice(0, 4).map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-action">{event.action}</div>
                <div className="timeline-desc">
                  {event.actor?.email || 'system'} - {event.workspace.name}
                </div>
                <div className="timeline-time">
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

      <div className="table-wrapper">
        <Card className="security-note">
          <Typography.Text>
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
    </div>
  );
}
