/**
 * Partner Request Detail API
 * GET /api/partner/requests/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
    }

    // Get all active partner memberships for the user
    const memberships = await prisma.partnerMember.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { partnerId: true },
    });

    if (memberships.length === 0) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Not a partner' }, { status: 403 });
    }

    const partnerIds = memberships.map(m => m.partnerId);

    const request = await prisma.legalRequest.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true, email: true } },
        assignedReviewer: { select: { id: true, name: true, email: true } },
        engagement: { select: { id: true, partnerId: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'Request not found' }, { status: 404 });
    }

    // Check permission - partner can access if assigned directly or via engagement
    const hasAccess = (request.assignedPartnerId != null && partnerIds.includes(request.assignedPartnerId)) ||
      (request.engagement?.partnerId != null && partnerIds.includes(request.engagement.partnerId));

    if (!hasAccess) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ data: request });
  } catch (error) {
    console.error('Partner request detail error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
