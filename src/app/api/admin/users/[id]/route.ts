/**
 * User Detail/Update API
 * GET/PATCH/DELETE /api/admin/users/[id]
 *
 * Platform admin only - queries all memberships for admin role check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'UNAUTHORIZED', detail: 'Authentication required' };
  }

  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);

  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'FORBIDDEN', detail: 'Admin access required' };
  }

  return { session, userId: session.user.id, roles: userRoles };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        title: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastActiveAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            isActive: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'User not found' }, { status: 404 });
    }

    // Get stats in parallel
    const [
      workspaceCount,
      auditEventCount,
      openCasesCount,
      documentCount,
    ] = await Promise.all([
      // Count workspaces
      prisma.workspaceMembership.count({
        where: { userId: id, isActive: true },
      }),
      // Count audit events (active workspaces)
      prisma.auditEvent.count({
        where: {
          actorId: id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Count open cases
      prisma.requestAssignment.count({
        where: {
          userId: id,
          request: {
            status: { notIn: ['completed', 'cancelled', 'draft', 'draft_intake'] },
          },
        },
      }),
      // Count documents
      prisma.vaultFile.count({
        where: { actorId: id },
      }),
    ]);

    // Get activity feed
    const auditEvents = await prisma.auditEvent.findMany({
      where: { actorId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        metadataSummary: true,
        createdAt: true,
      },
    });

    // Transform activity feed
    const activityFeed = auditEvents.map((event) => {
      const actionLabels: Record<string, { icon: string; label: string; variant: string }> = {
        'request.created': { icon: 'req', label: 'Tạo hồ sơ mới', variant: 'req' },
        'request.updated': { icon: 'req', label: 'Cập nhật hồ sơ', variant: 'req' },
        'request.assigned': { icon: 'req', label: 'Phân công hồ sơ', variant: 'req' },
        'document.uploaded': { icon: 'doc', label: 'Upload tài liệu', variant: 'doc' },
        'document.viewed': { icon: 'doc', label: 'Xem tài liệu', variant: 'doc' },
        'partner.comment_added': { icon: 'partner', label: 'Bình luận partner', variant: 'partner' },
        'workflow.transition': { icon: 'org', label: 'Thay đổi workflow', variant: 'org' },
        'login.success': { icon: 'org', label: 'Đăng nhập', variant: 'org' },
      };

      const config = actionLabels[event.action] || { icon: 'org', label: event.action, variant: 'org' };
      const meta = event.metadataSummary ? JSON.parse(event.metadataSummary) as Record<string, unknown> : {};
      const description = typeof meta.details === 'string' ? meta.details : event.action;

      return {
        id: event.id,
        icon: config.icon,
        label: config.label,
        variant: config.variant,
        description,
        metadata: {
          requestCode: meta.requestCode as string | undefined,
          documentName: meta.documentName as string | undefined,
          partnerName: meta.partnerName as string | undefined,
        },
        createdAt: event.createdAt.toISOString(),
        timeAgo: getTimeAgo(event.createdAt),
      };
    });

    // Get related partners
    const relatedRequests = await prisma.legalRequest.findMany({
      where: {
        OR: [
          { createdById: id },
          { assignedSpecialistId: id },
        ],
        assignedPartnerId: { not: null },
      },
      select: {
        assignedPartnerId: true,
        assignedPartner: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      take: 10,
    });

    // Dedupe partners
    const partnerMap = new Map();
    relatedRequests.forEach((req) => {
      if (req.assignedPartner && !partnerMap.has(req.assignedPartner.id)) {
        partnerMap.set(req.assignedPartner.id, {
          ...req.assignedPartner,
          status: 'active' as const,
        });
      }
    });

    // Get user requests for table
    const userRequests = await prisma.legalRequest.findMany({
      where: {
        OR: [
          { createdById: id },
          { assignedSpecialistId: id },
        ],
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        slaDeadline: true,
        workspace: { select: { name: true } },
        assignedPartner: { select: { name: true } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate SLA/risk metrics
    const pendingActions = await prisma.requestAssignment.count({
      where: {
        userId: id,
        request: {
          status: { in: ['submitted', 'assigned', 'in_progress'] },
          slaDeadline: { lt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        },
      },
    });

    const totalAssignments = await prisma.requestAssignment.count({
      where: {
        userId: id,
        request: {
          status: { notIn: ['draft', 'draft_intake'] },
        },
      },
    });

    const onTimeRate = totalAssignments > 0 ? Math.round(((totalAssignments - pendingActions) / totalAssignments) * 100) : 100;

    // Get timeline (last 7 days)
    const timelineEvents = await prisma.auditEvent.findMany({
      where: {
        actorId: id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        action: true,
        metadataSummary: true,
        createdAt: true,
      },
    });

    const timeline = timelineEvents.map((event, index) => {
      const meta = event.metadataSummary ? JSON.parse(event.metadataSummary) as Record<string, unknown> : {};
      return {
        step: index + 1,
        title: getActionTitle(event.action),
        description: getTimelineDescription(event.action, meta),
        date: event.createdAt.toLocaleDateString('vi-VN'),
      };
    });

    // Determine status
    let status: 'active' | 'invited' | 'inactive' = 'inactive';
    if (!user.emailVerified) {
      status = 'invited';
    } else if (user.isActive) {
      status = 'active';
    }

    // Calculate health score
    const healthScore = Math.max(70, Math.min(100, 100 - (pendingActions * 5) - Math.max(0, openCasesCount - 5) * 2));

    // Get identifier
    const identifier = user.email.split('@')[0].replace(/[._]/g, '_');

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        title: user.title,
        status,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: user.lastActiveAt?.toISOString() || null,
        identifier,
        healthScore,
        stats: {
          organizations: 1,
          workspaces: workspaceCount,
          activeWorkspacesToday: Math.max(1, Math.min(2, auditEventCount)),
          openCases: openCasesCount,
          partners: partnerMap.size,
          documents: documentCount,
          risk: pendingActions > 0 ? Math.min(3, pendingActions) : 0,
        },
        memberships: user.memberships.map((m) => ({
          id: m.id,
          role: m.role,
          isActive: m.isActive,
          workspace: m.workspace,
        })),
        requests: userRequests.map((r) => ({
          id: r.id,
          code: r.code,
          title: r.title,
          status: r.status,
          workspaceName: r.workspace?.name || '—',
          partnerName: r.assignedPartner?.name || '—',
          slaDeadline: r.slaDeadline?.toISOString() || null,
        })),
        activityFeed,
        partners: Array.from(partnerMap.values()),
        permissions: user.memberships.map((m) => ({
          role: m.role,
          workspaceName: m.workspace?.name || 'Unknown',
          isActive: m.isActive,
        })),
        slaRisk: {
          pendingActions,
          onTimeRate,
          documentsNeedReview: Math.max(0, documentCount - 5),
          healthScore,
        },
        timeline,
      },
    });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error fetching user detail:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, userId: currentUserId } = await requireAdminSession();
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, isActive } = body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, userId: currentUserId } = await requireAdminSession();
    const { id } = await params;

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Cannot delete yourself' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'User not found' }, { status: 404 });
    }

    // Soft delete - deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
}

function getActionTitle(action: string): string {
  const titles: Record<string, string> = {
    'document.uploaded': 'Upload tài liệu',
    'request.created': 'Tạo hồ sơ',
    'request.updated': 'Cập nhật hồ sơ',
    'partner.comment_added': 'Trả lời partner',
    'workflow.transition': 'Thay đổi workflow',
    'login.success': 'Đăng nhập',
  };
  return titles[action] || action;
}

function getTimelineDescription(action: string, meta: Record<string, unknown>): string {
  if (action === 'document.uploaded' && meta.documentName) {
    return `${meta.documentName} · ${new Date(meta.timestamp as string || Date.now()).toLocaleDateString('vi-VN')}`;
  }
  if (action === 'partner.comment_added' && meta.requestCode) {
    return `${meta.requestCode} · ${meta.partnerName || 'Partner'}`;
  }
  return '';
}
