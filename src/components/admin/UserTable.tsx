'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Paging from '@/components/ui/Paging';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';

export type UserRow = {
  id: string;
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  status: string;
  lastActive?: string | null;
};

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

interface UserTableProps {
  dataSource: UserRow[];
  roleColors?: Record<string, { bg: string; color: string }>;
  avatarColors?: Record<string, { bg: string; color: string }>;
  pagination?: false | PaginationConfig;
  locale?: string;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}
  return trimmed.slice(0, 2).toUpperCase();
}
// Example extraction for the status badge:
function StatusBadge({ status, label, dot, color, bg }: {
  status: string; label: string; dot: string; color: string; bg: string;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 11px', borderRadius: 999, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', background: bg, color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', marginRight: 7, background: dot }} />
      {label}
    </span>
  );
}

// Similarly extract: UserTableHeader, UserTableRow, RoleBadge, CellText, TableCell
      {label}
    </span>
  );
}

// Similarly extract: UserTableHeader, UserTableRow, RoleBadge, CellText, TableCell
    );
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '0 0 15px 15px',
      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
      overflow: 'hidden',
    }}>
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
const GRID_COLUMNS = '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr';
// … then use GRID_COLUMNS in both places:
// gridTemplateColumns: GRID_COLUMNS,
// … then use GRID_COLUMNS in both places:
// gridTemplateColumns: GRID_COLUMNS,
        }}
      >
        <div style={{ minHeight: 54, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
const CHECKBOX_STYLE = {
  width: 18, height: 18, border: '2px solid #cbd5e1', borderRadius: 4,
  background: 'var(--color-surface)', display: 'block',
} as const;

// Usage:
<span style={CHECKBOX_STYLE} />
        </div>
        {[
          t('name'),
          t('email'),
          t('role'),
          t('workspace'),
          t('status'),
          t('lastActive'),
          t('action'),
        ].map((header, idx) => (
          <div
            key={header}
            style={{
              minHeight: 54,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              color: 'var(--color-text-secondary)',
              fontSize: 14,
              fontWeight: 700,
              borderRight: idx < 6 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Table Rows */}
      {dataSource.map((row) => {
        const rColor = roleColors?.[row.role] || { bg: '#dbeafe', color: 'var(--color-info)' };
        const aColor = avatarColors?.[row.role] || { bg: '#eef2f7', color: 'var(--color-text-secondary)' };

// Move outside the component (module-level) or compute once via useMemo:
const STATUS_BADGE_MAP: Record<string, { labelKey: string; color: string; bg: string; dot: string }> = {
  active:  { labelKey: 'active',  color: 'var(--color-primary)',  bg: '#ccfbf1', dot: '#10b981' },
  invited: { labelKey: 'invited', color: '#ea580c',             bg: '#ffedd5', dot: '#f97316' },
};
const FALLBACK_BADGE = { labelKey: 'inactive', color: 'var(--color-danger)', bg: '#ffe4e6', dot: '#ef4444' };

// Inside the map callback:
const badgeDef = STATUS_BADGE_MAP[row.status] ?? FALLBACK_BADGE;
const statusBadge = { ...badgeDef, label: t(badgeDef.labelKey) };
const badgeDef = STATUS_BADGE_MAP[row.status] ?? FALLBACK_BADGE;
const statusBadge = { ...badgeDef, label: t(badgeDef.labelKey) };
const ACTION_LABEL_KEY_MAP: Record<string, string> = {
  active: 'editAction',
  invited: 'resendAction',
};
const DEFAULT_ACTION_KEY = 'activateAction';

// Inside map callback:
const actionLabel = `${t(ACTION_LABEL_KEY_MAP[row.status] ?? DEFAULT_ACTION_KEY)} →`;
const DEFAULT_ACTION_KEY = 'activateAction';

// Inside map callback:
const actionLabel = `${t(ACTION_LABEL_KEY_MAP[row.status] ?? DEFAULT_ACTION_KEY)} →`;
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr',
              minHeight: 72,
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              transition: '0.2s',
            }}
            // Replace inline hover handlers with a CSS class using :hover:
            // .userTableRow:hover { background: #fbfdff; }
            // Then apply: className="userTableRow" style={{ background: 'var(--color-surface)' }}
            // Then apply: className="userTableRow" style={{ background: 'var(--color-surface)' }}
            {/* Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <span style={{
                width: 18,
                height: 18,
                border: '2px solid #cbd5e1',
                borderRadius: 4,
                background: 'var(--color-surface)',
                display: 'block',
              }} />
            </div>

            {/* Name */}
// Extract as a local helper or separate component:
function TableCell({ children, borderRight = true }: { children: React.ReactNode; borderRight?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '0 16px',
      borderRight: borderRight ? '1px solid var(--color-border)' : 'none',
      minWidth: 0,
    }}>
      {children}
    </div>
  );
}
    }}>
      {children}
    </div>
  );
}
                    borderRadius: '50%',
                    background: aColor.bg,
                    color: aColor.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(row.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: 'var(--color-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{row.name}</div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {t(`role_${row.role}`)}
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid var(--color-border)',
              minWidth: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>{row.email}</div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.role === 'super_admin' ? t('primaryAdmin') : `Team ${row.role}`}
                </div>
              </div>
            </div>

            {/* Role */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid var(--color-border)',
              minWidth: 0,
            }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 28,
                  padding: '0 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  background: rColor.bg,
                  color: rColor.color,
                }}
              >
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  marginRight: 7,
                  background: rColor.color,
                }} />
                {row.role}
              </span>
            </div>

            {/* Workspace */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid var(--color-border)',
              minWidth: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>{row.workspace}</div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.workspace === '—' ? '—' : t('workspaceScope')}
                </div>
              </div>
            </div>

            {/* Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid var(--color-border)',
              minWidth: 0,
            }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 28,
                  padding: '0 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  background: statusBadge.bg,
                  color: statusBadge.color,
                }}
              >
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  marginRight: 7,
                  background: statusBadge.dot,
                }} />
                {statusBadge.label}
              </span>
            </div>

            {/* Last Active */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid var(--color-border)',
              minWidth: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  <FormattedDate date={row.lastActive} variant="date" />
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.lastActive ? 'ICT' : '—'}
                </div>
              </div>
            </div>

            {/* Action */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              minWidth: 0,
            }}>
              <Link
                href={`/${locale}/admin/users/${row.id}`}
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {actionLabel}
              </Link>
            </div>
          </div>
        );
      })}

      {/* Pagination Footer */}
      {pagination && (
        <Paging
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalLabel={t('usersTotal', { count: pagination.total })}
          onChange={pagination.onChange}
        />
      )}
    </div>
  );
}
