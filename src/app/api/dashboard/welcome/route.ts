import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: activeWorkspaceId },
      select: { id: true, name: true, slug: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Calculate stats for welcome banner
    const inProgressRequests = await prisma.legalRequest.count({
      where: {
        workspaceId: activeWorkspaceId,
        status: { in: ['in_progress', 'pending_review', 'assigned', 'submitted_for_review'] },
      },
    });

    // New messages in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newReplies = await prisma.message.count({
      where: {
        workspaceId: activeWorkspaceId,
        createdAt: { gte: oneDayAgo },
      },
    });

    return NextResponse.json({
      workspace: {
        id: workspace?.id,
        name: workspace?.name || 'Workspace',
        slug: workspace?.slug || '',
      },
      activeRequests: inProgressRequests,
      pendingDocs: 0,
      newReplies,
      userName: user?.name || 'User',
    });
  } catch (error) {
    console.error('Dashboard welcome API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
