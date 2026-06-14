import { UserLayout } from '@/components/layout/UserLayout';
import { requireAppSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const session = await requireAppSession();
  const { userId } = session;

  // Get user info for layout
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      role: true,
      workspaces: {
        where: { isActive: true },
        include: { workspace: { select: { name: true, slug: true } } },
        take: 1,
      },
    },
  });

  const activeWorkspace = user?.workspaces[0]?.workspace;
  const userName = user?.name || '';
  const userRole = user?.role || '';

  return (
    <UserLayout
      userName={userName}
      userRole={userRole}
      workspaceName={activeWorkspace?.name || ''}
      workspaceSlug={activeWorkspace?.slug || ''}
    >
      <DashboardClient />
    </UserLayout>
  );
}
