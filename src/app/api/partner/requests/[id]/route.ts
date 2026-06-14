/**
 * Partner Request Detail API
 * GET /api/partner/requests/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Not a partner' }, { status: 403 });
  }

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
  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json({ data: request });
}
