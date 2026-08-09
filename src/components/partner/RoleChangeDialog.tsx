'use client';

import { AlertTriangle } from 'lucide-react';

interface RoleChangeDialogProps {
  isOpen: boolean;
  currentRole: string;
  newRole: string;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin - Quản trị viên',
  specialist: 'Specialist - Chuyên viên',
  viewer: 'Viewer - Người xem',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Có quyền quản lý thành viên, xem và quản lý yêu cầu, tài liệu',
  specialist: 'Có quyền xem và quản lý yêu cầu, tài liệu',
  viewer: 'Chỉ có quyền xem yêu cầu và tài liệu',
};

export function RoleChangeDialog({
  isOpen,
  currentRole,
  newRole,
  memberName,
  onConfirm,
  onCancel,
  isLoading,
}: RoleChangeDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800 }}>Xác nhận đổi vai trò</h3>
        </div>

        <p style={{ marginBottom: 16 }}>
          Bạn có chắc chắn muốn đổi vai trò của <strong>{memberName}</strong>?
        </p>

        <div style={{
          background: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Vai trò hiện tại:</span>
            <span style={{ fontWeight: 600 }}>{roleLabels[currentRole]}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Vai trò mới:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-info)' }}>{roleLabels[newRole]}</span>
          </div>
        </div>

        <div style={{
          background: 'var(--color-warning-muted)',
          border: '1px solid var(--color-warning)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 20,
        }}>
          <p style={{ fontWeight: 700, margin: '0 0 8px', fontSize: 'var(--text-sm)' }}>Thay đổi quyền hạn</p>
          <p style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)' }}>
            Sau khi đổi vai trò, {memberName} sẽ{' '}
            {newRole === 'viewer' ? 'mất quyền quản lý yêu cầu và thành viên' : 'có thêm quyền quản lý'}
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            <strong>Quyền mới:</strong> {roleDescriptions[newRole]}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-ghost" onClick={onCancel} disabled={isLoading}>Hủy</button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={isLoading}
            style={currentRole === 'admin' && newRole !== 'admin' ? { background: 'var(--color-danger)' } : undefined}
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
