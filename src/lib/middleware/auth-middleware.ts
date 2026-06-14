/**
 * Auth Middleware
 * Validates user session and attaches user context to request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

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

    // Check roles if specified
    if (options.roles && options.roles.length > 0) {
      // For now, just check if user exists
      // Role checking would need workspace membership lookup
    }

    // Attach user to request
    req.headers.set('x-user-id', session.user.id);

    return NextResponse.next();
  };
}
