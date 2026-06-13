'use client';

import { useTranslations } from 'next-intl';

export interface AuditEventRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: string;
  actor?: { email: string | null; name: string | null } | null;
  workspace: { name: string };
}

interface AdminAuditTableProps {
  events: AuditEventRow[];
  loading?: boolean;
}

function getActionBadgeClass(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('access_denied') || actionLower.includes('unauthorized')) {
    return 'badge red';
  }
  if (actionLower.includes('role_change') || actionLower.includes('role') || actionLower.includes('updateuserrole')) {
    return 'badge purple';
  }
  if (actionLower.includes('create') || actionLower.includes('assign') || actionLower.includes('add')) {
    return 'badge green';
  }
  if (actionLower.includes('export')) {
    return 'badge orange';
  }
  return 'badge blue';
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ICT',
  };
}

function getInitials(email: string | null | undefined): string {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export function AdminAuditTable({ events, loading }: AdminAuditTableProps) {
  const t = useTranslations('AuditEvents');

  if (loading) {
    return (
      <div className="audit-table-card">
        <div className="audit-table-head">
          <div className="audit-th">Thời gian</div>
          <div className="audit-th">Actor</div>
          <div className="audit-th">Workspace</div>
          <div className="audit-th">Hành động</div>
          <div className="audit-th">Đối tượng</div>
          <div className="audit-th">Mã tương quan</div>
          <div className="audit-th">Tóm tắt metadata</div>
        </div>
        <div className="audit-loading">Đang tải...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="audit-table-card">
        <div className="audit-table-head">
          <div className="audit-th">Thời gian</div>
          <div className="audit-th">Actor</div>
          <div className="audit-th">Workspace</div>
          <div className="audit-th">Hành động</div>
          <div className="audit-th">Đối tượng</div>
          <div className="audit-th">Mã tương quan</div>
          <div className="audit-th">Tóm tắt metadata</div>
        </div>
        <div className="audit-empty">{t('noData') || 'Không có dữ liệu'}</div>
      </div>
    );
  }

  return (
    <div className="audit-table-card">
      <div className="audit-table-head">
        <div className="audit-th">Thời gian</div>
        <div className="audit-th">Actor</div>
        <div className="audit-th">Workspace</div>
        <div className="audit-th">Hành động</div>
        <div className="audit-th">Đối tượng</div>
        <div className="audit-th">Mã tương quan</div>
        <div className="audit-th">Tóm tắt metadata</div>
      </div>

      {events.map((event) => {
        const { date, time } = formatDateTime(event.createdAt);
        const actorEmail = event.actor?.email ?? 'system';
        const initials = getInitials(actorEmail);

        return (
          <div key={event.id} className="audit-table-row">
            <div className="audit-td">
              <div className="time-stack">
                <strong>{date}</strong>
                <span>{time}</span>
              </div>
            </div>
            <div className="audit-td">
              <div className="actor-cell">
                <div className="mini-avatar">{initials}</div>
                <div>
                  <strong>{actorEmail}</strong>
                  <span>{actorEmail === 'system' ? 'system' : 'user'}</span>
                </div>
              </div>
            </div>
            <div className="audit-td">
              <div className="workspace-cell">
                <strong>{event.workspace.name}</strong>
              </div>
            </div>
            <div className="audit-td">
              <span className={getActionBadgeClass(event.action)}>{event.action}</span>
            </div>
            <div className="audit-td">
              {event.targetType}:{event.targetId}
            </div>
            <div className="audit-td">
              {event.correlationId ? (
                <span className="correlation">{event.correlationId}</span>
              ) : (
                '-'
              )}
            </div>
            <div className="audit-td">
              <div className="metadata-cell">
                {event.metadataSummary ?? '-'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
