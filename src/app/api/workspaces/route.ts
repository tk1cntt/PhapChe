import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();

    const workspaces = await prisma.workspace.findMany({
      where: {
        memberships: {
          some: { userId: session.userId },
        },
      },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      workspaces: workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        isActive: ws.isActive,
        memberCount: ws._count.memberships,
        createdAt: ws.createdAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch workspaces:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'An unexpected error occurred' }, { status: 500 });
  }
}
