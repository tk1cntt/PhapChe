import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { matterTypeKey, title } = body;

    const workspaceId = session.activeWorkspaceId!;
    const resolvedMatterType = matterTypeKey || 'general';

    // Create draft legal request WITH intake submission in a transaction
    const draft = await prisma.legalRequest.create({
      data: {
        workspaceId,
        createdById: session.userId,
        status: 'draft_intake',
        matterType: resolvedMatterType,
        title: title || 'Yêu cầu mới',
        priority: 'normal',
        description: '',
        // Create the intake submission alongside the request
        intakeSubmission: {
          create: {
            workspaceId,
            matterTypeKey: resolvedMatterType,
            schemaVersion: '1.0',
            answers: {},
            answerLabels: [],
          },
        },
      },
      select: {
        id: true,
        status: true,
        matterType: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      id: draft.id,
      status: draft.status,
      matterType: draft.matterType,
      title: draft.title,
      createdAt: draft.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Create draft failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Please login to continue' },
        { status: 401 }
      );
    }

    // Return actual error for debugging
    return NextResponse.json(
      { error: 'DRAFT_CREATION_FAILED', message, stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
