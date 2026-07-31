import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { isEnabled } from '@/lib/config/feature-flags';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { matterTypeKey, title, answers } = body;

    const workspaceId = session.activeWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WORKSPACE_REQUIRED', detail: 'No active workspace' },
        { status: 400 }
      );
    }

    // Validate title
    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 500) {
      return NextResponse.json(
        { error: 'INVALID_TITLE', detail: 'Title must be a non-empty string up to 500 characters' },
        { status: 400 }
      );
    }

    // Validate answers
    if (answers !== undefined && (typeof answers !== 'object' || answers === null || Array.isArray(answers))) {
      return NextResponse.json(
        { error: 'INVALID_ANSWERS', detail: 'Answers must be a JSON object' },
        { status: 400 }
      );
    }

    const resolvedMatterType = matterTypeKey || 'general';
    const resolvedAnswers = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};

    // Build create data based on feature flag
    const createData: Parameters<typeof prisma.legalRequest.create>[0]['data'] = {
      workspaceId,
      createdById: session.userId,
      status: 'draft_intake',
      title: title || 'Yêu cầu mới',
      priority: 'normal',
      description: '',
      intakeSubmission: {
        create: {
          workspaceId,
          matterTypeKey: resolvedMatterType,
          schemaVersion: '1.0',
          answers: resolvedAnswers,
          answerLabels: [],
        },
      },
    };

    // Set matterType based on feature flag
    if (isEnabled('DB_MIGRATION_PHASE4')) {
      // New: Find MatterType by key and use FK
      const matterType = await prisma.matterType.findFirst({
        where: {
          key: resolvedMatterType,
          OR: [
            { workspaceId },
            { workspaceId: null }, // Global matter types
          ],
        },
        orderBy: { workspaceId: 'desc' }, // Prefer workspace-specific over global
      });

      if (matterType) {
        createData.matterTypeId = matterType.id;
      }
      // matterType text field will be null
    } else {
      // Old: Use matterType text field
      createData.matterType = resolvedMatterType;
    }

    // Create draft legal request WITH intake submission in a transaction
    const draft = await prisma.legalRequest.create({
      data: createData,
      select: {
        id: true,
        status: true,
        matterType: true,
        matterTypeId: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      id: draft.id,
      status: draft.status,
      matterType: draft.matterType,
      matterTypeId: draft.matterTypeId,
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
      { error: 'DRAFT_CREATION_FAILED', detail: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
