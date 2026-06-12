import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { matterTypeKey } = body;

    // Create a draft legal request
    const draft = await prisma.legalRequest.create({
      data: {
        workspaceId: session.activeWorkspaceId!,
        createdById: session.userId,
        status: 'draft',
        matterTypeKey: matterTypeKey || 'general',
        // Default values for draft
        priority: 'normal',
        description: '',
      },
      select: {
        id: true,
        status: true,
        matterTypeKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      id: draft.id,
      status: draft.status,
      matterTypeKey: draft.matterTypeKey,
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

    return NextResponse.json(
      { error: 'DRAFT_CREATION_FAILED', message: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
