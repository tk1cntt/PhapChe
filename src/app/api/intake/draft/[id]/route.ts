import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

/**
 * Zod schema for draft ID validation
 */
const draftIdSchema = z.string().min(1, 'Draft ID is required');

/**
 * GET /api/intake/draft/:id
 * Load draft data with user ownership validation
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;

    // 1. Authentication check
    const session = await requireAppSession();
    const userId = session.userId;

    // 2. Validate draft ID format
    const idValidation = draftIdSchema.safeParse(rawId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Invalid draft ID format' },
        { status: 400 }
      );
    }

    const draftId = idValidation.data;

    // 3. Query draft from database
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: {
        id: true,
        userId: true,
        domainId: true,
        serviceType: true,
        answers: true,
        files: true,
        priority: true,
        contactInfo: true,
        status: true,
        updatedAt: true,
      },
    });

    // 4. Check if draft exists
    if (!draft) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Draft not found' },
        { status: 404 }
      );
    }

    // 5. Ownership validation (prevent IDOR)
    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', detail: 'You do not have permission to access this draft' },
        { status: 403 }
      );
    }

    // 6. Check draft status (only load 'draft' status)
    if (draft.status !== 'draft') {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Draft not found or has been deleted' },
        { status: 404 }
      );
    }

    // 7. Return success response (exclude internal fields: userId, createdAt)
    return NextResponse.json({
      data: {
        draftId: draft.id,
        domainId: draft.domainId,
        serviceType: draft.serviceType,
        answers: draft.answers,
        files: draft.files,
        priority: draft.priority,
        contactInfo: draft.contactInfo,
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', detail: 'Please login to continue' },
        { status: 401 }
      );
    }

    console.error('Draft load failed:', message);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Failed to load draft' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/intake/draft/:id
 * Soft-delete draft (set status = 'deleted')
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;

    // 1. Authentication check
    const session = await requireAppSession();
    const userId = session.userId;

    // 2. Validate draft ID format
    const idValidation = draftIdSchema.safeParse(rawId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Invalid draft ID format' },
        { status: 400 }
      );
    }

    const draftId = idValidation.data;

    // 3. Query draft from database
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true, status: true },
    });

    // 4. Check if draft exists
    if (!draft) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Draft not found' },
        { status: 404 }
      );
    }

    // 5. Ownership validation (prevent IDOR)
    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', detail: 'You do not have permission to delete this draft' },
        { status: 403 }
      );
    }

    // 6. Check draft status (only allow deletion of 'draft' status)
    if (draft.status !== 'draft') {
      return NextResponse.json(
        { error: 'CONFLICT', detail: 'Only drafts in draft status can be deleted' },
        { status: 409 }
      );
    }

    // 7. Soft-delete draft atomically (only if still in 'draft' status)
    const result = await prisma.draft.updateMany({
      where: { id: draftId, status: 'draft' },
      data: { status: 'deleted' },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'CONFLICT', detail: 'Draft status has changed; cannot delete' },
        { status: 409 }
      );
    }

    // 8. Return success response
    return NextResponse.json({
      data: {
        success: true,
        message: 'Draft deleted successfully',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', detail: 'Please login to continue' },
        { status: 401 }
      );
    }

    console.error('Draft delete failed:', message);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
