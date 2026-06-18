'use client';

import { useState } from 'react';
import { Table, Avatar, Tag, Dropdown, Button, message, Popconfirm, Space } from 'antd';
import { MoreOutlined, UserOutlined, EditOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

export interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  role: 'admin' | 'specialist' | 'viewer';
  isActive: boolean;
  joinedAt: string;
}

interface MembersTableProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
  onRoleChange: (memberId: string, newRole: string) => void;
  onStatusToggle: (memberId: string, isActive: boolean) => void;
  onRemove: (memberId: string) => void;
  loading?: boolean;
}

const roleColors: Record<string, string> = {
  admin: 'purple',
  specialist: 'blue',
  viewer: 'default',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  specialist: 'Specialist',
  viewer: 'Viewer',
};

export function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  isAdmin,
  onRoleChange,
  onStatusToggle,
  onRemove,
  loading,
}: MembersTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setActionLoading('executing');
      await action();
    } catch {
      message.error('Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const getMenuItems = (record: Member): MenuProps['items'] => {
    const items: MenuProps['items'] = [];

    if (isAdmin && record.user.id !== currentUserId) {
      // Change Role
      const otherRoles = ['admin', 'specialist', 'viewer'].filter((r) => r !== record.role);
      items.push({
        key: 'role',
        label: 'Đổi vai trò',
        icon: <EditOutlined />,
        children: otherRoles.map((role) => ({
          key: `role-${role}`,
          label: roleLabels[role],
          onClick: () =>
            handleAction(async () => {
              await onRoleChange(record.id, role);
              message.success(`Đã đổi vai trò thành ${roleLabels[role]}`);
            }),
        })),
      });

      // Toggle Status
      items.push({
        key: 'toggle',
        label: record.isActive ? 'Tạm khóa' : 'Kích hoạt',
        icon: <StopOutlined />,
        onClick: () =>
          handleAction(async () => {
            await onStatusToggle(record.id, !record.isActive);
            message.success(record.isActive ? 'Đã tạm khóa thành viên' : 'Đã kích hoạt thành viên');
          }),
      });

      // Remove
      items.push({
        type: 'divider',
      });
      items.push({
        key: 'remove',
        label: 'Xóa thành viên',
        icon: <DeleteOutlined />,
        danger: true,
      });
    }

    return items;
  };

  const columns = [
    {
      title: 'Thành viên',
      key: 'member',
      render: (_: unknown, record: Member) => (
        <Space>
          <Avatar src={record.user.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.user.name}</div>
            <div className="text-xs text-gray-500">{record.user.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Hoạt động' : 'Tạm khóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: Member) => {
        if (!isAdmin || record.user.id === currentUserId) {
          return null;
        }

        return (
          <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              loading={actionLoading !== null}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={members}
      rowKey="id"
      loading={loading}
      pagination={false}
      locale={{ emptyText: 'Chưa có thành viên nào' }}
    />
  );
}
