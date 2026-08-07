/**
 * Partner Dashboard API
 * GET /api/partner/dashboard
 *
 * Returns partner dashboard data including:
 * - Partner info
 * - Active engagements
 * - Assigned requests count
 * - Recent activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function getPartnerMember(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { partner: true },
  });

  if (!member) {
    return NextResponse.json(
      { error: 'FORBIDDEN', detail: 'Not a partner member' },
      { status: 403 }
    );
  }

  return member;
}

async function fetchDashboardData(partnerId: string) {
  const [engagements, assignedRequestsCount, pendingAssignments] =
    await Promise.all([
      prisma.engagement.findMany({
        where: { partnerId, status: 'active' },
        include: {
          organization: { select: { id: true, name: true } },
          serviceScopes: {
            include: {
              serviceType: { select: { id: true, key: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.legalRequest.count({
        where: { assignedPartnerId: partnerId },
      }),
      prisma.requestAssignment.count({
        where: { partnerId },
      }),
    ]);

  return { engagements, assignedRequestsCount, pendingAssignments };
}

function shapeDashboardResponse(
  member: Awaited<ReturnType<typeof getPartnerMember>> & {},
  data: Awaited<ReturnType<typeof fetchDashboardData>>
) {
  return {
    partner: {
      id: member.partner.id,
      name: member.partner.name,
      type: member.partner.type,
    },
    role: member.role,
    stats: {
      activeEngagements: data.engagements.length,
      assignedRequests: data.assignedRequestsCount,
      pendingAssignments: data.pendingAssignments,
    },
    engagements: data.engagements.map((e) => ({
      id: e.id,
      organization: e.organization,
      status: e.status,
      serviceTypes: e.serviceScopes.map((s) => ({
        id: s.serviceType.id,
        key: s.serviceType.key,
        name: s.serviceType.name,
        permissionLevel: s.permissionLevel,
      })),
      startDate: e.startDate,
      endDate: e.endDate,
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const member = await getPartnerMember(req);
    // If getPartnerMember returned a NextResponse (error), propagate it
    if (member instanceof NextResponse) return member;

    const data = await fetchDashboardData(member.partnerId);

    return NextResponse.json({
      data: shapeDashboardResponse(member, data),
    });
  } catch (error) {
    console.error('Partner dashboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
  } catch (error) {
    console.error('Partner dashboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
