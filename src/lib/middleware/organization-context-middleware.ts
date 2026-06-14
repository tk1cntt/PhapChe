/**
 * Organization Context Middleware
 * Extracts organization context from workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (workspace.organizationId) {
      req.headers.set('x-organization-id', workspace.organizationId);
    }

    req.headers.set('x-workspace-id', workspace.id);

    return NextResponse.next();
  };
}
