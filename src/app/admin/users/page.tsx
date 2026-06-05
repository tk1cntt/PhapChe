import { Tag, Button, Card, Table, Typography, Flex, Space } from 'antd';

const roles = [
  { value: 'customer', label: 'Khách hàng', tone: 'neutral' as const },
  { value: 'specialist', label: 'Chuyên viên', tone: 'info' as const },
  { value: 'reviewer', label: 'Reviewer', tone: 'warning' as const },
  { value: 'coordinator_admin', label: 'Điều phối viên', tone: 'accent' as const },
  { value: 'super_admin', label: 'Super admin', tone: 'destructive' as const },
];

const users = [
  { name: 'Nguyễn An', email: 'an@example.com', role: 'customer', workspace: 'Công ty An Phát', status: 'Đang hoạt động' },
  { name: 'Trần Bình', email: 'binh@example.com', role: 'specialist', workspace: 'Nội bộ', status: 'Đang hoạt động' },
  { name: 'Lê Chi', email: 'chi@example.com', role: 'reviewer', workspace: 'Nội bộ', status: 'Đang hoạt động' },
  { name: 'Phạm Dũng', email: 'dung@example.com', role: 'coordinator_admin', workspace: 'Nội bộ', status: 'Đang hoạt động' },
  { name: 'Võ Hà', email: 'ha@example.com', role: 'super_admin', workspace: 'Hệ thống', status: 'Đang hoạt động' },
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

export default function UsersPage() {
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
      render: (_: unknown, record: (typeof users)[number]) => {
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
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: (typeof users)[number]) => (
        <Tag color="cyan">{record.status}</Tag>
      ),
      width: 150,
    },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Quản lý người dùng
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Nền tảng quản trị 5 vai trò: customer, specialist, reviewer, coordinator_admin và super_admin.
        </Typography.Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={16}>
          <Typography.Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Vai trò hệ thống
          </Typography.Title>
          <Flex wrap="wrap" gap={8}>
            {roles.map((role) => (
              <Tag key={role.value} color={toneToColor[role.tone] ?? 'default'}>
                {role.label} ({role.value})
              </Tag>
            ))}
          </Flex>
          <Typography.Paragraph style={{ color: '#475569', margin: 0 }}>
            Thay đổi user/role/workspace gọi createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace và được ghi audit.
          </Typography.Paragraph>
        </Space>
      </Card>

      <Table
        dataSource={users}
        rowKey="email"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
      />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">Tạo người dùng</Button>
      </Flex>
    </>
  );
}
