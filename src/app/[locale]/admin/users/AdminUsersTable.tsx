'use client';

import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
};

export type UserRow = {
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  status: string;
};

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

interface AdminUsersTableProps {
  dataSource: UserRow[];
  pagination?: false | PaginationConfig;
}

export default function AdminUsersTable({ dataSource, pagination }: AdminUsersTableProps) {
  const t = useTranslations();

  const getRoleLabel = (role: string) => {
    const roleKey = `AdminUsers.role_${role}` as const;
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
      title: t('TableUsers.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('TableUsers.email'),
      dataIndex: 'email',
      key: 'email',
      width: 250,
    },
    {
      title: t('TableUsers.role'),
      key: 'role',
      render: (_: unknown, record: UserRow) => (
        <Tag color={toneToColor[getRoleTone(record.role)]}>{getRoleLabel(record.role)}</Tag>
      ),
      width: 200,
    },
    {
      title: t('TableUsers.workspace'),
      dataIndex: 'workspace',
      key: 'workspace',
      width: 200,
    },
    {
      title: t('TableUsers.status'),
      key: 'status',
      render: (_: unknown, record: UserRow) => (
        <Tag color={record.status === 'active' ? 'cyan' : 'red'}>
          {record.status === 'active' ? t('TableUsers.active') : t('TableUsers.inactive')}
        </Tag>
      ),
      width: 150,
    },
  ];

  return (
    <Table
      dataSource={dataSource}
      rowKey="key"
      columns={columns}
      pagination={pagination}
      size="middle"
      bordered
    />
  );
}
