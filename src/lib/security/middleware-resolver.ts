/**
 * Middleware User Resolver
 *
 * Resolve user roles from session cookie trong middleware context.
 * Tách riêng để middleware-guard.ts giữ pure logic (dễ test).
 */
import { NextRequest } from 'next/server';
import type { AppRole } from '@/lib/types';

export interface GuardUser {
  userId: string;
  roles: AppRole[];
  name: string | null;
}

/**
 * Lấy thông tin user + roles từ request.
 * Trả về null nếu không có session hoặc user không active.
 */
export async function resolveGuardUser(request: NextRequest): Promise<GuardUser | null> {
  try {
    const { auth } = await import('@/auth');
    const { prisma } = await import('@/lib/prisma');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return null;

    const user = await prisma.user.findFirst({
      where: { id: session.user.id, isActive: true },
      select: {
        id: true,
        name: true,
        memberships: {
          where: { isActive: true, workspace: { isActive: true } },
          select: { role: true },
        },
      },
    });

    if (!user || user.memberships.length === 0) return null;

    const roles = Array.from(new Set(user.memberships.map(m => m.role as AppRole)));

    return { userId: user.id, roles, name: user.name };
  } catch {
    // Session resolve failed — không block, để page/API tự xử lý
    return null;
  }
}
