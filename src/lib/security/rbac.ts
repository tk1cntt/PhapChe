import { prisma } from '@/lib/prisma';
import type { AppSession } from './session';

export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean> {
  if (!session) return false;

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      workspaceId: true,
      createdById: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
      workspace: {
        select: {
          memberships: {
            where: { userId: session.userId, isActive: true },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!request) return false;
  if (session.roles.includes('super_admin')) return true;

  const roles = request.workspace.memberships.map((membership) => membership.role);

  if (roles.includes('coordinator_admin')) return true;
  if (roles.includes('customer') && request.createdById === session.userId) return true;
  if (roles.includes('specialist') && request.assignedSpecialistId === session.userId) return true;
  if (roles.includes('reviewer') && request.assignedReviewerId === session.userId) return true;

  return false;
}
