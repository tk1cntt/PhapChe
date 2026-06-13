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

export default function UserTable({
  dataSource,
  roleColors,
  avatarColors,
  pagination,
}: UserTableProps) {
  const t = useTranslations('AdminUsers');

  if (dataSource.length === 0 && !pagination) {
    return (
      <div className="p-12 text-center text-[#64748b]">
        {t('noData') || 'No data available'}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-b-[15px] shadow-md overflow-hidden">
      {/* Table Header */}
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr',
          background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)',
          borderBottom: '1px solid #dfe7f1',
        }}
      >
        <div className="h-[54px] px-4 flex items-center">
          <span className="w-[18px] h-[18px] border-2 border-gray-300 rounded bg-white" />
        </div>
        {[
          t('name') || 'Name',
          t('email') || 'Email',
          t('role') || 'Role',
          t('workspace') || 'Workspace',
          t('status') || 'Status',
          t('lastActive') || 'Last Active',
          t('action') || 'Action',
        ].map((header, idx) => (
          <div
            key={header}
            className="h-[54px] px-4 flex items-center text-[14px] font-bold text-[#59687e]"
            style={{
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
          statusBadge = { label: t('active') || 'Active', color: '#0f766e', bg: '#ccfbf1', dot: '#10b981' };
        } else if (row.status === 'invited') {
          statusBadge = { label: t('invited') || 'Invited', color: '#ea580c', bg: '#ffedd5', dot: '#f97316' };
        } else {
          statusBadge = { label: t('inactive') || 'Inactive', color: '#ef4444', bg: '#fee2e2', dot: '#ef4444' };
        }

        const actionLabel = row.status === 'active'
          ? t('editAction') || 'Edit'
          : row.status === 'invited'
            ? t('resendAction') || 'Resend'
            : t('activateAction') || 'Activate';

        return (
          <div
            key={row.key}
            className="grid gap-0 min-h-[72px] border-b border-gray-200 bg-white hover:bg-[#fbfdff] transition-colors"
            style={{
              gridTemplateColumns: '52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr',
            }}
          >
            {/* Checkbox */}
            <div className="px-4 flex items-center">
              <span className="w-[18px] h-[18px] border-2 border-gray-300 rounded bg-white" />
            </div>

            {/* Name */}
            <div className="px-4 border-r border-gray-200 flex items-center min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-extrabold text-[13px] flex-shrink-0"
                  style={{ background: aColor.bg, color: aColor.color }}
                >
                  {getInitials(row.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold mb-1 text-[#0f172a] truncate">{row.name}</div>
                  <div className="text-[12px] text-[#64748b]">
                    {t(`role_${row.role}`) || row.role}
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="px-4 border-r border-gray-200 flex items-center min-w-0">
              <div className="min-w-0">
                <div className="text-[14px] font-bold mb-1 text-[#0f172a] truncate">{row.email}</div>
                <div className="text-[12px] text-[#64748b]">
                  {row.role === 'super_admin' ? t('primaryAdmin') || 'Primary Admin' : `Team ${row.role}`}
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="px-4 border-r border-gray-200 flex items-center min-w-0">
              <span
                className="inline-flex items-center h-[28px] rounded-full px-[11px] text-[12px] font-extrabold whitespace-nowrap"
                style={{ background: rColor.bg, color: rColor.color }}
              >
                <span
                  className="w-[7px] h-[7px] rounded-full mr-[7px]"
                  style={{ background: rColor.color }}
                />
                {row.role}
              </span>
            </div>

            {/* Workspace */}
            <div className="px-4 border-r border-gray-200 flex items-center min-w-0">
              <div className="min-w-0">
                <div className="text-[14px] font-bold mb-1 text-[#0f172a] truncate">{row.workspace}</div>
                <div className="text-[12px] text-[#64748b]">
                  {row.workspace === '—' ? '—' : 'workspace-scope'}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="px-4 border-r border-gray-200 flex items-center min-w-0">
              <span
                className="inline-flex items-center h-[28px] rounded-full px-[11px] text-[12px] font-extrabold whitespace-nowrap"
                style={{ background: statusBadge.bg, color: statusBadge.color }}
              >
                <span
                  className="w-[7px] h-[7px] rounded-full mr-[7px]"
                  style={{ background: statusBadge.dot }}
                />
                {statusBadge.label}
              </span>
            </div>

            {/* Last Active */}
            <div className="px-4 border-r border-gray-200 flex items-center min-w-0">
              <div className="min-w-0">
                <div className="text-[14px] font-bold mb-1 text-[#0f172a]">
                  {formatDate(row.lastActive)}
                </div>
                <div className="text-[12px] text-[#64748b]">
                  {row.lastActive ? 'ICT' : '—'}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="px-4 flex items-center min-w-0">
              <Link
                href="#"
                className="text-[#087f78] font-extrabold no-underline whitespace-nowrap"
              >
                {actionLabel}
              </Link>
            </div>
          </div>
        );
      })}

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-4 py-3 bg-[#f8fafc] flex justify-end items-center gap-3">
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.onChange(pagination.current, parseInt(e.target.value))}
            className="h-8 border border-gray-200 rounded-md px-2 text-[13px] bg-white cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-[13px] text-[#64748b] flex items-center">
            {t('totalUsersCount', { total: pagination.total }) || `${pagination.total} users total`}
          </span>
        </div>
      )}
    </div>
  );
}
