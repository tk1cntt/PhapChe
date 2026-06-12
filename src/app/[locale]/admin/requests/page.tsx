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
import { AdminStatGrid } from '../components/AdminStatGrid';
import { AdminToolbar } from '../components/AdminToolbar';

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
  priority?: string;
  matterType?: string;
  createdAt: string;
  workspaceName: string;
  workspaceSlug: string;
  customerName: string;
  customerEmail: string;
  assigneeName?: string;
}

const priorityLabels: Record<string, { labelKey: string; color: string }> = {
  high: { labelKey: 'high', color: 'red' },
  medium: { labelKey: 'medium', color: 'orange' },
  low: { labelKey: 'low', color: 'blue' },
};

const typeLabels: Record<string, { labelKey: string; color: string }> = {
  contract_review: { labelKey: 'contract_review', color: 'blue' },
  legal_review: { labelKey: 'legal_review', color: 'cyan' },
  document_update: { labelKey: 'document_update', color: 'geekblue' },
  access_request: { labelKey: 'access_request', color: 'purple' },
  amendment: { labelKey: 'amendment', color: 'magenta' },
};

interface PaginatedResponse {
  data: RequestRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function RequestsPage() {
  const t = useTranslations('AdminRequests');
  const tStatus = useTranslations('RequestStatus');
  const tCommon = useTranslations('AdminCommon');

  // Pagination params synced with URL
  const { page, pageSize, search, filters, setPage, setPageSize, setFilter, setSearch } = usePaginationParams(10);

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

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  const columns: ColumnsType<RequestRow> = [
    {
      title: t('code'),
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 18,
            }}
          >
            📄
          </div>
          <span className="font-mono text-sm font-bold">{id.slice(-8).toUpperCase()}</span>
        </div>
      ),
      width: 140,
    },
    {
      title: t('workspace'),
      key: 'workspace',
      render: (_: unknown, record: RequestRow) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            {record.workspaceName}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.workspaceSlug}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: t('customer'),
      key: 'customer',
      render: (_: unknown, record: RequestRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#eef2f7',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {getInitials(record.customerName)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{record.customerName}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.customerEmail}</div>
          </div>
        </div>
      ),
      width: 220,
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
        const color = toneToColor[meta.tone] ?? 'default';
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
              background: color === 'blue' ? '#dbeafe' : color === 'orange' ? '#ffedd5' : color === 'cyan' ? '#ccfbf1' : color === 'red' ? '#ffe4e6' : '#f1f5f9',
              color: color === 'blue' ? '#2563eb' : color === 'orange' ? '#ea580c' : color === 'cyan' ? '#0f766e' : color === 'red' ? '#ef4444' : '#64748b',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: color === 'blue' ? '#2563eb' : color === 'orange' ? '#f97316' : color === 'cyan' ? '#10b981' : color === 'red' ? '#ef4444' : '#64748b',
                marginRight: 7,
              }}
            />
            {tStatus(meta.labelKey)}
          </span>
        );
      },
      width: 160,
    },
    {
      title: t('requestType'),
      dataIndex: 'matterType',
      key: 'requestType',
      render: (matterType: string) => {
        if (!matterType) return <span style={{ color: '#94a3b8' }}>—</span>;
        const meta = typeLabels[matterType] ?? { labelKey: matterType, color: 'default' };
        return <Tag color={meta.color}>{meta.labelKey}</Tag>;
      },
      width: 160,
    },
    {
      title: t('assignee'),
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      render: (assigneeName?: string) => {
        if (!assigneeName) return <span style={{ color: '#94a3b8' }}>—</span>;
        return <span style={{ fontSize: 14, fontWeight: 500 }}>{assigneeName}</span>;
      },
      width: 150,
    },
    {
      title: t('action'),
      key: 'action',
      render: () => (
        <a
          href="#"
          style={{
            color: '#087f78',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          {t('viewDetail')} →
        </a>
      ),
      width: 130,
    },
  ];

  const paginationConfig = {
    current: page,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '25', '50'],
    showTotal: (total: number) => tCommon('totalRecords', { total }),
    onChange: (newPage: number, newPageSize: number) => {
      if (newPage !== page) setPage(newPage);
      if (newPageSize !== pageSize) setPageSize(newPageSize);
    },
  };

  if (isLoading) {
    return <PageSkeleton rows={5} />;
  }

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statCards = [
    { title: t('pageTitle'), value: total, description: t('statTotal'), variant: 'blue' as const },
    { title: tStatus('in_progress'), value: (statusCounts['in_progress'] || 0) + (statusCounts['assigned'] || 0), description: t('statProcessing'), variant: 'orange' as const },
    { title: tStatus('delivered'), value: (statusCounts['delivered'] || 0) + (statusCounts['closed'] || 0), description: t('statCompleted'), variant: 'green' as const },
    { title: tStatus('cancelled'), value: statusCounts['cancelled'] || 0, description: t('statCancelled'), variant: 'red' as const },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <div>
            <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
              {t('pageTitle')}
            </h1>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
              {t('pageDescription')}
            </p>
          </div>
          <Button type="primary">{t('createButton')}</Button>
        </Flex>
      </Flex>

      <AdminStatGrid cards={statCards} />

      <AdminToolbar
        searchPlaceholder={t('searchPlaceholder')}
        filterLabel={t('filterStatus')}
        exportLabel={t('export')}
        filters={Object.entries(statusLabels).map(([key, meta]) => ({ label: tStatus(meta.labelKey), value: key }))}
        selectedFilter={filters.status}
        onSearch={(v) => setSearch(v)}
        onFilterChange={(v) => setFilter('status', v || null)}
        onExport={() => console.log('export')}
      />

      <div style={{ marginLeft: 24, marginRight: 24 }}>
      <Table
        dataSource={requests}
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
