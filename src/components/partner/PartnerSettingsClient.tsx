'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { MembersTable, Member } from './MembersTable';
import { InviteMembersModal } from './InviteMembersModal';
import { PendingInvitesList, PendingInvite } from './PendingInvitesList';
import { RoleChangeDialog } from './RoleChangeDialog';

interface PartnerSettingsClientProps {
  currentUserId: string;
  currentUserRole: string;
}

const TABS = [
  { key: 'members', label: 'Thành viên', icon: Users },
  { key: 'invites', label: 'Lời mời', icon: Mail },
  { key: 'profile', label: 'Thông tin', icon: User },
];

export function PartnerSettingsClient({ currentUserId, currentUserRole }: PartnerSettingsClientProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } catch {
      toast.error('Không thể tải danh sách thành viên');
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch('/api/partner/invite');
      if (!response.ok) throw new Error('Failed to fetch invites');
      const data = await response.json();
      setInvites(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách lời mời');
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
      toast.success(`Đã đổi vai trò thành ${newRole}`);
    } catch {
      toast.error('Không thể đổi vai trò');
      throw new Error('Role change failed');
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
      toast.success(isActive ? 'Đã kích hoạt thành viên' : 'Đã tạm khóa thành viên');
    } catch {
      toast.error('Không thể cập nhật trạng thái');
      throw new Error('Status toggle failed');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/partner/members/${memberId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }
      await fetchMembers();
      toast.success('Đã xóa thành viên');
    } catch {
      toast.error('Không thể xóa thành viên');
      throw new Error('Remove member failed');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/partner/invite/${inviteId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke invite');
      }
      await fetchInvites();
      toast.success('Đã thu hồi lời mời');
    } catch {
      toast.error('Không thể thu hồi lời mời');
      throw new Error('Revoke invite failed');
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
      // error already shown
    }
  };

  const roleBadgeClass = currentUserRole === 'admin' ? 'badge-purple' : currentUserRole === 'specialist' ? 'badge-blue' : 'badge-green';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>Cài đặt Partner</h1>
        </div>
        {isAdmin && <span className={`badge ${roleBadgeClass}`}><Users size={14} /> Admin</span>}
      </div>

      {/* Loading */}
      {loading && !members.length ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      ) : (
        <>
          {/* Custom Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 20px', border: 'none', background: 'none',
                    borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    fontSize: 'var(--text-sm)', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.key === 'members' && ` (${members.length})`}
                  {tab.key === 'invites' && ` (${invites.length})`}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'members' && (
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">Danh sách thành viên</div>
                {isAdmin && (
                  <button className="btn-primary" onClick={() => setIsInviteModalOpen(true)}>
                    <Plus size={16} />
                    Mời thành viên
                  </button>
                )}
              </div>
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
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">Lời mời đang chờ</div>
              </div>
              <PendingInvitesList
                invites={invites}
                onRevoke={handleRevokeInvite}
                onRefresh={fetchInvites}
                loading={loading}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">Thông tin tài khoản Partner</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 4, fontSize: 'var(--text-sm)' }}>Vai trò hiện tại</div>
                  <span className={`badge ${roleBadgeClass}`}>
                    {currentUserRole === 'admin' ? 'Admin' : currentUserRole === 'specialist' ? 'Specialist' : 'Viewer'}
                  </span>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 4, fontSize: 'var(--text-sm)' }}>Quyền hạn</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>
                    {currentUserRole === 'admin' && 'Quản lý thành viên, Quản lý yêu cầu, Xem tài liệu'}
                    {currentUserRole === 'specialist' && 'Xem và quản lý yêu cầu, Xem tài liệu'}
                    {currentUserRole === 'viewer' && 'Chỉ xem yêu cầu và tài liệu'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
