'use client';

import { useState } from 'react';
import { List, Tag, Button, message, Popconfirm, Empty, Space } from 'antd';
import { MailOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';

export interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'specialist' | 'viewer';
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

interface PendingInvitesListProps {
  invites: PendingInvite[];
  onRevoke: (inviteId: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  specialist: 'Specialist',
  viewer: 'Viewer',
};

export function PendingInvitesList({ invites, onRevoke, onRefresh, loading }: PendingInvitesListProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      await onRevoke(inviteId);
      message.success('Đã thu hồi lời mời');
      onRefresh();
    } catch {
      message.error('Không thể thu hồi lời mời');
    } finally {
      setRevokingId(null);
    }
  };

  if (invites.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Không có lời mời nào đang chờ"
      />
    );
  }

  return (
    <List
      loading={loading}
      dataSource={invites}
      renderItem={(invite) => {
        const daysLeft = getDaysUntilExpiry(invite.expiresAt);
        const isExpiringSoon = daysLeft <= 2;

        return (
          <List.Item
            actions={[
              <Popconfirm
                key="revoke"
                title="Thu hồi lời mời?"
                description="Thao tác này không thể hoàn tác."
                onConfirm={() => handleRevoke(invite.id)}
                okText="Thu hồi"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={revokingId === invite.id}
                >
                  Thu hồi
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={<MailOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={
                <Space>
                  <span>{invite.email}</span>
                  <Tag color="blue">{roleLabels[invite.role]}</Tag>
                </Space>
              }
              description={
                <Space size="large">
                  <span>
                    <ClockCircleOutlined /> {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                  </span>
                  <span className={isExpiringSoon ? 'text-red-500' : ''}>
                    {isExpiringSoon && daysLeft > 0 ? 'Sắp hết hạn!' : ''}
                  </span>
                </Space>
              }
            />
          </List.Item>
        );
      }}
    />
  );
}
