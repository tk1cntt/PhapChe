'use client';

import Link from 'next/link';
import type { RequestStatus } from '@/lib/types';
import { useTranslations } from 'next-intl';

const statusColors: Record<RequestStatus, { bg: string; color: string; dot: string }> = {
  draft_intake: { bg: '#f3f4f6', color: '#4b5563', dot: '#6b7280' },
  intake_submitted: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb' },
  triage: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
  assigned: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb' },
  in_progress: { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb' },
  pending_review: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
  revision_required: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
  approved: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  delivered: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  closed: { bg: '#f3f4f6', color: '#4b5563', dot: '#6b7280' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

export type UserRow = {
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  status: string;
  lastActive?: string;
};

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

interface AdminUsersTableProps {
  dataSource: UserRow[];
  roleColors?: Record<string, { bg: string; color: string }>;
  avatarColors?: Record<string, { bg: string; color: string }>;
  pagination?: false | PaginationConfig;
}

export default function AdminUsersTable({ dataSource, roleColors, avatarColors, pagination }: AdminUsersTableProps) {
  const t = useTranslations('AdminUsers');

  if (dataSource.length === 0 && !pagination) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>{t('noData')}</div>;
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr',
        background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
        borderBottom: '1px solid #dfe7f1',
      }}>
        <div style={{ minHeight: 54, padding: '0 16px', display: 'flex', alignItems: 'center' }}>
          <span style={{ width: 18, height: 18, border: '2px solid #cbd5e1', borderRadius: 4, background: '#fff' }} />
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('name')}
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('email')}
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('role')}
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('workspace')}
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('status')}
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
          borderRight: '1px solid #dfe7f1',
        }}>
          {t('lastActive')}
        </div>
        <div style={{
          minHeight: 54,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          color: '#59687e',
          fontSize: 14,
          fontWeight: 700,
        }}>
          {t('action')}
        </div>
      </div>

      {/* Table Rows */}
      {dataSource.map((row) => {
        const rColor = roleColors?.[row.role] || { bg: '#dbeafe', color: '#2563eb' };
        const aColor = avatarColors?.[row.role] || { bg: '#eef2f7', color: '#334155' };
        const statusBadge = row.status === 'active'
          ? { label: t('active'), color: '#ccfbf1', text: '#0f766e', dot: '#10b981' }
          : row.status === 'invited' || row.status === 'pending'
            ? { label: t('invited'), color: '#ffedd5', text: '#ea580c', dot: '#f97316' }
            : { label: t('inactive'), color: '#fee2e2', text: '#ef4444', dot: '#ef4444' };
        const actionLabel = row.status === 'active' ? t('editAction') : row.status === 'invited' ? t('resendAction') : t('activateAction');

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
            onMouseEnter={(e) => e.currentTarget.style.background = '#fbfdff'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
          >
            {/* Checkbox */}
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 18, height: 18, border: '2px solid #cbd5e1', borderRadius: 4, background: '#fff' }} />
            </div>

            {/* Name */}
            <div style={{ padding: '0 16px', borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
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
                }}>
                  {getInitials(row.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>{row.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{t(`role_${row.role}`)}</div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{ padding: '0 16px', borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>{row.email}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{row.role === 'super_admin' ? t('primaryAdmin') : `${t('team')} ${row.role}`}</div>
              </div>
            </div>

            {/* Role */}
            <div style={{ padding: '0 16px', borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
              <span style={{
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
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  marginRight: 7,
                  background: rColor.color,
                  display: 'inline-block',
                }} />
                {row.role}
              </span>
            </div>

            {/* Workspace */}
            <div style={{ padding: '0 16px', borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>{row.workspace}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{row.workspace.includes('All') ? 'global-scope' : row.workspace}</div>
              </div>
            </div>

            {/* Status */}
            <div style={{ padding: '0 16px', borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 28,
                padding: '0 11px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: statusBadge.color,
                color: statusBadge.text,
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  marginRight: 7,
                  background: statusBadge.dot,
                  display: 'inline-block',
                }} />
                {statusBadge.label}
              </span>
            </div>

            {/* Last Active */}
            <div style={{ padding: '0 16px', borderRight: '1px solid #dfe7f1', minWidth: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
                  {row.lastActive || '—'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {row.lastActive ? 'ICT' : '—'}
                </div>
              </div>
            </div>

            {/* Action */}
            <div style={{ padding: '0 16px', minWidth: 0 }}>
              <Link
                href="#"
                style={{ color: '#087f78', fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}
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
          padding: 14,
          background: '#f8fafc',
          border: 'none',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.onChange(pagination.current, parseInt(e.target.value))}
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
            {t('totalUsersCount', { total: pagination.total })}
          </span>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
