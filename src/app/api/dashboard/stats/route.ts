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

    const [totalRequests, inProgressRequests, completedRequests, vaultDocs] = await Promise.all([
      prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId } }),
      prisma.legalRequest.count({
        where: {
          workspaceId: activeWorkspaceId,
          status: { in: ['in_progress', 'pending_review', 'assigned', 'submitted_for_review'] },
        },
      }),
      prisma.legalRequest.count({
        where: {
          workspaceId: activeWorkspaceId,
          status: { in: ['approved', 'delivered', 'closed'] },
        },
      }),
      prisma.vaultFile.count({ where: { workspaceId: activeWorkspaceId } }),
    ]);

    return NextResponse.json({
      totalRequests,
      inProgress: inProgressRequests,
      completed: completedRequests,
      vaultDocs,
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
