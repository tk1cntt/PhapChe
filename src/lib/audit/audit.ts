import { prisma } from '../prisma';

type AuditTargetTypeInput =
  | 'USER'
  | 'WORKSPACE'
  | 'REQUEST'
  | 'ASSIGNMENT'
  | 'DOCUMENT'
  | 'REVIEW'
  | 'VAULT_FILE';

type AuditTargetType = Lowercase<AuditTargetTypeInput>;

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

export type RecordAuditEventInput = {
  actorId?: string | null;
  workspaceId?: string | null;
  action: string;
  targetType: AuditTargetTypeInput;
  targetId: string;
  requestId?: string | null;
  correlationId: string;
  metadataSummary?: string | null;
};

export async function recordAuditEvent(input: RecordAuditEventInput, db: AuditDb = prisma) {
  if (!input.workspaceId?.trim()) {
    throw new Error('workspaceId is required');
  }

  if (!input.action.trim()) {
    throw new Error('action is required');
  }

  if (!input.targetId.trim()) {
    throw new Error('targetId is required');
  }

  if (!input.correlationId.trim()) {
    throw new Error('correlationId is required');
  }

  if (input.metadataSummary != null && typeof input.metadataSummary !== 'string') {
    throw new Error('metadataSummary must be a string');
  }

  if (input.metadataSummary && input.metadataSummary.length > 500) {
    throw new Error('metadataSummary must be 500 characters or fewer');
  }

  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      workspaceId: input.workspaceId,
      action: input.action,
      targetType: input.targetType.toLowerCase() as AuditTargetType,
      targetId: input.targetId,
      requestId: input.requestId ?? null,
      correlationId: input.correlationId,
      metadataSummary: input.metadataSummary ?? null,
    },
  });
}
