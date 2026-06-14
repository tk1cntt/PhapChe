import { UserLayout } from '@/components/layout/UserLayout';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;

  // Get user info and active workspace for layout
  const [user, activeWorkspace] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    activeWorkspaceId
      ? prisma.workspace.findUnique({
          where: { id: activeWorkspaceId },
          select: { name: true, slug: true },
        })
      : null,
  ]);

  const userName = user?.name || '';

  return (
    <UserLayout
      userName={userName}
      userRole=""
      workspaceName={activeWorkspace?.name || ''}
      workspaceSlug={activeWorkspace?.slug || ''}
    >
      <DashboardClient />
    </UserLayout>
  );
}
