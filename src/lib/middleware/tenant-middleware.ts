/**
 * Tenant Middleware
 * Extracts and validates tenant context for API requests
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TenantContext } from '@/lib/types/request-context';

export interface TenantMiddlewareOptions {
  required?: boolean;
}

export function tenantMiddleware(options: TenantMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    // Extract tenant ID from header or subdomain
    const tenantId = req.headers.get('x-tenant-id') ||
                     req.headers.get('x-platform-id');

    if (options.required && !tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      );
    }

    // Attach tenant context to request headers for downstream use
    if (tenantId) {
      req.headers.set('x-tenant-id', tenantId);
    }

    return NextResponse.next();
  };
}
