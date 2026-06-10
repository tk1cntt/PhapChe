'use client';

import { Tag, Card, Table, Typography, Flex } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { usePaginationParams } from '@/lib/hooks/usePaginationParams';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';

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

  // Pagination params synced with URL
  const { page, pageSize, search, filters, setPage, setPageSize } = usePaginationParams(10);

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
  const uniqueActions = [...new Set(events.map(e => e.action))];

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
      filters: uniqueActions.map(a => ({ text: a, value: a })),
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
    showTotal: (total: number) => `Tong ${total} su kien`,
    onChange: (newPage: number, newPageSize: number) => {
      if (newPage !== page) setPage(newPage);
      if (newPageSize !== pageSize) setPageSize(newPageSize);
    },
  };

  if (isLoading) {
    return <PageSkeleton rows={5} />;
  }

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          {t('pageTitle')}
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          {t('pageDescription')}
        </Typography.Paragraph>
      </Flex>

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
    </>
  );
}
