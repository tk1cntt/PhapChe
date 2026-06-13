import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const MAX_EVENTS = 50;

export async function GET() {
  try {
    const session = await requireAppSession();
    const userId = session.userId;
    const workspaceId = session.activeWorkspaceId;

    // Fetch audit events for this user
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        actorId: userId,
        ...(workspaceId && workspaceId !== '' && { workspaceId }),
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: MAX_EVENTS,
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
      count: data.length
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
