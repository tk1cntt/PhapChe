import type { AuditTargetType, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type AuditDb = PrismaClient | Prisma.TransactionClient;

type AuditTargetTypeInput =
  | 'USER'
  | 'WORKSPACE'
  | 'MEMBERSHIP'
  | 'REQUEST'
  | 'ASSIGNMENT'
  | 'DOCUMENT'
  | 'REVIEW'
  | 'VAULT_FILE'
  | 'WORKFLOW_TRANSITION';

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
  ASSIGNMENT: 'assignment',
  DOCUMENT: 'document',
  REVIEW: 'review',
  VAULT_FILE: 'vault_file',
  WORKFLOW_TRANSITION: 'workflow_transition',
};

export async function recordAuditEvent(input: RecordAuditEventInput, db: AuditDb = prisma) {
  if (!input.workspaceId.trim()) throw new Error('AUDIT_WORKSPACE_REQUIRED');
  if (!input.action.trim()) throw new Error('AUDIT_ACTION_REQUIRED');
  if (!input.targetId.trim()) throw new Error('AUDIT_TARGET_REQUIRED');
  if (!input.correlationId.trim()) throw new Error('AUDIT_CORRELATION_REQUIRED');
  if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('AUDIT_METADATA_TOO_LONG');

  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      workspaceId: input.workspaceId,
      action: input.action,
      targetType: targetTypeMap[input.targetType],
      targetId: input.targetId,
      requestId: input.requestId ?? null,
      correlationId: input.correlationId,
      metadataSummary: input.metadataSummary ?? null,
    },
  });
}
