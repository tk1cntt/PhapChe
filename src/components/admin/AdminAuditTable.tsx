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
  workspace: { name: string; slug?: string };
}

interface AdminAuditTableProps {
  events: AuditEventRow[];
  loading?: boolean;
}

function getActionBadgeClass(action: string): string {
  const actionLower = action.toLowerCase();

  // Security/Danger - Red
  if (
    actionLower.includes('access_denied') ||
    actionLower.includes('unauthorized') ||
    actionLower.includes('blocked') ||
    actionLower.includes('forbidden') ||
    actionLower.includes('security_') ||
    actionLower.includes('delete_') ||
    actionLower.includes('_delete') ||
    actionLower.includes('remove_')
  ) {
    return 'badge red';
  }

  // Role/Permission changes - Purple
  if (
    actionLower.includes('role_change') ||
    actionLower.includes('role') ||
    actionLower.includes('updateuserrole') ||
    actionLower.includes('permission') ||
    actionLower.includes('grant') ||
    actionLower.includes('revoke') ||
    actionLower.includes('access_') ||
    actionLower.includes('_access')
  ) {
    return 'badge purple';
  }

  // Create/Add/Assign - Green
  if (
    actionLower.includes('create') ||
    actionLower.includes('assign') ||
    actionLower.includes('add') ||
    actionLower.includes('approve') ||
    actionLower.includes('accept') ||
    actionLower.includes('submit') ||
    actionLower.includes('upload') ||
    actionLower.includes('insert') ||
    actionLower.includes('register')
  ) {
    return 'badge green';
  }

  // Export/Download - Orange
  if (
    actionLower.includes('export') ||
    actionLower.includes('download') ||
    actionLower.includes('print') ||
    actionLower.includes('share') ||
    actionLower.includes('send')
  ) {
    return 'badge orange';
  }

  // View/Read - Blue (default for read operations)
  if (
    actionLower.includes('view') ||
    actionLower.includes('read') ||
    actionLower.includes('get') ||
    actionLower.includes('list') ||
    actionLower.includes('search') ||
    actionLower.includes('filter') ||
    actionLower.includes('login') ||
    actionLower.includes('logout') ||
    actionLower.includes('sign_in') ||
    actionLower.includes('sign_out')
  ) {
    return 'badge blue';
  }

  // Update/Edit - Cyan (for modifications)
  if (
    actionLower.includes('update') ||
    actionLower.includes('edit') ||
    actionLower.includes('modify') ||
    actionLower.includes('change') ||
    actionLower.includes('set_') ||
    actionLower.includes('_set') ||
    actionLower.includes('move') ||
    actionLower.includes('transfer')
  ) {
    return 'badge cyan';
  }

  // Default - Gray for unknown actions
  return 'badge gray';
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ICT',
  };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/[đ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMetadata(metadata: string | null): { title: string; details?: string } {
  if (!metadata) return { title: '-' };
  // Try to parse JSON-like metadata
  try {
    const parsed = JSON.parse(metadata);
    if (typeof parsed === 'object') {
      const keys = Object.keys(parsed).filter(k => !['id', 'requestId', 'workspaceId'].includes(k));
      if (keys.length > 0) {
        const title = keys.slice(0, 2).map(k => `${k}: ${parsed[k]}`).join(', ');
        return { title, details: undefined };
      }
    }
  } catch {
    // Not JSON, treat as plain text
  }
  // Plain text - split by common delimiters
  const parts = metadata.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return { title: parts[0], details: parts.slice(1).join(', ') };
  }
  return { title: metadata, details: undefined };
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

        // Actor: show name if available, otherwise email, otherwise system
        const actorName = event.actor?.name ?? event.actor?.email ?? 'system';
        const initials = getInitials(actorName);
        const isSystem = actorName === 'system';

        // Workspace: show name with slug below
        const workspaceSlug = event.workspace.slug || slugify(event.workspace.name);

        // Parse metadata for structured display
        const { title: metaTitle, details: metaDetails } = parseMetadata(event.metadataSummary);

        return (
          <div key={event.id} className="audit-table-row">
            {/* Thời gian */}
            <div className="audit-td">
              <div className="time-stack">
                <strong>{date}</strong>
                <span>{time}</span>
              </div>
            </div>

            {/* Actor */}
            <div className="audit-td">
              <div className="actor-cell">
                <div className="mini-avatar">{initials}</div>
                <div>
                  <strong>{actorName}</strong>
                  <span>{isSystem ? 'system' : 'user'}</span>
                </div>
              </div>
            </div>

            {/* Workspace */}
            <div className="audit-td">
              <div className="workspace-cell">
                <strong>{event.workspace.name}</strong>
                <span>{workspaceSlug}</span>
              </div>
            </div>

            {/* Hành động */}
            <div className="audit-td">
              <span className={getActionBadgeClass(event.action)}>{event.action}</span>
            </div>

            {/* Đối tượng */}
            <div className="audit-td">
              {event.targetType}:{event.targetId}
            </div>

            {/* Mã tương quan */}
            <div className="audit-td">
              {event.correlationId ? (
                <span className="correlation">{event.correlationId}</span>
              ) : (
                '-'
              )}
            </div>

            {/* Tóm tắt metadata */}
            <div className="audit-td">
              <div className="metadata-cell">
                <strong>{metaTitle}</strong>
                {metaDetails && <span>{metaDetails}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
