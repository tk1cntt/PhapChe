import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UsersPageClient from '@/components/admin/UsersPageClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const ADMIN_ROLES = ['super_admin', 'audit_admin', 'coordinator_admin'] as const;
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

  // Verify admin role
  if (!session.roles.some((role) => (ADMIN_ROLES as readonly string[]).includes(role))) {
function AlertMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">{title}</h2>
        <p className="text-slate-500">{message}</p>
      </div>
    </div>
  );
}
  );
}
  try {
    // Parallel Prisma queries
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      activeWorkspaces,
      roleCounts,
      workspaces,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),

      // Active users (verified and active)
      prisma.user.count({ where: { isActive: true } }),

      // Pending users (unverified within last 7 days)
      prisma.user.count({
        where: {
          emailVerified: false,
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ... later ...
          createdAt: { gte: new Date(Date.now() - ONE_WEEK_MS) },

// ... later ...
          createdAt: { gte: new Date(Date.now() - ONE_WEEK_MS) },
      // Active workspaces count
      prisma.workspace.count({ where: { isActive: true } }),

      // Role counts: distinct users per role from active memberships
      prisma.$queryRaw<{ role: string; count: bigint }[]>`
        SELECT role, COUNT(DISTINCT userId) as count
        FROM WorkspaceMembership
        WHERE isActive = true
        GROUP BY role
      `,

      // Workspace options for filter dropdown
      prisma.workspace.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
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
      roleStats[rc.role] = Number(rc.count);
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
      <UsersPageClient
        initialStats={stats}
        initialRoleStats={sortedRoleStats}
        locale={locale}
        workspaceOptions={workspaces}
      />
    );
  } catch (error) {
    console.error('Failed to fetch admin user stats:', error);
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Không thể tải dữ liệu thống kê.</h2>
          <p className="text-slate-500">Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }
}
