'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, User, Edit, StopCircle, Trash2, Mail } from 'lucide-react';
import { DropdownMenu } from '@/components/shared/ui/DropdownMenu';
import type { DropdownItem } from '@/components/shared/ui/DropdownMenu';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';

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
  isAdmin: boolean;
  onRoleChange: (memberId: string, newRole: string) => void;
  onStatusToggle: (memberId: string, isActive: boolean) => void;
  onRemove: (memberId: string) => void;
  loading?: boolean;
}

const roleBadgeClass: Record<string, string> = {
  admin: 'badge-purple',
  specialist: 'badge-blue',
  viewer: 'badge-green',
};

function getInitials(name: string): string {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
}

export function MembersTable({
  members,
  currentUserId,
  isAdmin,
  onRoleChange,
  onStatusToggle,
  onRemove,
}: MembersTableProps) {
  const t = useTranslations('PartnerDashboard');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const roleLabels: Record<string, string> = {
    admin: t('roleAdmin'),
    specialist: t('roleSpecialist'),
    viewer: t('roleViewer'),
  };

  const closeConfirm = useCallback(() => setConfirmDelete(null), []);

  useEffect(() => {
    if (!confirmDelete) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeConfirm();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [confirmDelete, closeConfirm]);

  const getMenuItems = (record: Member): DropdownItem[] => {
    const items: DropdownItem[] = [];

    if (isAdmin && record.user.id !== currentUserId) {
      const otherRoles = ['admin', 'specialist', 'viewer'].filter((r) => r !== record.role);
      items.push({
        key: 'role-header',
        label: `${t('changeRole')} (${otherRoles.map((r) => roleLabels[r]).join(', ')})`,
        icon: <Edit size={16} />,
      });
      otherRoles.forEach((role) => {
        items.push({
          key: `role-${role}`,
          label: `  → ${roleLabels[role]}`,
          onClick: () => onRoleChange(record.id, role),
        });
      });

      items.push({
        key: 'toggle',
        label: record.isActive ? t('lockAccount') : t('activateAccount'),
        icon: <StopCircle size={16} />,
        onClick: () => onStatusToggle(record.id, !record.isActive),
      });

      items.push({
        key: 'remove',
        label: t('removeMember'),
        icon: <Trash2 size={16} />,
        danger: true,
        onClick: () => setConfirmDelete(record.id),
      });
    }

    return items;
  };

  if (members.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
        <Mail size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
        <p style={{ color: 'var(--color-text-muted)' }}>{t('noMembers')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-box">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('memberHeader')}</th>
              <th style={{ width: 130 }}>{t('roleHeader')}</th>
              <th style={{ width: 130 }}>{t('statusHeader')}</th>
              <th style={{ width: 140 }}>{t('joinDateHeader')}</th>
              {isAdmin && <th style={{ width: 60 }} />}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--color-surface-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)',
                      flexShrink: 0,
                    }}>
                      {getInitials(m.user.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.user.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{m.user.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${roleBadgeClass[m.role]}`}>{roleLabels[m.role]}</span></td>
                <td>
                  <span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>
                    {m.isActive ? t('statusActive') : t('statusLocked')}
                  </span>
                </td>
                <td><FormattedDate date={m.joinedAt} variant="date" /></td>
                {isAdmin && (
                  <td>
                    {m.user.id !== currentUserId && (
                      <DropdownMenu items={getMenuItems(m)} trigger={['click']} placement="bottomRight">
                        <button className="tool-btn square" type="button" style={{ width: 36, height: 36 }}>
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenu>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('confirmDeleteTitle')}
          description={t('confirmDeleteDesc')}
          onConfirm={() => { onRemove(confirmDelete); closeConfirm(); }}
          onCancel={closeConfirm}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          destructive
        />
      )}
    </>
  );
}
