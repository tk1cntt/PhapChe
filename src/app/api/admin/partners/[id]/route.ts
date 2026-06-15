/**
 * Partner Detail API
 * GET /api/admin/partners/[id]
 *
 * Returns partner details with stats, engagements, members, and recent activity.
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

    const engagementIds = partner.engagements.map((e) => e.id);

    // Fetch counts and stats in parallel
    const [
      totalRequests,
      activeRequests,
      completedRequests,
      slaRiskCount,
      recentRequests,
      recentAuditLogs,
    ] = await Promise.all([
      // Total requests assigned to this partner
      prisma.legalRequest.count({
        where: { assignedPartnerId: id },
      }),

      // Active requests (not closed/cancelled)
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

      // SLA at risk
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: id,
          slaDeadline: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
        },
      }),

      // Recent requests
      prisma.legalRequest.findMany({
        where: { assignedPartnerId: id },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          slaDeadline: true,
          workspace: { select: { id: true, name: true, organization: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),

      // Recent audit logs for this partner's workspaces
      engagementIds.length > 0
        ? prisma.auditEvent.findMany({
            where: {
              workspace: {
                organization: {
                  engagements: {
                    some: { partnerId: id }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),
    ]);

    // Determine partner model type
    const orgIds = partner.engagements.map((e) => e.organizationId);
    const uniqueOrgIds = new Set(orgIds);
    const modelType = uniqueOrgIds.size > 1 ? 'specialist' : 'dedicated';

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
      _count: {
        members: partner.members.length,
        engagements: partner.engagements.length,
        totalRequests,
      },
      stats: {
        activeRequests,
        completedRequests,
        slaRisk: slaRiskCount,
        avgResponseTime: null, // TODO: calculate from audit logs
      },
      engagements: partner.engagements.map((e) => ({
        id: e.id,
        status: e.status,
        organization: e.organization,
        serviceScopes: e.serviceScopes.map((s) => s.serviceType),
        startedAt: e.createdAt,
      })),
      members: partner.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
      })),
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        code: r.code || 'N/A',
        title: r.title,
        status: r.status,
        priority: r.priority,
        slaDeadline: r.slaDeadline,
        workspaceName: r.workspace?.name || 'Unknown',
        organizationName: r.workspace?.organization?.name || 'Unknown',
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
  } catch (error) {
    console.error('Partner detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
