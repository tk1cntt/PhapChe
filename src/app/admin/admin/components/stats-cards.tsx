'use client';

import { Card, Row, Col, Flex, Typography } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

interface StatCardProps {
  title: string;
  count: number;
  borderColor: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, count, borderColor, icon }: StatCardProps) => (
  <Card
    style={{
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}
    styles={{ body: { padding: '20px' } }}
  >
    <Flex justify="space-between" align="center">
      <div>
        <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
          {title}
        </Typography.Text>
        <Title level={2} style={{ margin: '8px 0 0', fontWeight: 600 }}>
          {count}
        </Title>
      </div>
      <div style={{ fontSize: '32px', color: borderColor, opacity: 0.9 }}>
        {icon}
      </div>
    </Flex>
  </Card>
);

interface DashboardStatsProps {
  data?: {
    total: number;
    pending: number;
    completed: number;
    urgent: number;
  };
}

export default function DashboardStats({ data }: DashboardStatsProps) {
  const stats = data || {
    total: 150,
    pending: 25,
    completed: 120,
    urgent: 5,
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Tổng hợp"
          count={stats.total}
          borderColor="#8E8E8E"
          icon={<FileTextOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Đang xử lý"
          count={stats.pending}
          borderColor="#F39C12"
          icon={<ClockCircleOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Đã hoàn thành"
          count={stats.completed}
          borderColor="#27AE60"
          icon={<CheckCircleOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard
          title="Khẩn cấp"
          count={stats.urgent}
          borderColor="#E74C3C"
          icon={<ExclamationCircleOutlined />}
        />
      </Col>
    </Row>
  );
}
