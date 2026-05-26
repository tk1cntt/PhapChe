import type { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import type { AppSession } from '@/lib/security/session';

const adminRoles = ['coordinator_admin', 'super_admin'] as const;
const allowedRoles: Role[] = ['customer', 'specialist', 'reviewer', 'coordinator_admin', 'super_admin'];

export type AdminDb = {
  $transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
};

type UserMutationInput = {
  actor: AppSession;
  db?: AdminDb;
};

type CreateAdminUserInput = {
  email: string;
  name: string;
  role: Role;
  workspaceId: string;
  correlationId: string;
};

type UpdateAdminUserRoleInput = {
  userId: string;
  role: Role;
  workspaceId: string;
  correlationId: string;
};

type DeactivateAdminUserInput = {
  userId: string;
  workspaceId: string;
  correlationId: string;
};

type AssignUserToWorkspaceInput = {
  userId: string;
  workspaceId: string;
  role: Role;
  correlationId: string;
};

function assertAdmin(actor: AppSession) {
  if (!actor.roles.some((role) => adminRoles.includes(role as (typeof adminRoles)[number]))) throw new Error('FORBIDDEN');
}

async function assertAdminForWorkspace(actor: AppSession, workspaceId: string, tx: Prisma.TransactionClient) {
  if (actor.roles.includes('super_admin')) return;

  const membership = await tx.workspaceMembership.findFirst({
    where: {
      userId: actor.userId,
      workspaceId,
      role: 'coordinator_admin',
      isActive: true,
      workspace: { isActive: true },
    },
    select: { id: true },
  });

  if (!membership) throw new Error('FORBIDDEN');
}

function assertAllowedRole(role: Role) {
  if (!allowedRoles.includes(role)) throw new Error('INVALID_ROLE');
}

export async function createAdminUser({ actor, input, db = prisma }: UserMutationInput & { input: CreateAdminUserInput }) {
  assertAdmin(actor);
  assertAllowedRole(input.role);

  return db.$transaction(async (tx) => {
    await assertAdminForWorkspace(actor, input.workspaceId, tx);

    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        memberships: {
          create: {
            workspaceId: input.workspaceId,
            role: input.role,
          },
        },
      },
    });

    const auditInput = {
      actorId: actor.userId,
      workspaceId: input.workspaceId,
      action: 'user.created',
      targetType: 'USER' as const,
      targetId: user.id,
      correlationId: input.correlationId,
      metadataSummary: `role=${input.role}`,
    };
    await recordAuditEvent(auditInput, tx);

    return user;
  });
}

export async function updateAdminUserRole({ actor, input, db = prisma }: UserMutationInput & { input: UpdateAdminUserRoleInput }) {
  assertAdmin(actor);
  assertAllowedRole(input.role);

  return db.$transaction(async (tx) => {
    await assertAdminForWorkspace(actor, input.workspaceId, tx);

    const membership = await tx.workspaceMembership.upsert({
      where: {
        userId_workspaceId_role: {
          userId: input.userId,
          workspaceId: input.workspaceId,
          role: input.role,
        },
      },
      update: { isActive: true },
      create: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });

    const auditInput = {
      actorId: actor.userId,
      workspaceId: input.workspaceId,
      action: 'user.role_updated',
      targetType: 'USER' as const,
      targetId: input.userId,
      correlationId: input.correlationId,
      metadataSummary: `role=${input.role}`,
    };
    await recordAuditEvent(auditInput, tx);

    return membership;
  });
}

export async function deactivateAdminUser({ actor, input, db = prisma }: UserMutationInput & { input: DeactivateAdminUserInput }) {
  assertAdmin(actor);

  return db.$transaction(async (tx) => {
    await assertAdminForWorkspace(actor, input.workspaceId, tx);

    const user = await tx.user.update({
      where: { id: input.userId },
      data: { isActive: false },
    });

    const auditInput = {
      actorId: actor.userId,
      workspaceId: input.workspaceId,
      action: 'user.deactivated',
      targetType: 'USER' as const,
      targetId: input.userId,
      correlationId: input.correlationId,
      metadataSummary: 'isActive=false',
    };
    await recordAuditEvent(auditInput, tx);

    return user;
  });
}

export async function assignUserToWorkspace({ actor, input, db = prisma }: UserMutationInput & { input: AssignUserToWorkspaceInput }) {
  assertAdmin(actor);
  assertAllowedRole(input.role);

  return db.$transaction(async (tx) => {
    await assertAdminForWorkspace(actor, input.workspaceId, tx);

    const membership = await tx.workspaceMembership.upsert({
      where: {
        userId_workspaceId_role: {
          userId: input.userId,
          workspaceId: input.workspaceId,
          role: input.role,
        },
      },
      update: { isActive: true },
      create: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });

    const auditInput = {
      actorId: actor.userId,
      workspaceId: input.workspaceId,
      action: 'workspace.membership_assigned',
      targetType: 'MEMBERSHIP' as const,
      targetId: membership.id,
      correlationId: input.correlationId,
      metadataSummary: `user=${input.userId};role=${input.role}`,
    };
    await recordAuditEvent(auditInput, tx);

    return membership;
  });
}
