'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag, Button, Space, Spin } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

interface PartnerDashboardClientProps {
  currentUserId: string;
  currentUserRole: string;
  partnerName: string;
  memberCount: number;
}

interface RequestSummary {
  total: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
}

interface RecentRequest {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

export function PartnerDashboardClient({
  currentUserId,
  currentUserRole,
  partnerName,
  memberCount,
}: PartnerDashboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RequestSummary>({
    total: 0,
    inProgress: 0,
    pendingReview: 0,
    completed: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/partner/requests?limit=5');
        if (response.ok) {
          const data = await response.json();
          setRecentRequests(data.data || []);

          // Calculate stats
          const allResponse = await fetch('/api/partner/requests?limit=100');
          if (allResponse.ok) {
            const allData = await allResponse.json();
            const requests = allData.data || [];
            setStats({
              total: requests.length,
              inProgress: requests.filter((r: RecentRequest) => r.status === 'in_progress').length,
              pendingReview: requests.filter((r: RecentRequest) => r.status === 'pending_review').length,
              completed: requests.filter(
                (r: RecentRequest) =>
                  r.status === 'approved' || r.status === 'delivered' || r.status === 'completed'
              ).length,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'blue';
      case 'pending_review':
        return 'orange';
      case 'approved':
      case 'delivered':
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_progress: 'Đang xử lý',
      pending_review: 'Chờ duyệt',
      approved: 'Đã duyệt',
      delivered: 'Đã giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      draft_intake: 'Nháp',
      intake_submitted: 'Đã gửi',
      triage: 'Phân loại',
      assigned: 'Đã phân công',
      revision_required: 'Cần sửa',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Partner Dashboard</h1>
          <p className="text-gray-500">{partnerName}</p>
        </div>
        <Tag color={isAdmin ? 'purple' : 'blue'}>
          {isAdmin ? 'Admin' : currentUserRole === 'specialist' ? 'Specialist' : 'Viewer'}
        </Tag>
      </div>

      {/* Stats Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng yêu cầu"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ duyệt"
              value={stats.pendingReview}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Thao tác nhanh">
        <Space size="large">
          {isAdmin && (
            <Link href="/vi/partner/settings">
              <Button type="primary" icon={<SettingOutlined />}>
                Quản lý thành viên
              </Button>
            </Link>
          )}
          <Link href="/vi/partner/requests">
            <Button icon={<FileTextOutlined />}>
              Xem tất cả yêu cầu
            </Button>
          </Link>
        </Space>
      </Card>

      {/* Recent Requests */}
      <Card
        title="Yêu cầu gần đây"
        extra={
          <Link href="/vi/partner/requests">
            <Button type="link">
              Xem tất cả <ArrowRightOutlined />
            </Button>
          </Link>
        }
      >
        <List
          dataSource={recentRequests}
          locale={{ emptyText: 'Chưa có yêu cầu nào' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tag key="status" color={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={item.title || `Yêu cầu ${item.id.slice(0, 8)}`}
                description={`Cập nhật: ${new Date(item.updatedAt).toLocaleDateString('vi-VN')}`}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Admin Section */}
      {isAdmin && (
        <Card title="Quản trị">
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="Thành viên">
                <Statistic value={memberCount} prefix={<TeamOutlined />} />
                <div className="mt-2">
                  <Link href="/vi/partner/settings">
                    <Button type="link" size="small">
                      Quản lý thành viên →
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Lời mời">
                <Statistic value="-" prefix={<TeamOutlined />} suffix="đang chờ" />
                <div className="mt-2">
                  <Link href="/vi/partner/settings?tab=invites">
                    <Button type="link" size="small">
                      Gửi lời mời →
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
