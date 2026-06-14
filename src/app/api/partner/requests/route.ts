/**
 * Partner Requests List API
 * GET /api/partner/requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);

  // Get partner engagement IDs
  const engagements = await prisma.engagement.findMany({
    where: { partnerId: member.partnerId, status: 'active' },
    select: { id: true },
  });
  const engagementIds = engagements.map(e => e.id);

  const where: Record<string, unknown> = {
    OR: [
      { assignedPartnerId: member.partnerId },
      ...(engagementIds.length > 0 ? [{ engagementId: { in: engagementIds } }] : []),
    ],
  };
  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.legalRequest.findMany({
      where,
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.legalRequest.count({ where }),
  ]);

  return NextResponse.json({
    data: requests,
    pagination: { total, skip, take, hasMore: skip + take < total },
  });
}
