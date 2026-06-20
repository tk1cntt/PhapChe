import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

/**
 * Zod schema for draft save request validation
 */
const draftSaveSchema = z.object({
  draftId: z.string().optional(),
  domainId: z.string().nullable().optional(),
  serviceType: z.string().nullable().optional(),
  answers: z.record(z.string(), z.string()).optional().default({}),
  files: z
    .array(
      z.object({
        vaultFileId: z.string(),
        filename: z.string(),
        size: z.number(),
      })
    )
    .max(20, 'Maximum 20 files allowed')
    .optional()
    .default([]),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  contactInfo: z.object({
    email: z.string().optional().default(''),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    taxCode: z.string().optional(),
  }),
});

/**
 * POST /api/intake/draft/save
 * Save or update a draft with user ownership validation
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const session = await requireAppSession();
    const userId = session.userId;

    // 2. Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', detail: 'User not found' },
        { status: 401 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = draftSaveSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          detail: 'Invalid request data',
          errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 4. Draft save/update logic
    let draftId: string;
    let updatedAt: Date;

    if (data.draftId) {
      // Update existing draft
      const existingDraft = await prisma.draft.findUnique({
        where: { id: data.draftId },
        select: { id: true, userId: true },
      });

      if (!existingDraft) {
        return NextResponse.json(
          { error: 'NOT_FOUND', detail: 'Draft not found' },
          { status: 404 }
        );
      }

      // Ownership validation (prevent IDOR)
      if (existingDraft.userId !== userId) {
        return NextResponse.json(
          { error: 'FORBIDDEN', detail: 'You do not have permission to access this draft' },
          { status: 403 }
        );
      }

      // Update draft
      const updatedDraft = await prisma.draft.update({
        where: { id: data.draftId },
        data: {
          domainId: data.domainId,
          serviceType: data.serviceType,
          answers: data.answers,
          files: data.files,
          priority: data.priority,
          contactInfo: data.contactInfo,
          status: 'draft',
        },
        select: { id: true, updatedAt: true },
      });

      draftId = updatedDraft.id;
      updatedAt = updatedDraft.updatedAt;
    } else {
      // Create new draft
      const newDraft = await prisma.draft.create({
        data: {
          userId,
          domainId: data.domainId,
          serviceType: data.serviceType,
          answers: data.answers,
          files: data.files,
          priority: data.priority,
          contactInfo: data.contactInfo,
          status: 'draft',
        },
        select: { id: true, updatedAt: true },
      });

      draftId = newDraft.id;
      updatedAt = newDraft.updatedAt;
    }

    // 5. Log audit event
    await prisma.auditEvent.create({
      data: {
        action: 'draft.save',
        actorId: userId,
        targetType: 'draft',
        targetId: draftId,
        metadata: {
          domainId: data.domainId,
          serviceType: data.serviceType,
          priority: data.priority,
        },
      },
    });

    // 6. Return success response
    return NextResponse.json({
      data: {
        draftId,
        updatedAt: updatedAt.toISOString(),
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

    console.error('Draft save failed:', message);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Failed to save draft' },
      { status: 500 }
    );
  }
}
