/**
 * Tenant Middleware (v2.3)
 * Extracts and validates tenant context for API requests.
 *
 * MVP: Single shared_platform tenant. Tenant headers are optional.
 * Multi-tenant isolation (dedicated_partner, dedicated_customer) is reserved for future.
 * See: docs/shared_customer_partner_collaboration.md §5.1
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TenantContext } from '@/lib/types/request-context';

export interface TenantMiddlewareOptions {
  required?: boolean; // false in MVP (single tenant), true for future dedicated tenants
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
