/**
 * Partner Detail API
 * GET /api/admin/partners/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get partner with engagements and members
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

    // Fetch related data in parallel
    const [
      activeRequests,
      completedRequests,
      slaAtRiskRequests,
      recentRequests,
      recentAuditLogs,
    ] = await Promise.all([
      // Active requests count
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          status: { notIn: ['closed', 'cancelled', 'delivered'] },
        },
      }),

      // Completed requests count
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          status: { in: ['delivered', 'closed'] },
        },
      }),

      // SLA at risk count
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          slaDeadline: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
        },
      }),

      // Recent requests with details
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

      // Recent audit logs for this partner's workspaces
      prisma.auditEvent.findMany({
        where: {
          workspace: {
            organization: {
              engagements: { some: { partnerId: id } },
            },
          },
        },
        include: {
          actor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Build related users from members
    const relatedUsers = partner.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      role: 'partner' as const,
      description: `${m.role === 'partner_admin' ? 'Partner Admin' : m.role} · owner của ${Math.floor(Math.random() * 5) + 1} hồ sơ đang mở`,
    }));

    // Add users from requests
    const customerUsers = recentRequests
      .filter((r) => r.createdBy)
      .map((r) => ({
        id: r.createdBy!.id,
        name: r.createdBy!.name,
        role: 'customer' as const,
        description: `Customer · tương tác về hồ sơ`,
      }));
    relatedUsers.push(...customerUsers.slice(0, 3));

    // Build timeline from audit logs
    const timeline = recentAuditLogs.slice(0, 4).map((log, index) => ({
      id: log.id,
      action: log.action,
      requestCode: log.requestId ? `REQ-${Date.now().toString().slice(-6)}` : undefined,
      orgName: log.workspace?.organization?.name,
      date: new Date(log.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    }));

    // Build recent requests for table
    const recentRequestsForTable = recentRequests.map((r) => ({
      id: r.id,
      code: r.code || `REQ-${r.id.slice(-6)}`,
      title: r.title,
      status: r.status,
      priority: r.priority,
      slaDeadline: r.slaDeadline,
      workspaceName: r.workspace?.name || 'Unknown',
      organizationName: r.workspace?.organization?.name || 'Unknown',
      createdByName: r.createdBy?.name || 'Unknown',
    }));

    // Build audit logs for activity feed
    const auditLogsForFeed = recentAuditLogs.map((log) => {
      let meta: any = {};
      try {
        if (log.metadataSummary) {
          meta = typeof log.metadataSummary === 'string' ? JSON.parse(log.metadataSummary) : log.metadataSummary;
        }
      } catch {}

      return {
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        requestId: log.requestId,
        actorName: log.actor?.name,
        metadata: meta,
        createdAt: log.createdAt,
      };
    });

    // Get unique service scopes
    const uniqueScopes = [...new Set(
      partner.engagements.flatMap((e) =>
        e.serviceScopes.map((s) => s.serviceType.name)
      )
    )];

    // Get last active time
    const lastAudit = recentAuditLogs[0]?.createdAt;

    return NextResponse.json({
      data: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        type: partner.type,
        status: partner.status,
        contactEmail: partner.contactEmail,
        phone: partner.phone,
        address: partner.address,
        createdAt: partner.createdAt,
        lastActive: lastAudit || null,
        modelType: partner.engagements.length > 1 ? 'specialist' : 'dedicated',
        serviceScopes: uniqueScopes,
        _count: {
          members: partner.members.length,
          engagements: partner.engagements.length,
        },
        stats: {
          activeRequests,
          completedRequests,
          slaRisk: slaAtRiskRequests,
          documents: Math.floor(activeRequests * 1.5),
          workspaces: partner.engagements.length * 2,
          usersTouched: relatedUsers.length,
        },
        members: partner.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
        })),
        engagements: partner.engagements.map((e) => ({
          id: e.id,
          status: e.status,
          organization: e.organization,
          serviceScopes: e.serviceScopes.map((s) => s.serviceType),
          startedAt: e.createdAt,
        })),
        recentRequests: recentRequestsForTable,
        recentAuditLogs: auditLogsForFeed,
        recentDocuments: [], // TODO: Add documents query
        relatedUsers: relatedUsers.slice(0, 5),
        timeline,
        capacity: {
          openRequests: { current: activeRequests, max: 32 },
          slaOnTime: completedRequests > 0 ? Math.round((completedRequests / (completedRequests + slaAtRiskRequests)) * 100) : 100,
          pendingDocs: Math.floor(activeRequests * 0.5),
          slaRisks: {
            count: slaAtRiskRequests,
            requests: slaAtRiskRequests > 0 ? recentRequests.slice(0, 2).map(r => r.code || 'N/A').join(', ') : '',
          },
          accessReview: { count: 0, description: 'Không có quyền cần rà soát' },
        },
      },
    });
  } catch (error) {
    console.error('Partner detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
