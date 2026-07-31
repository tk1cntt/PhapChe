/**
 * Partner Requests List API
 * GET /api/partner/requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
    }

    // Query all partners the user belongs to
    const members = await prisma.partnerMember.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { partnerId: true },
    });

    if (!members.length) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Not a partner' }, { status: 403 });
    }

    const partnerIds = members.map(m => m.partnerId);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10));
    const take = Math.max(1, Math.min(parseInt(searchParams.get('take') || '20', 10), 100));

    // Get partner engagement IDs
    const engagements = await prisma.engagement.findMany({
      where: { partnerId: { in: partnerIds }, status: 'active' },
      select: { id: true },
    });
    const engagementIds = engagements.map(e => e.id);

    const where: Record<string, unknown> = {
      OR: [
        { assignedPartnerId: { in: partnerIds } },
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
  } catch (error) {
    console.error('Partner requests error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
