import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();

    const requests = await prisma.legalRequest.findMany({
      where: {
        workspaceId: session.activeWorkspaceId ?? '',
        assignedSpecialistId: session.userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
        intakeSubmission: { select: { matterTypeKey: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = requests.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      customerName: r.createdBy.name,
      customerEmail: r.createdBy.email,
      matterTypeKey: r.intakeSubmission?.matterTypeKey ?? null,
    }));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
