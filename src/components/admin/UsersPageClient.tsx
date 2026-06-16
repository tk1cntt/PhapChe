'use client';

import { Flex, Spin, Alert } from 'antd';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { usePaginationParams } from '@/lib/hooks/usePaginationParams';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { AdminStatGrid } from './AdminStatGrid';
import RolePills from './RolePills';
import UserTable from './UserTable';
import UserToolbar from './UserToolbar';

interface UserStats {
  total: number;
  active: number;
  pending: number;
  workspaces: number;
}

interface UserRow {
  id: string;
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  workspaceId: string | null;
  status: 'active' | 'invited' | 'inactive';
  lastActive: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: UserRow[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

interface UsersPageClientProps {
  initialStats: UserStats;
  initialRoleStats: Record<string, number>;
  locale: string;
  workspaceOptions?: { id: string; name: string }[];
}

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

export default function UsersPageClient({
  initialStats,
  initialRoleStats,
  locale,
  workspaceOptions = [],
}: UsersPageClientProps) {
  const t = useTranslations('AdminUsers');
  const pathname = usePathname();
  const { page, pageSize, search, filters, setPage, setPageSize, setFilter } = usePaginationParams(10);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['users', { page, pageSize, search: debouncedSearch, filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('skip', String((page - 1) * pageSize));
      params.set('take', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.role) params.set('role', filters.role);
      if (filters.workspace) params.set('workspaceId', filters.workspace);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const users = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }


  if (isError) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Alert message={t('errorLoadingUsers')} type="error" showIcon />
      </Flex>
    );
  }
  const statCards = [
    {
      title: t('statTotalUsers'),
      value: initialStats.total,
      description: `${initialStats.active} active`,
      variant: 'blue' as const,
    },
    {
      title: t('statActiveUsers'),
      value: initialStats.active,
      description: t('statActiveUsersDesc'),
      variant: 'green' as const,
    },
    {
      title: t('statWorkspaces'),
      value: initialStats.workspaces,
      description: t('statWorkspacesDesc'),
      variant: 'purple' as const,
    },
    {
      title: t('statPending'),
      value: initialStats.pending,
      description: t('statPendingDesc'),
      variant: 'orange' as const,
    },
  ];

  const translations = {
    role_customer: t('role_customer'),
    role_specialist: t('role_specialist'),
    role_reviewer: t('role_reviewer'),
    role_coordinator_admin: t('role_coordinator_admin'),
    role_super_admin: t('role_super_admin'),
    role_audit_admin: t('role_audit_admin'),
    pendingLabel: t('pendingLabel'),
    systemRolesLabel: t('systemRolesLabel'),
  };

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

      <RolePills
        roleStats={initialRoleStats}
        pendingCount={initialStats.pending}
        translations={translations}
      />

      {/* Toolbar */}
      <UserToolbar
        searchValue={search}
        selectedRole={filters.role}
        selectedWorkspace={filters.workspace}
        onSearch={setFilter}
        onRoleFilter={(role) => setFilter('role', role)}
        onWorkspaceFilter={(workspace) => setFilter('workspace', workspace)}
        onRefresh={() => refetch()}
        onExport={() => {
          console.log('Export clicked');
        }}
        translations={{
          searchPlaceholder: t('searchPlaceholder'),
          filterRole: t('filterRole'),
          filterWorkspace: t('filterWorkspace'),
          refresh: t('refresh'),
          export: t('export'),
          columns: t('columns'),
          allRoles: t('allRoles'),
          allWorkspaces: t('allWorkspaces'),
        }}
        workspaceOptions={workspaceOptions}
      />

      <UserTable
        dataSource={users}
        roleColors={roleColors}
        avatarColors={avatarColors}
        locale={locale}
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
