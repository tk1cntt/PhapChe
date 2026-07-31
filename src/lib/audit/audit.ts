import type { AuditTargetType } from '@/lib/types';
import { prisma } from '@/lib/prisma';

type AuditDb = {
  auditEvent: {
    create(input: {
      data: {
        actorId: string | null;
        workspaceId: string;
        action: string;
        targetType: AuditTargetType;
        targetId: string;
        requestId: string | null;
        correlationId: string;
        metadataSummary: string | null;
      };
    }): Promise<unknown>;
  };
};

type AuditTargetTypeInput = keyof typeof targetTypeMap;

type RecordAuditEventInput = {
  actorId?: string | null;
  workspaceId: string;
  action: string;
  targetType: AuditTargetTypeInput;
  targetId: string;
  requestId?: string | null;
  correlationId: string;
  metadataSummary?: string | null;
};

const targetTypeMap: Record<AuditTargetTypeInput, AuditTargetType> = {
  USER: 'user',
  WORKSPACE: 'workspace',
  MEMBERSHIP: 'membership',
  REQUEST: 'request',
  MATTER_TYPE: 'matter_type',
  INTAKE_SUBMISSION: 'intake_submission',
  ASSIGNMENT: 'assignment',
  DOCUMENT: 'document',
  REVIEW: 'review',
  VAULT_FILE: 'vault_file',
  WORKFLOW_TRANSITION: 'workflow_transition',
};

export async function recordAuditEvent(input: RecordAuditEventInput, db: AuditDb = prisma) {
  if (!input.workspaceId?.trim()) throw new Error('AUDIT_WORKSPACE_REQUIRED');
  if (!input.action?.trim()) throw new Error('AUDIT_ACTION_REQUIRED');
  if (!input.targetId?.trim()) throw new Error('AUDIT_TARGET_REQUIRED');
  if (!input.correlationId?.trim()) throw new Error('AUDIT_CORRELATION_REQUIRED');
  if (input.metadataSummary != null && typeof input.metadataSummary !== 'string') throw new Error('metadataSummary must be a string');
  if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('metadataSummary must be 500 characters or fewer');

  const resolvedTargetType = targetTypeMap[input.targetType];
  if (!resolvedTargetType) throw new Error('AUDIT_TARGET_TYPE_INVALID');

  try {
    return await db.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        workspaceId: input.workspaceId,
        action: input.action,
        targetType: resolvedTargetType,
        targetId: input.targetId,
        requestId: input.requestId ?? null,
        correlationId: input.correlationId,
        metadataSummary: input.metadataSummary ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to record audit event:', error);
    throw new Error('AUDIT_RECORD_FAILED');
  }
}
