import { Tag, Button, Card, Table, Typography, Flex } from 'antd';

const workspaces = [
  { name: 'Công ty An Phát', slug: 'an-phat', members: '3 thành viên', status: 'Đang hoạt động' },
  { name: 'Công ty Minh Khang', slug: 'minh-khang', members: '2 thành viên', status: 'Đang hoạt động' },
  { name: 'Workspace nội bộ', slug: 'internal', members: '4 thành viên', status: 'Đang hoạt động' },
];

export default function WorkspacesPage() {
  const columns = [
    {
      title: 'Tên workspace',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
    },
    {
      title: 'Thành viên',
      dataIndex: 'members',
      key: 'members',
      width: 200,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: (typeof workspaces)[number]) => (
        <Tag color="cyan">{record.status}</Tag>
      ),
      width: 150,
    },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Workspace khách hàng
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Mỗi SME có workspace riêng để hiển thị membership và giảm rủi ro lộ dữ liệu giữa tenant.
        </Typography.Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Flex vertical gap={8}>
          <Typography.Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Ranh giới quyền truy cập
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
            Bạn không có quyền xem nội dung này. Nếu cần truy cập, hãy liên hệ quản trị viên.
          </Typography.Paragraph>
        </Flex>
      </Card>

      <Table
        dataSource={workspaces}
        rowKey="slug"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
      />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">Tạo workspace</Button>
      </Flex>
    </>
  );
}
