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

/**
 * Role priority (higher = more privileged).
 * When a user has multiple workspace memberships, we pick the most privileged one.
 */
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
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
      },
    },
  });

  if (!user || user.memberships.length === 0) throw new Error('UNAUTHENTICATED');

  // Collect all unique roles from all memberships
  const allRoles = Array.from(new Set(user.memberships.map((m) => m.role as AppRole)));

  // Pick the membership with the highest privilege role for activeWorkspaceId
  const bestMembership = user.memberships.reduce((best, m) => {
    const bestPriority = ROLE_PRIORITY[best.role] ?? 0;
    const mPriority = ROLE_PRIORITY[m.role] ?? 0;
    return mPriority > bestPriority ? m : best;
  }, user.memberships[0]);

  return {
    userId: user.id,
    activeWorkspaceId: bestMembership.workspaceId,
    roles: allRoles,
  };
}
