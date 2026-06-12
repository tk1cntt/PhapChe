import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { matterTypeKey, title } = body;

    // Create a draft legal request
    const draft = await prisma.legalRequest.create({
      data: {
        workspaceId: session.activeWorkspaceId!,
        createdById: session.userId,
        status: 'draft_intake',
        matterType: matterTypeKey || 'general',
        title: title || 'Yêu cầu mới',
        priority: 'normal',
        description: '',
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
