'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, Button, Card, Space, Tag, message, Spin } from 'antd';
import { PlusOutlined, TeamOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { MembersTable, Member } from './MembersTable';
import { InviteMembersModal } from './InviteMembersModal';
import { PendingInvitesList, PendingInvite } from './PendingInvitesList';
import { RoleChangeDialog } from './RoleChangeDialog';

interface PartnerSettingsClientProps {
  currentUserId: string;
  currentUserRole: string;
}

export function PartnerSettingsClient({ currentUserId, currentUserRole }: PartnerSettingsClientProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Role change dialog state
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    isOpen: boolean;
    member: Member | null;
    newRole: string;
  }>({ isOpen: false, member: null, newRole: '' });

  const isAdmin = currentUserRole === 'admin';

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/partner/members');
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách thành viên');
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch('/api/partner/invite');
      if (!response.ok) throw new Error('Failed to fetch invites');
      const data = await response.json();
      setInvites(data.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách lời mời');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMembers(), fetchInvites()]);
    setLoading(false);
  }, [fetchMembers, fetchInvites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/partner/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      await fetchMembers();
    } catch (error) {
      throw error;
    }
  };

  const handleStatusToggle = async (memberId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/partner/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      await fetchMembers();
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/partner/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      await fetchMembers();
    } catch (error) {
      throw error;
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/partner/invite/${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke invite');
      }

      await fetchInvites();
    } catch (error) {
      throw error;
    }
  };

  const openRoleChangeDialog = (member: Member, newRole: string) => {
    setRoleChangeDialog({ isOpen: true, member, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeDialog.member) return;

    try {
      await handleRoleChange(roleChangeDialog.member.id, roleChangeDialog.newRole);
      setRoleChangeDialog({ isOpen: false, member: null, newRole: '' });
    } catch {
      message.error('Không thể đổi vai trò');
    }
  };

  const tabItems = [
    {
      key: 'members',
      label: (
        <Space>
          <TeamOutlined />
          Thành viên ({members.length})
        </Space>
      ),
      children: (
        <Card
          title="Danh sách thành viên"
          extra={
            isAdmin ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsInviteModalOpen(true)}>
                Mời thành viên
              </Button>
            ) : null
          }
        >
          <MembersTable
            members={members}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isAdmin={isAdmin}
            onRoleChange={(memberId, newRole) => {
              const member = members.find((m) => m.id === memberId);
              if (member) openRoleChangeDialog(member, newRole);
            }}
            onStatusToggle={handleStatusToggle}
            onRemove={handleRemoveMember}
            loading={loading}
          />
        </Card>
      ),
    },
    {
      key: 'invites',
      label: (
        <Space>
          <MailOutlined />
          Lời mời ({invites.length})
        </Space>
      ),
      children: (
        <Card title="Lời mời đang chờ">
          <PendingInvitesList
            invites={invites}
            onRevoke={handleRevokeInvite}
            onRefresh={fetchInvites}
            loading={loading}
          />
        </Card>
      ),
    },
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          Thông tin
        </Space>
      ),
      children: (
        <Card title="Thông tin tài khoản Partner">
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <div className="text-gray-500 mb-1">Vai trò hiện tại</div>
              <Tag color={currentUserRole === 'admin' ? 'purple' : currentUserRole === 'specialist' ? 'blue' : 'default'}>
                {currentUserRole === 'admin' ? 'Admin' : currentUserRole === 'specialist' ? 'Specialist' : 'Viewer'}
              </Tag>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Quyền hạn</div>
              <div className="text-sm">
                {currentUserRole === 'admin' && 'Quản lý thành viên, Quản lý yêu cầu, Xem tài liệu'}
                {currentUserRole === 'specialist' && 'Xem và quản lý yêu cầu, Xem tài liệu'}
                {currentUserRole === 'viewer' && 'Chỉ xem yêu cầu và tài liệu'}
              </div>
            </div>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cài đặt Partner</h1>
        {isAdmin && (
          <Tag color="purple">
            <TeamOutlined /> Admin
          </Tag>
        )}
      </div>

      {loading && !members.length ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      )}

      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={() => {
          fetchInvites();
          fetchMembers();
        }}
      />

      {roleChangeDialog.member && (
        <RoleChangeDialog
          isOpen={roleChangeDialog.isOpen}
          currentRole={roleChangeDialog.member.role}
          newRole={roleChangeDialog.newRole}
          memberName={roleChangeDialog.member.user.name}
          onConfirm={confirmRoleChange}
          onCancel={() => setRoleChangeDialog({ isOpen: false, member: null, newRole: '' })}
        />
      )}
    </div>
  );
}
