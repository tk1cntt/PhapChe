/**
 * Organization Context Middleware (v2.3)
 * Extracts organization context from workspace.
 *
 * Workspace.organizationId is now NOT NULL — every workspace belongs to an org.
 * See: prisma/schema.prisma line 247
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

    // organizationId is always present (NOT NULL since v2.3)
    req.headers.set('x-organization-id', workspace.organizationId);

    req.headers.set('x-workspace-id', workspace.id);

    return NextResponse.next();
  };
}
