/**
 * Partner Detail API
 * GET /api/admin/partners/[id]
 *
 * Returns partner details with stats, engagements, members, and recent activity.
 * Data structure matches PartnerActivityClient component expectations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get partner with all related data
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        engagements: {
          include: {
            organization: {
              select: { id: true, name: true, businessType: true, status: true },
            },
            serviceScopes: {
              include: {
                serviceType: {
                  select: { id: true, key: true, name: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [
      totalRequests,
      activeRequests,
      completedRequests,
      slaAtRiskRequests,
      pendingReviewRequests,
      recentRequests,
      recentAuditLogs,
      recentComments,
    ] = await Promise.all([
      // Total requests assigned to this partner
      prisma.legalRequest.count({
        where: { assignedPartnerId: id },
      }),

      // Active requests (not closed/cancelled/delivered)
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          status: { notIn: ['closed', 'cancelled', 'delivered'] },
        },
      }),

      // Completed requests
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          status: { in: ['delivered', 'closed'] },
        },
      }),

      // SLA at risk (deadline within 24 hours)
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          slaDeadline: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
        },
      }),

      // Pending review requests
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          status: 'pending_review',
        },
      }),

      // Recent requests with full details
      prisma.legalRequest.findMany({
        where: { assignedPartnerId: id },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              organization: { select: { id: true, name: true } },
            },
          },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),

      // Recent audit logs for this partner
      prisma.auditEvent.findMany({
        where: {
          OR: [
            // Actions by partner members
            { actor: { partnerMemberships: { some: { partnerId: id } } } },
            // Actions on requests assigned to this partner
            { request: { assignedPartnerId: id } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),

      // Recent comments by partner members
      prisma.comment.findMany({
        where: {
          request: { assignedPartnerId: id },
        },
        include: {
          author: { select: { id: true, name: true } },
          request: { select: { id: true, code: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate capacity metrics
    const maxOpenRequests = 32; // Configurable max capacity
    const pendingDocs = Math.floor(pendingReviewRequests * 1.5); // Estimated pending docs
    const slaOnTimePercent = totalRequests > 0
      ? Math.round(((completedRequests - Math.min(slaAtRiskRequests, completedRequests)) / Math.max(completedRequests, 1)) * 100)
      : 100;

    // Build capacity object
    const capacity = {
      openRequests: {
        current: activeRequests,
        max: maxOpenRequests,
      },
      slaOnTime: slaOnTimePercent,
      pendingDocs: pendingDocs,
      slaRisks: {
        count: slaAtRiskRequests,
        requests: slaAtRiskRequests > 0
          ? recentRequests.filter(r => {
              const deadline = r.slaDeadline ? new Date(r.slaDeadline).getTime() : 0;
              return deadline > 0 && deadline <= Date.now() + 24 * 60 * 60 * 1000;
            }).map(r => r.code || r.id.slice(0, 8)).join(', ')
          : '',
      },
      accessReview: {
        count: 0, // TODO: Calculate from workspace permissions
        description: 'Không có quyền cần rà soát',
      },
    };

    // Determine partner model type
    const uniqueOrgIds = new Set(partner.engagements.map((e) => e.organizationId));
    const modelType = uniqueOrgIds.size > 1 ? 'specialist' : 'dedicated';

    // Build service scopes
    const serviceScopes = [...new Set(
      partner.engagements.flatMap((e) =>
        e.serviceScopes.map((s) => s.serviceType.name)
      )
    )];

    // Build related users from audit logs and comments
    const relatedUsersMap = new Map<string, { id: string; name: string; role: string; description: string }>();

    // Add partner members
    partner.members.forEach((m) => {
      const requestCount = recentRequests.filter(r =>
        r.createdBy?.id === m.user.id
      ).length;
      relatedUsersMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.name,
        role: 'partner',
        description: `${m.role === 'partner_admin' ? 'Partner Admin' : m.role} · owner của ${requestCount} hồ sơ đang mở`,
      });
    });

    // Add users from audit logs
    recentAuditLogs.forEach((log) => {
      if (log.actor && !relatedUsersMap.has(log.actor.id)) {
        relatedUsersMap.set(log.actor.id, {
          id: log.actor.id,
          name: log.actor.name,
          role: 'admin',
          description: 'Coordinator Admin · giao việc và review tài liệu partner',
        });
      }
    });

    // Add users from requests createdBy
    recentRequests.forEach((r) => {
      if (r.createdBy && !relatedUsersMap.has(r.createdBy.id)) {
        relatedUsersMap.set(r.createdBy.id, {
          id: r.createdBy.id,
          name: r.createdBy.name,
          role: 'customer',
          description: `Customer của ${r.workspace?.organization?.name || 'Unknown'} · tương tác về hồ sơ`,
        });
      }
    });

    const relatedUsers = Array.from(relatedUsersMap.values()).slice(0, 5);

    // Build timeline from audit logs and comments
    const timelineMap = new Map<string, { id: string; action: string; requestCode?: string; orgName?: string; date: string }>();

    recentAuditLogs.forEach((log) => {
      const dateKey = new Date(log.createdAt).toLocaleDateString('vi-VN');
      const meta = log.metadataSummary ? JSON.parse(log.metadataSummary) : {};
      const request = recentRequests.find(r => r.id === log.requestId);

      if (!timelineMap.has(log.id)) {
        timelineMap.set(log.id, {
          id: log.id,
          action: log.action,
          requestCode: request?.code || meta.requestCode,
          orgName: meta.orgName || request?.workspace?.organization?.name,
          date: dateKey,
        });
      }
    });

    // Add comment activities to timeline
    recentComments.forEach((comment) => {
      const dateKey = new Date(comment.createdAt).toLocaleDateString('vi-VN');
      const request = recentRequests.find(r => r.id === comment.requestId);

      timelineMap.set(`comment-${comment.id}`, {
        id: `comment-${comment.id}`,
        action: `${comment.author?.name || 'User'} bình luận trên ${request?.code || 'hồ sơ'}`,
        requestCode: request?.code,
        orgName: request?.workspace?.organization?.name,
        date: dateKey,
      });
    });

    const timeline = Array.from(timelineMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);

    // Get last active time from most recent audit log or comment
    const lastAuditTime = recentAuditLogs[0]?.createdAt;
    const lastCommentTime = recentComments[0]?.createdAt;
    const lastActive = lastAuditTime && lastCommentTime
      ? (lastAuditTime > lastCommentTime ? lastAuditTime : lastCommentTime)
      : (lastAuditTime || lastCommentTime || null);

    // Build recent requests for the table
    const recentRequestsForTable = recentRequests.slice(0, 10).map((r) => {
      const slaRemaining = r.slaDeadline
        ? Math.max(0, Math.floor((new Date(r.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60)))
        : null;
      const slaStatus = slaRemaining !== null
        ? (slaRemaining <= 0 ? 'expired' : slaRemaining <= 24 ? 'at_risk' : 'ok')
        : 'unknown';

      return {
        id: r.id,
        code: r.code || 'N/A',
        title: r.title,
        status: r.status,
        priority: r.priority,
        slaDeadline: r.slaDeadline,
        workspaceName: r.workspace?.name || 'Unknown',
        organizationName: r.workspace?.organization?.name || 'Unknown',
        createdByName: r.createdBy?.name || 'Unknown',
        slaRemaining,
        slaStatus,
      };
    });

    // Build organizations with stats
    const orgStats = new Map<string, { openCases: number; docs: number; users: number }>();
    recentRequests.forEach((r) => {
      const orgName = r.workspace?.organization?.name || 'Unknown';
      const current = orgStats.get(orgName) || { openCases: 0, docs: 0, users: 0 };
      current.openCases++;
      orgStats.set(orgName, current);
    });

    const organizations = partner.engagements.map((e) => ({
      id: e.organization.id,
      name: e.organization.name,
      businessType: e.organization.businessType,
      status: e.organization.status,
      workspaces: e.organization.id, // Reference for stats
      serviceScopes: e.serviceScopes.map((s) => s.serviceType.name),
      model: uniqueOrgIds.size > 1 ? 'Specialist' : 'Dedicated Partner',
      stats: orgStats.get(e.organization.name) || { openCases: 0, docs: 0, users: 0 },
    }));

    // Build response
    const responseData = {
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      type: partner.type,
      status: partner.status,
      contactEmail: partner.contactEmail,
      phone: partner.phone,
      address: partner.address,
      createdAt: partner.createdAt,
      modelType,
      serviceScopes,
      lastActive,

      // Stats for hero section
      stats: {
        activeRequests,
        completedRequests,
        slaRisk: slaAtRiskRequests,
        organizations: partner.engagements.length,
        workspaces: partner.engagements.length * 2, // Estimated
        documents: pendingDocs + completedRequests,
        usersTouched: relatedUsers.length,
        healthScore: Math.max(60, Math.min(100, slaOnTimePercent + (capacity.openRequests.current < capacity.openRequests.max * 0.8 ? 10 : 0))),
      },

      // Capacity for sidebar
      capacity,

      // Related users for sidebar
      relatedUsers,

      // Timeline for sidebar
      timeline,

      // Recent audit logs for activity feed
      recentAuditLogs: recentAuditLogs.slice(0, 10).map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        requestId: log.requestId,
        actorName: log.actor?.name,
        metadataSummary: log.metadataSummary,
        createdAt: log.createdAt,
      })),

      // Recent requests for table
      recentRequests: recentRequestsForTable,

      // Organizations
      organizations,

      // Members
      members: partner.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
      })),

      // Count
      _count: {
        members: partner.members.length,
        engagements: partner.engagements.length,
        totalRequests,
      },
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Partner detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
