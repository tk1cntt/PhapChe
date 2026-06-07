'use client';

import { Table, Tag, Button } from 'antd';

const ROLES = [
  { value: 'customer', label: 'Khách hàng', tone: 'default' as const },
  { value: 'specialist', label: 'Chuyên viên', tone: 'blue' as const },
  { value: 'reviewer', label: 'Reviewer', tone: 'orange' as const },
  { value: 'coordinator_admin', label: 'Điều phối viên', tone: 'cyan' as const },
  { value: 'super_admin', label: 'Super admin', tone: 'red' as const },
];

const toneToColor: Record<string, string> = {
  default: 'default',
  blue: 'blue',
  orange: 'orange',
  cyan: 'cyan',
  red: 'red',
};

type UserRow = {
  key: string;
  name: string | null;
  email: string;
  role: string;
  workspace: string;
  status: string;
};

type UsersTableProps = { dataSource: UserRow[] };

export function UsersTable({ dataSource }: UsersTableProps) {
  const columns = [
    {
      title: 'Tên',
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
      title: 'Vai trò',
      key: 'role',
      render: (_: unknown, record: UserRow) => {
        const meta = ROLES.find((r) => r.value === record.role) ?? ROLES[0];
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
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: UserRow) => (
        <Tag color={record.status === 'Đang hoạt động' ? 'cyan' : 'red'}>{record.status}</Tag>
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
