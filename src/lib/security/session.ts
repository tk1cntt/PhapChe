import { prisma } from '@/lib/prisma';

export type AppRole = 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin' | 'super_admin';

export type AppSession = {
  userId: string;
  activeWorkspaceId?: string | null;
  roles: AppRole[];
};

export async function requireAppSession(): Promise<AppSession> {
  const user = await prisma.user.findFirst({
    where: { id: 'demo-customer', isActive: true },
    select: {
      id: true,
      memberships: {
        where: { isActive: true, workspace: { isActive: true } },
        select: { workspaceId: true, role: true },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) throw new Error('UNAUTHENTICATED');

  return {
    userId: user.id,
    activeWorkspaceId: membership.workspaceId,
    roles: [membership.role],
  };
}
