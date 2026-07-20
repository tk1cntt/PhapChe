import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createStorageService, FileCategory, FileVisibility } from '@/lib/storage';

import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';
import { requireAppSession } from '@/lib/security/session';
import { recordAuditEvent } from '@/lib/audit/audit';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import type { Prisma } from '@prisma/client';

const submitDataSchema = z.object({
  draftId: z.string().optional(),
  domainId: z.string().min(1),
  serviceType: z.string().min(1),
  answers: z.record(z.string(), z.string()).optional().default({}),
  files: z.array(z.object({
    vaultFileId: z.string(),
    filename: z.string(),
    size: z.number(),
  })).optional().default([]),
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
    const workspaceId = session.activeWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WORKSPACE_REQUIRED', message: 'No active workspace' },
        { status: 400 }
      );
    }

    // Parse multipart FormData
    const formData = await request.formData();
    const dataRaw = formData.get('data');
    if (!dataRaw || typeof dataRaw !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Missing data field' },
        { status: 400 }
      );
    }

    let body: z.infer<typeof submitDataSchema>;
    try {
      body = JSON.parse(dataRaw);
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Invalid JSON in data field' },
        { status: 400 }
      );
    }

    const validationResult = submitDataSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Invalid request data', errors },
        { status: 400 }
      );
    }

    const { draftId, domainId, serviceType, answers, priority, contactInfo } = validationResult.data;
    const uploadedFiles = formData.getAll('files');
    const correlationId = `v2-submit-${Date.now()}`;
    const now = new Date();

    // Calculate SLA deadline
    const slaDeadline = priority === 'urgent'
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 72 * 60 * 60 * 1000);

    // Get matter type from seed catalog
    const seedMatter = SEED_MATTER_TYPES[serviceType as keyof typeof SEED_MATTER_TYPES];
    const questions = (seedMatter?.questions ?? []) as unknown as readonly { key: string; label: { vi: string; en: string; zh?: string; ja?: string }; required: boolean; type: string }[];
    const schemaVersion = seedMatter?.schemaVersion ?? '2026-07-16';

    // Title for LegalRequest (VI primary from seed data)
    const title = String(seedMatter?.label?.vi ?? serviceType);

    // Create request + intake submission in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Upsert matter type
      await tx.matterType.upsert({
        where: { workspaceId_key: { workspaceId, key: serviceType } },
        update: {
          schemaVersion,
          questionSchema: questions as unknown as Prisma.InputJsonValue,
          isActive: true,
        },
        create: {
          workspaceId,
          key: serviceType,
          schemaVersion,
          questionSchema: questions as unknown as Prisma.InputJsonValue,
          isActive: true,
        },
      });

      // Build answer labels from questions
      const answerLabels = questions
        .filter((q) => answers[q.key] != null)
        .map((q) => ({ key: q.key, label: q.label, required: q.required }));

      // Create LegalRequest with IntakeSubmission
      const legalRequest = await tx.legalRequest.create({
        data: {
          workspaceId,
          title,
          createdById: session.userId,
          priority,
          contactInfo: contactInfo as Prisma.InputJsonValue,
          slaDeadline,
          submittedAt: now,
          intakeSubmission: {
            create: {
              workspaceId,
              matterTypeKey: serviceType,
              schemaVersion,
              answers: answers as Prisma.InputJsonValue,
              answerLabels: answerLabels as Prisma.InputJsonValue,
              submittedAt: now,
            },
          },
        },
        select: { id: true, status: true },
      });

      // Record audit
      await recordAuditEvent({
        actorId: session.userId,
        workspaceId,
        action: 'intake.submitted',
        targetType: 'REQUEST',
        targetId: legalRequest.id,
        requestId: legalRequest.id,
        correlationId,
        metadataSummary: `domain=${domainId}; service=${serviceType}; priority=${priority}; answers=${Object.keys(answers).length}; files=${uploadedFiles.length}`,
      }, tx);

      return legalRequest;
    });

    // Upload files via StorageService (S3-ready architecture per local_store_to_s3.md)
    if (uploadedFiles.length > 0) {
      const storageService = createStorageService();
      for (const entry of uploadedFiles) {
        if (!(entry instanceof File)) continue;
        try {
          const buffer = Buffer.from(await entry.arrayBuffer());

          // StorageService handles: MIME validation, object key generation,
          // checksum, upload to provider, File record creation, audit logging
          const fileRecord = await storageService.uploadFile({
            organizationId: workspaceId,
            requestId: result.id,
            file: buffer,
            originalName: entry.name,
            mimeType: entry.type || 'application/octet-stream',
            category: FileCategory.REQUEST_UPLOAD,
            visibility: FileVisibility.PRIVATE,
            createdBy: session.userId,
          });

          // Create VaultFile record for dashboard query compatibility
          await prisma.vaultFile.create({
            data: {
              requestId: result.id,
              workspaceId,
              actorId: session.userId,
              fileId: fileRecord.id,
              filename: entry.name,
              storageKey: fileRecord.objectKey,
              fileKind: 'intake_upload',
              source: 'customer_upload',
              size: entry.size,
              contentType: entry.type || 'application/octet-stream',
            },
          });
        } catch (err) {
          console.error('Failed to store intake file:', entry.name, err);
        }
      }
    }

    // Transition to triage (v2.3: customer submit goes straight to triage)
    await transitionRequestStatus({
      requestId: result.id,
      actorId: session.userId,
      toStatus: 'triage',
      reason: 'Intake submitted via wizard',
      correlationId,
    });

    // Delete draft if present
    if (draftId) {
      try {
        await prisma.draft.delete({ where: { id: draftId } });
      } catch {
        // Draft might not exist, ignore
      }
    }

    return NextResponse.json({
      id: result.id,
      status: 'triage',
      priority,
      slaDeadline: slaDeadline.toISOString(),
      submittedAt: now.toISOString(),
      filesStored: uploadedFiles.length,
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

    return NextResponse.json(
      { error: 'SUBMIT_FAILED', message: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
