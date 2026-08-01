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

// Module-level cache for dynamic imports (if Edge runtime requires them)
let _auth: any;
let _prisma: any;

const VALID_APP_ROLES: Set<string> = new Set(['super_admin', 'coordinator_admin', 'audit_admin', 'reviewer', 'specialist', 'customer']);

/**
 * Lấy thông tin user + roles từ request.
 * Trả về null nếu không có session hoặc user không active.
 */
export async function resolveGuardUser(request: NextRequest): Promise<GuardUser | null> {
  try {
    if (!_auth) {
      const mod = await import('@/auth');
      _auth = mod.auth;
    }
    if (!_prisma) {
      const mod = await import('@/lib/prisma');
      _prisma = mod.prisma;
    }

    const session = await _auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return null;

    const user = await _prisma.user.findFirst({
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

    if (!user) return null;

    const roles: AppRole[] = Array.from(new Set(
      user.memberships
        .map((m: { role: string }) => m.role)
        .filter((role: string): role is AppRole => VALID_APP_ROLES.has(role))
    ));

    return { userId: user.id, roles, name: user.name };
  } catch (error) {
    // Session resolve failed — không block, để page/API tự xử lý
    console.error('[resolveGuardUser] Failed to resolve user:', error);
    return null;
  }
}
