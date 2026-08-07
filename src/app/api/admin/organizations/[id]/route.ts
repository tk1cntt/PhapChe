/**
 * Organization Detail/Update API
 * GET/PATCH/DELETE /api/admin/organizations/[id]
 *
 * Platform admin only - queries all memberships for admin role check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';

// Valid admin roles
// Extracted to src/lib/auth/admin-auth.ts — import from there instead:
// import { requireAdminSession } from '@/lib/auth/admin-auth';

// GET - Get organization detail with activity data
// ---- Activity query helpers ----

interface OrganizationActivity {
  workspaceCount: number;
  memberCount: number;
  openRequestsCount: number;
  inProgressRequestsCount: number;
  vaultFilesCount: number;
  slaRiskCount: number;
  recentRequests: Awaited<ReturnType<typeof prisma.legalRequest.findMany>>;
  recentAuditLogs: Awaited<ReturnType<typeof prisma.auditEvent.findMany>>;
}

async function fetchOrganizationActivity(
  organizationId: string,
  workspaceIds: string[]
): Promise<OrganizationActivity> {
  const [
    workspaceCount,
    memberCount,
    openRequestsCount,
    inProgressRequestsCount,
    vaultFilesCount,
    slaRiskCount,
    recentRequests,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.workspace.count({ where: { organizationId } }),
    workspaceIds.length > 0
      ? prisma.workspaceMembership.groupBy({
          by: ['userId'],
          where: { workspaceId: { in: workspaceIds }, isActive: true },
        })
      : Promise.resolve([]),
    // ... remaining queries ...
  ]);

  return {
    workspaceCount,
    memberCount: Array.isArray(memberCount) ? memberCount.length : 0,
    openRequestsCount,
    inProgressRequestsCount,
    vaultFilesCount,
    slaRiskCount,
    recentRequests,
    recentAuditLogs,
  };
}
    memberCount,
    openRequestsCount,
    inProgressRequestsCount,
    vaultFilesCount,
    slaRiskCount,
    recentRequests,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.workspace.count({ where: { organizationId } }),
    workspaceIds.length > 0
      ? prisma.workspaceMembership.groupBy({
          by: ['userId'],
          where: { workspaceId: { in: workspaceIds }, isActive: true },
        })
      : Promise.resolve([]),
    // ... remaining queries ...
  ]);

  return {
    workspaceCount,
    memberCount: Array.isArray(memberCount) ? memberCount.length : 0,
    openRequestsCount,
    inProgressRequestsCount,
    vaultFilesCount,
    slaRiskCount,
    recentRequests,
    recentAuditLogs,
  };
}
      // Open requests (not closed/cancelled)
/** Return query result when workspaceIds is non-empty, otherwise return fallback. */
async function safeQuery<T>(
  workspaceIds: string[],
  query: () => Promise<T>,
  fallback: T
): Promise<T> {
  return workspaceIds.length > 0 ? query() : fallback;
}

// Usage becomes:
safeQuery(workspaceIds,
  () => prisma.legalRequest.count({
    where: {
      workspaceId: { in: workspaceIds },
      status: { notIn: ['closed', 'cancelled'] },
    },
  }),
  0
),

// Usage becomes:
safeQuery(workspaceIds,
  () => prisma.legalRequest.count({
    where: {
      workspaceId: { in: workspaceIds },
      status: { notIn: ['closed', 'cancelled'] },
    },
  }),
  0
),
      // Vault files count
      workspaceIds.length > 0
        ? prisma.vaultFile.count({
            where: { workspaceId: { in: workspaceIds } },
          })
        : 0,

      // SLA at risk (within 24h)
      workspaceIds.length > 0
        ? prisma.legalRequest.count({
            where: {
              workspaceId: { in: workspaceIds },
              slaDeadline: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
              status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
            },
          })
        : 0,

      // Recent requests
      workspaceIds.length > 0
        ? prisma.legalRequest.findMany({
            where: { workspaceId: { in: workspaceIds } },
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
              priority: true,
              slaDeadline: true,
              workspace: { select: { id: true, name: true } },
              createdBy: { select: { name: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),

      // Recent audit logs
      workspaceIds.length > 0
        ? prisma.auditEvent.findMany({
            where: {
              workspaceId: { in: workspaceIds },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    // Count unique members
    const uniqueMemberCount = Array.isArray(memberCount) ? memberCount.length : 0;

    // Build response with stats
    const responseData = {
      ...organization,
      _count: {
        workspaces: workspaceCount,
        members: uniqueMemberCount,
        openRequests: openRequestsCount,
        vaultFiles: vaultFilesCount,
      },
      stats: {
        openRequests: openRequestsCount,
        inProgressRequests: inProgressRequestsCount,
        slaRisk: slaRiskCount,
        activeWorkspacesToday: organization.workspaces.filter((w) => w.isActive).length,
      },
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        code: r.code || 'N/A',
        title: r.title,
        status: r.status,
        priority: r.priority,
        slaDeadline: r.slaDeadline,
        workspaceName: r.workspace?.name || 'Unknown',
        createdByName: r.createdBy?.name || 'Unknown',
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        requestId: log.requestId,
        metadataSummary: log.metadataSummary,
        createdAt: log.createdAt,
      })),
    };

    return NextResponse.json({ data: responseData });
/**
 * Handle caught errors uniformly across all route handlers.
 * Returns a NextResponse with the appropriate status and error body.
 */
function handleApiError(error: unknown, operation: string): NextResponse {
  if (isStructuredError(error)) {
    return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
  }
  console.error(`Error ${operation}:`, error);
  return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
}
  }
  console.error(`Error ${operation}:`, error);
  return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
}
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const organization = await prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'Organization not found' }, { status: 404 });
    }

    // Cannot modify default organization
    if (organization.isDefault) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Cannot modify default organization' }, { status: 400 });
    }

    const VALID_STATUSES = ['active', 'inactive', 'pending'] as const;

    const body = await req.json();
    const { name, businessType, registrationNumber, address, contactEmail, status } = body;

    if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(businessType !== undefined && { businessType }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(address !== undefined && { address }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deactivate organization (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const organization = await prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'Organization not found' }, { status: 404 });
    }

    if (organization.isDefault) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Cannot delete default organization' }, { status: 400 });
    }

    // Soft delete - set inactive
    await prisma.organization.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
