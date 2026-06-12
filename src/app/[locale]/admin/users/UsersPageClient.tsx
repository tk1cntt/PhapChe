'use client';

import { Flex, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { usePaginationParams } from '@/lib/hooks/usePaginationParams';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { AdminStatGrid } from '../components/AdminStatGrid';
import AdminUsersTable from './AdminUsersTable';
import type { UserRow } from './AdminUsersTable';

const roleColors: Record<string, { bg: string; color: string }> = {
  customer: { bg: '#dbeafe', color: '#2563eb' },
  specialist: { bg: '#dbeafe', color: '#2563eb' },
  reviewer: { bg: '#ffedd5', color: '#ea580c' },
  coordinator_admin: { bg: '#ccfbf1', color: '#0f766e' },
  super_admin: { bg: '#ffe4e6', color: '#ef4444' },
  audit_admin: { bg: '#ede9fe', color: '#7c3aed' },
};

const avatarColors: Record<string, { bg: string; color: string }> = {
  customer: { bg: '#dbeafe', color: '#2563eb' },
  specialist: { bg: '#dbeafe', color: '#2563eb' },
  reviewer: { bg: '#ffedd5', color: '#ea580c' },
  coordinator_admin: { bg: '#ccfbf1', color: '#0f766e' },
  super_admin: { bg: '#ede9fe', color: '#7c3aed' },
  audit_admin: { bg: '#ccfbf1', color: '#0f766e' },
};

const roles = ['customer', 'specialist', 'reviewer', 'coordinator_admin', 'super_admin'];

interface PaginatedResponse {
  data: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function UsersPageClient() {
  const t = useTranslations('AdminUsers');
  const pathname = usePathname();
  const { page, pageSize, search, filters, setPage, setPageSize, setFilter, setSearch } = usePaginationParams(10);
  const debouncedSearch = useDebounce(search, 300);
  const locale = pathname.split('/')[1] || 'vi';

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['users', { page, pageSize, search: debouncedSearch, filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.role) params.set('role', filters.role);
      const res = await fetch(`/${locale}/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  const activeCount = users.filter(u => u.status === 'active').length;
  const workspaceCount = new Set(users.map(u => u.workspace)).size;
  const pendingCount = users.filter(u => u.status !== 'active').length;

  const statCards = [
    { title: t('statTotalUsers'), value: total, description: t('statTotalUsersDesc'), variant: 'blue' as const },
    { title: t('statActiveUsers'), value: activeCount, description: t('statActiveUsersDesc'), variant: 'green' as const },
    { title: t('statWorkspaces'), value: workspaceCount, description: t('statWorkspacesDesc'), variant: 'purple' as const },
    { title: t('statPending'), value: pendingCount, description: t('statPendingDesc'), variant: 'orange' as const },
  ];

  // Count by role
  const roleCounts: Record<string, number> = {};
  roles.forEach(r => { roleCounts[r] = users.filter(u => u.role === r).length; });
  roleCounts['pending'] = pendingCount;

  return (
    <>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
            {t('pageDescription')}
          </p>
        </div>
        <button style={{
          height: 45,
          padding: '0 18px',
          border: 'none',
          borderRadius: 8,
          background: 'linear-gradient(180deg, #0b8f86, #087970)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 700,
          boxShadow: '0 8px 18px rgba(8, 127, 120, 0.25)',
          cursor: 'pointer',
          fontSize: 14,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <path d="M20 8v6"/>
            <path d="M23 11h-6"/>
          </svg>
          {t('createUserButton')}
          <span style={{ height: 45, width: 1, background: 'rgba(255,255,255,0.24)', marginLeft: 4 }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      </div>

      <AdminStatGrid cards={statCards} />

      {/* Roles Card */}
      <div style={{
        background: '#fff',
        border: '1px solid #dfe7f1',
        borderRadius: 15,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
        padding: 24,
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 18,
          color: '#0f172a',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          {t('systemRoles')}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          {roles.map((role) => {
            const c = roleColors[role] || roleColors.customer;
            return (
              <div key={role} style={{
                height: 38,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 15px',
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                background: c.bg,
                color: c.color,
              }}>
                {t(`role_${role}`)} ({role})
                <b style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.65)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}>
                  {roleCounts[role] || 0}
                </b>
              </div>
            );
          })}
          <div style={{
            height: 38,
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 15px',
            fontSize: 13,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            background: '#ede9fe',
            color: '#7c3aed',
          }}>
            {t('pendingLabel')}
            <b style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.65)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
            }}>
              {pendingCount}
            </b>
          </div>
        </div>

        <p style={{ color: '#59687e', fontSize: 14, fontWeight: 500, lineHeight: 1.7, margin: 0 }}>
          {t('roleChangeNote')}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff',
        border: '1px solid #dfe7f1',
        borderRadius: '15px 15px 0 0',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
        padding: 20,
        borderBottom: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 330,
              height: 44,
              border: '1px solid #dfe7f1',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '0 14px',
              background: '#fff',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }}
              />
            </div>
            <button style={toolBtnStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>
              </svg>
              {t('filterBtn')}
            </button>
            <button style={toolBtnStyle}>
              {t('roleDropdown')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <button style={toolBtnStyle}>
              {t('workspaceDropdown')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ ...toolBtnStyle, width: 52, padding: 0, justifyContent: 'center' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 16v5h5"/>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 8V3h-5"/>
              </svg>
            </button>
            <button style={toolBtnStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <path d="M7 10l5 5 5-5"/>
                <path d="M12 15V3"/>
              </svg>
              Export
            </button>
            <button style={toolBtnStyle}>
              {t('columnsBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <AdminUsersTable
        dataSource={users}
        roleColors={roleColors}
        avatarColors={avatarColors}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p, ps) => {
            if (p !== page) setPage(p);
            if (ps !== pageSize) setPageSize(ps);
          },
        }}
      />
    </>
  );
}

const toolBtnStyle: React.CSSProperties = {
  height: 44,
  border: '1px solid #dfe7f1',
  background: '#fff',
  borderRadius: 8,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#1e293b',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};
