'use client';

import { useState } from 'react';
import { Mail, Trash2, Clock } from 'lucide-react';

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
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    setConfirmRevoke(null);
    try {
      await onRevoke(inviteId);
      onRefresh();
    } catch {
      // error handled by parent
    } finally {
      setRevokingId(null);
    }
  };

  if (invites.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Mail size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Không có lời mời nào đang chờ</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {invites.map((invite) => {
          const daysLeft = getDaysUntilExpiry(invite.expiresAt);
          const isExpiringSoon = daysLeft <= 2;

          return (
            <div
              key={invite.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 14, border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'var(--color-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={20} style={{ color: 'var(--color-info)' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{invite.email}</strong>
                    <span className="badge badge-blue">{roleLabels[invite.role]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}</span>
                    {isExpiringSoon && daysLeft > 0 && (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Sắp hết hạn!</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                {confirmRevoke === invite.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="action-btn danger" onClick={() => handleRevoke(invite.id)} disabled={revokingId === invite.id}>
                      {revokingId === invite.id ? '...' : 'Xác nhận'}
                    </button>
                    <button className="action-btn" onClick={() => setConfirmRevoke(null)}>Hủy</button>
                  </div>
                ) : (
                  <button
                    className="action-btn danger"
                    onClick={() => setConfirmRevoke(invite.id)}
                  >
                    <Trash2 size={14} />
                    Thu hồi
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
