import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { submitIntake } from '@/lib/intake/intake-service';
import { requireAppSession } from '@/lib/security/session';

/**
 * Zod schema for submit request validation
 */
const submitSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  priority: z.enum(['normal', 'urgent']).optional().default('normal'),
  contactInfo: z.object({
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    taxCode: z.string().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();

    // Validate request body
    const validationResult = submitSchema.safeParse(body);

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

    const { requestId, priority, contactInfo } = validationResult.data;

    // Check request ownership and status
    const existingRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdById: true,
        status: true,
        slaDeadline: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    // Ownership validation (prevent IDOR)
    if (existingRequest.createdById !== session.userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', detail: 'You do not have permission to submit this request' },
        { status: 403 }
      );
    }

    // Calculate SLA deadline based on priority
    const now = new Date();
    let slaDeadline: Date;

    if (priority === 'urgent') {
      // Urgent: 24 hours
      slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // Normal: 72 hours
      slaDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    }

    // Update request with priority, contactInfo, and SLA
    await prisma.legalRequest.update({
      where: { id: requestId },
      data: {
        priority,
        contactInfo: contactInfo || null,
        slaDeadline,
        submittedAt: now,
      },
    });

    // Submit intake using existing service
    const result = await submitIntake({
      session,
      requestId,
      correlationId: `v2-submit-${Date.now()}`,
    });

    // Log audit event for priority escalation
    if (priority === 'urgent') {
      await prisma.auditEvent.create({
        data: {
          action: 'request.priority.escalated',
          actorId: session.userId,
          targetType: 'request',
          targetId: requestId,
          metadata: {
            priority,
            slaDeadline: slaDeadline.toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      ...result,
      priority,
      slaDeadline: slaDeadline.toISOString(),
      submittedAt: now.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Submit intake failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Please login to continue' },
        { status: 401 }
      );
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied' },
        { status: 403 }
      );
    }
    if (message === 'INTAKE_NOT_DRAFT') {
      return NextResponse.json(
        { error: 'NOT_DRAFT', message: 'Request is not in draft status' },
        { status: 400 }
      );
    }
    if (message.startsWith('INTAKE_REQUIRED_ANSWERS_MISSING:')) {
      const missingFields = message.split(':')[1] || '';
      return NextResponse.json(
        { error: 'MISSING_ANSWERS', message: 'Required answers are missing', missingFields: missingFields.split(',') },
        { status: 400 }
      );
    }
    if (message === 'INTAKE_SUBMISSION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Intake submission not found' },
        { status: 404 }
      );
    }
    if (message === 'COORDINATOR_REQUIRED_FOR_TRIAGE') {
      return NextResponse.json(
        { error: 'COORDINATOR_REQUIRED', message: 'A coordinator is required to process this request' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'SUBMIT_FAILED', message: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
