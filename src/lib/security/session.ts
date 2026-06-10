import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/types";

export type { AppRole };

export type AppSession = {
  userId: string;
  activeWorkspaceId?: string | null;
  roles: AppRole[];
};

export async function requireAppSession(): Promise<AppSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('UNAUTHENTICATED');

  const userId = session.user.id;
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      memberships: {
        where: { isActive: true, workspace: { isActive: true } },
        select: { workspaceId: true, role: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) throw new Error('UNAUTHENTICATED');

  return {
    userId: user.id,
    activeWorkspaceId: membership.workspaceId,
    roles: [membership.role as import('@/lib/types').AppRole],
  };
}
