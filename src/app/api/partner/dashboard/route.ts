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

export async function GET(req: NextRequest) {
  // 1. Get session
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 2. Get partner membership
  const member = await prisma.partnerMember.findFirst({
    where: { userId, isActive: true },
    include: {
      partner: true,
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: 'FORBIDDEN', detail: 'Not a partner member' },
      { status: 403 }
    );
  }

  // 3. Get active engagements
  const engagements = await prisma.engagement.findMany({
    where: {
      partnerId: member.partnerId,
      status: 'active',
    },
    include: {
      organization: {
        select: { id: true, name: true },
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
  });

  // 4. Get assigned requests count
  const assignedRequestsCount = await prisma.legalRequest.count({
    where: {
      assignedPartnerId: member.partnerId,
    },
  });

  // 5. Get pending assignments
  const pendingAssignments = await prisma.requestAssignment.count({
    where: {
      partnerId: member.partnerId,
    },
  });

  return NextResponse.json({
    data: {
      partner: {
        id: member.partner.id,
        name: member.partner.name,
        type: member.partner.type,
      },
      role: member.role,
      stats: {
        activeEngagements: engagements.length,
        assignedRequests: assignedRequestsCount,
        pendingAssignments,
      },
      engagements: engagements.map((e) => ({
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
    },
  });
}
