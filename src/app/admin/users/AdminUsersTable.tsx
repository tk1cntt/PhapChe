'use client';

import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const roles = [
  { value: 'customer', label: 'Khach hang', tone: 'neutral' as const },
  { value: 'specialist', label: 'Chuyen vien', tone: 'info' as const },
  { value: 'reviewer', label: 'Reviewer', tone: 'warning' as const },
  { value: 'coordinator_admin', label: 'Dieu phoi vien', tone: 'accent' as const },
  { value: 'super_admin', label: 'Super admin', tone: 'destructive' as const },
];

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
};

function roleMeta(role: string) {
  return roles.find((item) => item.value === role) ?? roles[0];
}

export type UserRow = {
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  status: string;
};

interface AdminUsersTableProps {
  dataSource: UserRow[];
}

export default function AdminUsersTable({ dataSource }: AdminUsersTableProps) {
  const columns: ColumnsType<UserRow> = [
    {
      title: 'Ten',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 250,
    },
    {
      title: 'Vai tro',
      key: 'role',
      render: (_: unknown, record: UserRow) => {
        const meta = roleMeta(record.role);
        return <Tag color={toneToColor[meta.tone] ?? 'default'}>{meta.label}</Tag>;
      },
      width: 200,
    },
    {
      title: 'Workspace',
      dataIndex: 'workspace',
      key: 'workspace',
      width: 200,
    },
    {
      title: 'Trang thai',
      key: 'status',
      render: (_: unknown, record: UserRow) => (
        <Tag color={record.status === 'Dang hoat dong' ? 'cyan' : 'red'}>{record.status}</Tag>
      ),
      width: 150,
    },
  ];

  return (
    <Table
      dataSource={dataSource}
      rowKey="key"
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}
