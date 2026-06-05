import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await requireAppSession();
    const events = await prisma.auditEvent.findMany({
      where: session.activeWorkspaceId
        ? { workspaceId: session.activeWorkspaceId }
        : undefined,
      select: {
        id: true,
        actorId: true,
        workspaceId: true,
        action: true,
        targetType: true,
        targetId: true,
        correlationId: true,
        metadataSummary: true,
        createdAt: true,
        actor: { select: { email: true, name: true } },
        workspace: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
