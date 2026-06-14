import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const userId = session.userId;
    const workspaceId = session.activeWorkspaceId;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Record<string, unknown> = {
      actorId: userId,
    };
    if (workspaceId && workspaceId !== '') {
      where.workspaceId = workspaceId;
    }

    // Fetch total count
    const total = await prisma.auditEvent.count({ where });

    // Fetch audit events with pagination
    const auditEvents = await prisma.auditEvent.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        request: {
          select: {
            id: true,
            code: true,
            title: true,
          }
        }
      }
    });

    // Transform to API format
    const data = auditEvents.map(event => ({
      id: event.id,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      requestId: event.requestId,
      correlationId: event.correlationId,
      metadataSummary: event.metadataSummary,
      workspaceName: event.workspace?.name,
      requestTitle: event.request?.title,
      createdAt: event.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Get audit events failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch audit events' },
      { status: 500 }
    );
  }
}
