'use client';

import { Card, Typography, Flex, Button, Tag, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { usePaginationParams } from '@/lib/hooks/usePaginationParams';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title, Paragraph } = Typography;

const roles = [
  { value: 'customer', labelKey: 'role_customer', tone: 'neutral' as const },
  { value: 'specialist', labelKey: 'role_specialist', tone: 'info' as const },
  { value: 'reviewer', labelKey: 'role_reviewer', tone: 'warning' as const },
  { value: 'coordinator_admin', labelKey: 'role_coordinator_admin', tone: 'accent' as const },
  { value: 'super_admin', labelKey: 'role_super_admin', tone: 'destructive' as const },
];

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
};

interface UserRow {
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  status: string;
}

interface PaginatedResponse {
  data: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function UsersPageClient() {
  const t = useTranslations('AdminUsers');
  const pathname = usePathname();

  // Pagination params synced with URL
  const { page, pageSize, search, filters, setPage, setPageSize } = usePaginationParams(10);

  // Debounce search value
  const debouncedSearch = useDebounce(search, 300);

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'vi';

  // Fetch data with pagination
  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['users', { page, pageSize, search: debouncedSearch, filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.role) params.set('role', filters.role);

      const res = await fetch(`/${locale}/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  const getRoleLabel = (role: string) => {
    const roleKey = `AdminUsers.${role}` as const;
    return t(roleKey);
  };

  const getRoleTone = (role: string) => {
    const tones: Record<string, typeof toneToColor.default> = {
      customer: 'neutral',
      specialist: 'info',
      reviewer: 'warning',
      coordinator_admin: 'accent',
      super_admin: 'destructive',
    };
    return tones[role] ?? 'neutral';
  };

  const columns: ColumnsType<UserRow> = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('email'),
      dataIndex: 'email',
      key: 'email',
      width: 250,
    },
    {
      title: t('role'),
      key: 'role',
      filters: roles.map(r => ({ text: t(r.labelKey), value: r.value })),
      filterMultiple: false,
      onFilter: (value, record) => record.role === value,
      render: (_: unknown, record: UserRow) => (
        <Tag color={toneToColor[getRoleTone(record.role)]}>{getRoleLabel(record.role)}</Tag>
      ),
      width: 200,
    },
    {
      title: t('workspace'),
      dataIndex: 'workspace',
      key: 'workspace',
      width: 200,
    },
    {
      title: t('status'),
      key: 'status',
      render: (_: unknown, record: UserRow) => (
        <Tag color={record.status === 'active' ? 'cyan' : 'red'}>
          {record.status === 'active' ? t('active') : t('inactive')}
        </Tag>
      ),
      width: 150,
    },
  ];

  const paginationConfig = {
    current: page,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '25', '50'],
    showTotal: (total: number) => `Tong ${total} nguoi dung`,
    onChange: (newPage: number, newPageSize: number) => {
      if (newPage !== page) setPage(newPage);
      if (newPageSize !== pageSize) setPageSize(newPageSize);
    },
  };

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          {t('pageTitle')}
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          {t('pageDescription')}
        </Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Flex vertical gap={16}>
          <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {t('systemRoles')}
          </Title>
          <Flex wrap="wrap" gap={8}>
            {roles.map((role) => (
              <Tag key={role.value} color={toneToColor[role.tone] ?? 'default'}>
                {t(role.labelKey)} ({role.value})
              </Tag>
            ))}
          </Flex>
          <Paragraph style={{ color: '#475569', margin: 0 }}>
            {t('roleChangeNote')}
          </Paragraph>
        </Flex>
      </Card>

      <Table
        dataSource={users}
        rowKey="key"
        columns={columns}
        pagination={paginationConfig}
        size="middle"
        bordered
      />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">{t('createUserButton')}</Button>
      </Flex>
    </>
  );
}
