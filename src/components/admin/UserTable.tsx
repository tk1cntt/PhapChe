'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function generatePageNumbers(current: number, total: number, pageSize: number): (number | '...')[] {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (current >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
  }

  return pages;
}

export default function UserTable({
  dataSource,
  roleColors,
  avatarColors,
  pagination,
}: UserTableProps) {
  const t = useTranslations('AdminUsers');

  if (dataSource.length === 0 && !pagination) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        {t('noData')}
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dfe7f1',
      borderRadius: '0 0 15px 15px',
      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
      overflow: 'hidden',
    }}>
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr',
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid #dfe7f1',
        }}
      >
        <div style={{ minHeight: 54, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <span style={{
            width: 18,
            height: 18,
            border: '2px solid #cbd5e1',
            borderRadius: 4,
            background: '#fff',
            display: 'block',
          }} />
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
              color: '#59687e',
              fontSize: 14,
              fontWeight: 700,
              borderRight: idx < 6 ? '1px solid #dfe7f1' : 'none',
            }}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Table Rows */}
      {dataSource.map((row) => {
        const rColor = roleColors?.[row.role] || { bg: '#dbeafe', color: '#2563eb' };
        const aColor = avatarColors?.[row.role] || { bg: '#eef2f7', color: '#334155' };

        let statusBadge: { label: string; color: string; bg: string; dot: string };
        if (row.status === 'active') {
          statusBadge = { label: t('active'), color: '#0f766e', bg: '#ccfbf1', dot: '#10b981' };
        } else if (row.status === 'invited') {
          statusBadge = { label: t('invited'), color: '#ea580c', bg: '#ffedd5', dot: '#f97316' };
        } else {
          statusBadge = { label: t('inactive'), color: '#ef4444', bg: '#ffe4e6', dot: '#ef4444' };
        }

        const actionLabel = row.status === 'active'
          ? `${t('editAction')} →`
          : row.status === 'invited'
            ? `${t('resendAction')} →`
            : `${t('activateAction')} →`;

        return (
          <div
            key={row.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr',
              minHeight: 72,
              borderBottom: '1px solid #dfe7f1',
              background: '#fff',
              transition: '0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fbfdff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            {/* Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <span style={{
                width: 18,
                height: 18,
                border: '2px solid #cbd5e1',
                borderRadius: 4,
                background: '#fff',
                display: 'block',
              }} />
            </div>

            {/* Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
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
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>{row.name}</div>
                  <div style={{
                    fontSize: 12,
                    color: '#64748b',
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
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>{row.email}</div>
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
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
              borderRight: '1px solid #dfe7f1',
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
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>{row.workspace}</div>
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.workspace === '—' ? '—' : 'workspace-scope'}
                </div>
              </div>
            </div>

            {/* Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRight: '1px solid #dfe7f1',
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
              borderRight: '1px solid #dfe7f1',
              minWidth: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 4,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {formatDate(row.lastActive)}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
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
                href="#"
                style={{
                  color: '#087f78',
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
        <div style={{
          padding: '12px 16px',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onChange(1, parseInt(e.target.value))}
              style={{
                height: 32,
                border: '1px solid #dfe7f1',
                borderRadius: 6,
                padding: '0 8px',
                fontSize: 13,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>
              {pagination.total} users total
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Previous Button */}
            <button
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              disabled={pagination.current === 1}
              style={{
                height: 32,
                width: 32,
                border: '1px solid #dfe7f1',
                borderRadius: 6,
                background: pagination.current === 1 ? '#f1f5f9' : '#fff',
                color: pagination.current === 1 ? '#94a3b8' : '#1e293b',
                cursor: pagination.current === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>

            {/* Page Numbers */}
            {generatePageNumbers(pagination.current, pagination.total, pagination.pageSize).map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${idx}`} style={{ width: 32, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={page}
                  onClick={() => pagination.onChange(page as number, pagination.pageSize)}
                  style={{
                    height: 32,
                    minWidth: 32,
                    padding: '0 8px',
                    border: page === pagination.current ? 'none' : '1px solid #dfe7f1',
                    borderRadius: 6,
                    background: page === pagination.current ? 'linear-gradient(180deg, #0b8f86, #087970)' : '#fff',
                    color: page === pagination.current ? '#fff' : '#1e293b',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: page === pagination.current ? 700 : 500,
                  }}
                >
                  {page}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              style={{
                height: 32,
                width: 32,
                border: '1px solid #dfe7f1',
                borderRadius: 6,
                background: pagination.current >= Math.ceil(pagination.total / pagination.pageSize) ? '#f1f5f9' : '#fff',
                color: pagination.current >= Math.ceil(pagination.total / pagination.pageSize) ? '#94a3b8' : '#1e293b',
                cursor: pagination.current >= Math.ceil(pagination.total / pagination.pageSize) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
