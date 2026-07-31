/**
 * Organization Context Middleware (v2.3)
 * Extracts organization context from workspace.
 *
 * Workspace.organizationId is now NOT NULL — every workspace belongs to an org.
 * See: prisma/schema.prisma line 247
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface OrganizationContextMiddlewareOptions {
  required?: boolean;
}

export function organizationContextMiddleware(options: OrganizationContextMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    const workspaceSlug = req.nextUrl.searchParams.get('workspace') ||
                          req.headers.get('x-workspace-slug');

    if (!workspaceSlug) {
      if (options.required) {
        return NextResponse.json(
          { error: 'Workspace context required' },
          { status: 400 }
        );
      }
      return NextResponse.next();
    }

    let workspace;
    try {
      workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
        select: {
          id: true,
          organizationId: true,
        },
      });
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // organizationId is always present (NOT NULL since v2.3)
    if (!workspace.organizationId) {
      console.error('Workspace missing organizationId:', workspace.id);
      return NextResponse.json(
        { error: 'Workspace configuration error' },
        { status: 500 }
      );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-organization-id', workspace.organizationId);
    requestHeaders.set('x-workspace-id', workspace.id);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  };
}
