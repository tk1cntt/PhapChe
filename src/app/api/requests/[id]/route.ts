import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();
    const { id } = await params;

    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        id,
        workspaceId: session.activeWorkspaceId ?? undefined,
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true, email: true } },
        assignedReviewer: { select: { id: true, name: true, email: true } },
        intakeSubmission: {
          select: {
            matterTypeKey: true,
            schemaVersion: true,
            answers: true,
            answerLabels: true,
            submittedAt: true,
            matterType: { select: { key: true } },
          },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: legalRequest });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Request detail error:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Please login to continue' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}
