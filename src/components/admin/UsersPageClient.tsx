'use client';

import { Flex, Spin } from 'antd';
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
  total: number;
  page: number;
  pageSize: number;
}

interface UsersPageClientProps {
  initialStats: UserStats;
  initialRoleStats: Record<string, number>;
  locale: string;
}

const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: '#ccfbf1', color: '#0f766e', dot: '#10b981' },
  invited: { bg: '#ffedd5', color: '#ea580c', dot: '#f97316' },
  inactive: { bg: '#fee2e2', color: '#ef4444', dot: '#ef4444' },
};

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
  super_admin: { bg: '#ffe4e6', color: '#ef4444' },
  audit_admin: { bg: '#ede9fe', color: '#7c3aed' },
};

export default function UsersPageClient({
  initialStats,
  initialRoleStats,
  locale,
}: UsersPageClientProps) {
  const t = useTranslations('AdminUsers');
  const pathname = usePathname();
  const { page, pageSize, search, filters, setPage, setPageSize, setFilter } = usePaginationParams(10);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['users', { page, pageSize, search: debouncedSearch, filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filters.role) params.set('filter_role', filters.role);
      if (filters.workspace) params.set('filter_workspace', filters.workspace);

      const res = await fetch(`/${locale}/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <Flex justify="center" className="p-12">
        <Spin />
      </Flex>
    );
  }

  const statCards = [
    {
      title: t('statTotalUsers') || 'Total Users',
      value: initialStats.total,
      description: `${initialStats.active} active`,
      variant: 'blue' as const,
    },
    {
      title: t('statActiveUsers') || 'Active Users',
      value: initialStats.active,
      description: t('statActiveUsersDesc') || 'Email verified',
      variant: 'green' as const,
    },
    {
      title: t('statWorkspaces') || 'Workspaces',
      value: initialStats.workspaces,
      description: t('statWorkspacesDesc') || 'Active workspaces',
      variant: 'purple' as const,
    },
    {
      title: t('statPending') || 'Pending',
      value: initialStats.pending,
      description: t('statPendingDesc') || 'Unverified users',
      variant: 'orange' as const,
    },
  ];

  const translations = {
    role_customer: t('role_customer') || 'Customer',
    role_specialist: t('role_specialist') || 'Specialist',
    role_reviewer: t('role_reviewer') || 'Reviewer',
    role_coordinator_admin: t('role_coordinator_admin') || 'Coordinator',
    role_super_admin: t('role_super_admin') || 'Super Admin',
    role_audit_admin: t('role_audit_admin') || 'Audit Admin',
    pendingLabel: t('pendingLabel') || 'Pending',
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-start mb-[22px]">
        <div>
          <h1 className="text-[31px] font-extrabold tracking-tight text-[#020617] mb-3">
            {t('pageTitle') || 'User Management'}
          </h1>
          <p className="text-[15px] font-medium text-[#5f6e83] m-0">
            {t('pageDescription') || 'Manage platform users and roles.'}
          </p>
        </div>
        <button className="h-[45px] px-[18px] border-none rounded-lg bg-gradient-to-b from-[#0b8f86] to-[#087970] text-white flex items-center gap-[10px] font-bold shadow-md cursor-pointer text-[14px]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <path d="M20 8v6"/>
            <path d="M23 11h-6"/>
          </svg>
          {t('createUserButton') || 'Create User'}
          <span className="h-[45px] w-[1px] bg-white/20 ml-1" />
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

      <UserToolbar
        searchValue={search}
        selectedRole={filters.role}
        selectedWorkspace={filters.workspace}
        onSearch={setFilter}
        onRoleFilter={(role) => setFilter('role', role)}
        onWorkspaceFilter={(workspace) => setFilter('workspace', workspace)}
        onRefresh={() => refetch()}
        onExport={() => {
          // Export functionality - future enhancement
          console.log('Export clicked');
        }}
        translations={{
          searchPlaceholder: t('searchPlaceholder') || 'Search users...',
          filterRole: t('filterRole') || 'Role',
          filterWorkspace: t('filterWorkspace') || 'Workspace',
          refresh: t('refresh') || 'Refresh',
          export: t('export') || 'Export',
          columns: t('columns') || 'Columns',
        }}
      />

      <UserTable
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
