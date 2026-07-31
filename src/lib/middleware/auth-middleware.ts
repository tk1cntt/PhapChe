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
    let session;
    try {
      session = await auth.api.getSession({
        headers: req.headers,
      });
    } catch (err) {
      console.error('Auth middleware session error:', err instanceof Error ? err.message : String(err));
      if (options.required !== false) {
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
          { status: 500 }
        );
      }
      return NextResponse.next();
    }

    if (!session) {
      // If roles are specified, authentication is always required
      if (options.required !== false || (options.roles && options.roles.length > 0)) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', detail: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Enforce role check when roles are specified
    if (options.roles && options.roles.length > 0) {
      if (!session.user?.id) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', detail: 'Invalid session' },
          { status: 401 }
        );
      }
      try {
        // TODO: Consider caching role memberships to reduce DB load per request
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
      } catch (err) {
        console.error('Auth middleware role check error:', err instanceof Error ? err.message : String(err));
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Attach user to request
    req.headers.set('x-user-id', session.user.id);

    return NextResponse.next();
  };
}
