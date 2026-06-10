'use client';

import { useTranslations } from 'next-intl';
import { Tag, Card, Table, Typography, Flex, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'next/navigation';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { usePaginationParams } from '@/lib/hooks/usePaginationParams';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import type { RequestStatus } from '@/lib/types';

const statusLabels: Record<RequestStatus, { labelKey: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { labelKey: 'draft_intake', tone: 'neutral' },
  intake_submitted: { labelKey: 'intake_submitted', tone: 'info' },
  triage: { labelKey: 'triage', tone: 'warning' },
  assigned: { labelKey: 'assigned', tone: 'info' },
  in_progress: { labelKey: 'in_progress', tone: 'info' },
  pending_review: { labelKey: 'pending_review', tone: 'warning' },
  revision_required: { labelKey: 'revision_required', tone: 'destructive' },
  approved: { labelKey: 'approved', tone: 'accent' },
  delivered: { labelKey: 'delivered', tone: 'outline' },
  closed: { labelKey: 'closed', tone: 'neutral' },
  cancelled: { labelKey: 'cancelled', tone: 'destructive' },
};

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

interface RequestRow {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
  workspaceName: string;
  customerName: string;
  customerEmail: string;
}

interface PaginatedResponse {
  data: RequestRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function RequestsPage() {
  const t = useTranslations('AdminRequests');
  const tStatus = useTranslations('RequestStatus');

  // Pagination params synced with URL
  const { page, pageSize, search, filters, setPage, setPageSize, setFilter } = usePaginationParams(10);

  // Debounce search value
  const debouncedSearch = useDebounce(search, 300);

  // Fetch data with pagination
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['requests', { page, pageSize, search: debouncedSearch, filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<RequestRow> = [
    {
      title: t('code'),
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-mono text-sm">{id.slice(-8).toUpperCase()}</span>,
      width: 120,
    },
    {
      title: t('workspace'),
      dataIndex: 'workspaceName',
      key: 'workspaceName',
      width: 200,
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Triage', value: 'triage' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Pending Review', value: 'pending_review' },
        { text: 'Approved', value: 'approved' },
        { text: 'Delivered', value: 'delivered' },
      ],
      filterMultiple: false,
      onFilter: (value, record) => record.status === value,
      render: (status: RequestStatus) => {
        const meta = statusLabels[status] ?? { labelKey: status, tone: 'neutral' as const };
        return <Tag color={toneToColor[meta.tone] ?? 'default'}>{tStatus(meta.labelKey)}</Tag>;
      },
      width: 160,
    },
    {
      title: t('customer'),
      key: 'customer',
      render: (_: unknown, record: RequestRow) => (
        <div className="text-sm">
          <div>{record.customerName}</div>
          <div className="text-gray-500">{record.customerEmail}</div>
        </div>
      ),
    },
  ];

  const paginationConfig = {
    current: page,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '25', '50'],
    showTotal: (total: number) => `Tong ${total} ban ghi`,
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
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              {t('pageTitle')}
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              {t('pageDescription')}
            </Typography.Paragraph>
          </Flex>
          <Button type="primary">{t('createButton')}</Button>
        </Flex>
      </Flex>

      <Table
        dataSource={requests}
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
