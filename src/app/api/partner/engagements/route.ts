/**
 * Partner Engagements API
 * GET /api/partner/engagements
 *
 * Returns list of partner's engagements with details
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
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json(
      { error: 'FORBIDDEN', detail: 'Not a partner member' },
      { status: 403 }
    );
  }

  // 3. Get query params
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '10', 10);

  // 4. Get engagements
  const where = {
    partnerId: member.partnerId,
    ...(status !== 'all' ? { status } : {}),
  };

  const [engagements, total] = await Promise.all([
    prisma.engagement.findMany({
      where,
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
      skip,
      take,
    }),
    prisma.engagement.count({ where }),
  ]);

  return NextResponse.json({
    data: engagements.map((e) => ({
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
      notes: e.notes,
    })),
    pagination: {
      total,
      skip,
      take,
      hasMore: skip + take < total,
    },
  });
}
