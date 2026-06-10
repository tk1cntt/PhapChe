'use client';

import { Card, Typography, Table, Tag, Space, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import DashboardStats from './components/stats-cards';
import { useTranslations } from 'next-intl';

const { Title, Text } = Typography;

// Mock data for recent requests
const recentRequests = [
  {
    key: '1',
    id: 'HS-2024-001',
    title: 'Hợp đồng lao động - Công ty ABC',
    status: 'pending',
    createdAt: '2024-01-15',
  },
  {
    key: '2',
    id: 'HS-2024-002',
    title: 'Điều lệ công ty - Công ty XYZ',
    status: 'in_progress',
    createdAt: '2024-01-14',
  },
  {
    key: '3',
    id: 'HS-2024-003',
    title: 'Biên bản họp - Công ty DEF',
    status: 'completed',
    createdAt: '2024-01-13',
  },
  {
    key: '4',
    id: 'HS-2024-004',
    title: 'Thỏa thuận bảo mật - Công ty GHI',
    status: 'urgent',
    createdAt: '2024-01-12',
  },
];

const statusColors: Record<string, string> = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  urgent: 'red',
};

const statusLabels: Record<string, string> = {
  pending: 'Đang xử lý',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  urgent: 'Khẩn cấp',
};

export default function AdminDashboardPage() {
  const t = useTranslations();

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, record: { key: string }) => (
        <Link href={`/admin/requests/${record.key}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">
            Xem
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      {/* Welcome Section from template */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Xin chào, Quản trị viên!
        </Title>
        <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
          Chào mừng bạn đến với hệ thống quản lý pháp lý Pháp Chể
        </Text>
      </Card>

      {/* Stats Cards */}
      <div style={{ marginBottom: 24 }}>
        <DashboardStats />
      </div>

      {/* Recent Requests Table from template */}
      <Card
        title="Yêu cầu gần đây"
        style={{
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: 0 } }}
        extra={
          <Link href="/admin/requests">
            <Button type="link">Xem tất cả</Button>
          </Link>
        }
      >
        <Table
          dataSource={recentRequests}
          columns={columns}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
