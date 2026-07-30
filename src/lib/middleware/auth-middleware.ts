/**
 * Auth Middleware
 * Validates user session, enforces role-based access, attaches user context to request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
}

export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      if (options.required !== false) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', detail: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Enforce role check when roles are specified
    if (options.roles && options.roles.length > 0) {
      const memberships = await prisma.workspaceMembership.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { role: true },
      });

      const userRoles = new Set(memberships.map((m) => m.role));
      const hasRequiredRole = options.roles.some((role) => userRoles.has(role));

      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: 'FORBIDDEN', detail: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Attach user to request
    req.headers.set('x-user-id', session.user.id);

    return NextResponse.next();
  };
}
