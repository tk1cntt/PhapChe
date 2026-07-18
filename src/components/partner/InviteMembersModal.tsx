'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

export function InviteMembersModal({ isOpen, onClose, onInviteSent }: InviteMembersModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'specialist' | 'viewer'>('specialist');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setFieldError('Vui lòng nhập email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Email không hợp lệ');
      return;
    }
    setFieldError(null);

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/partner/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gửi lời mời thất bại');
      }

      setEmail('');
      setRole('specialist');
      onInviteSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi lời mời');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>Mời thành viên mới</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(null); }}
              className={fieldError ? 'error' : ''}
            />
            {fieldError && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{fieldError}</span>}
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label>Vai trò</label>
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="admin">Admin - Quản trị viên</option>
              <option value="specialist">Specialist - Chuyên viên</option>
              <option value="viewer">Viewer - Người xem</option>
            </select>
          </div>

          {error && (
            <div style={{
              background: 'var(--color-danger-muted)', color: 'var(--color-danger)',
              padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16,
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi lời mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
