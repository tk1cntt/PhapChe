import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { AdminLayout } from '@/components/layout/AdminLayout';
import UsersPageClient from '@/components/admin/UsersPageClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ROLE_PRIORITY: Record<string, number> = {
  'super_admin': 1,
  'audit_admin': 2,
  'coordinator_admin': 3,
  'reviewer': 4,
  'specialist': 5,
  'customer': 6,
};

export default async function AdminUsersPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();

  // Parallel Prisma queries
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    activeWorkspaces,
    roleCounts,
  ] = await Promise.all([
    // Total users count
    prisma.user.count(),

    // Active users (verified and active)
    prisma.user.count({ where: { isActive: true } }),

    // Pending users (unverified within last 7 days)
    prisma.user.count({
      where: {
        emailVerified: false,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),

    // Active workspaces count
    prisma.workspace.count({ where: { isActive: true } }),

    // Role counts from memberships
    prisma.workspaceMembership.groupBy({
      by: ['role'],
      _count: { role: true },
    }),
  ]);

  // Transform stats
  const stats = {
    total: totalUsers,
    active: activeUsers,
    pending: pendingUsers,
    workspaces: activeWorkspaces,
  };

  // Transform role counts to Record<string, number>
  const roleStats: Record<string, number> = {};
  roleCounts.forEach((rc) => {
    roleStats[rc.role] = rc._count.role;
  });

  // Sort role stats by priority
  const sortedRoleStats: Record<string, number> = {};
  Object.keys(ROLE_PRIORITY)
    .sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b])
    .forEach((role) => {
      if (roleStats[role] !== undefined) {
        sortedRoleStats[role] = roleStats[role];
      }
    });

  return (
    <AdminLayout>
      <UsersPageClient
        initialStats={stats}
        initialRoleStats={sortedRoleStats}
        locale={locale}
      />
    </AdminLayout>
  );
}
