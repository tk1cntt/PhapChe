/**
 * GET /api/files/[id]/access-logs - Get file access logs
 *
 * Returns paginated access logs for a file.
 * Requires authentication and file access permission.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { storageServer } from '@/lib/storage/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/files/[id]/access-logs
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10));

    // Get file to check workspace
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Not found', detail: 'File not found' },
        { status: 404 }
      );
    }

    // Check permission
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: file.workspaceId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Access denied' },
        { status: 403 }
      );
    }

    // Get access logs
    const result = await storageServer.getAccessLogs(id, session.user.id, { page, pageSize });

    return NextResponse.json({
      data: result.data,
      meta: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get access logs error:', error);

    if (error instanceof Error) {
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', detail: 'Failed to get access logs' },
      { status: 500 }
    );
  }
}
