/**
 * Partner Request Detail API
 * GET /api/partner/requests/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const ERROR = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ error: 'BAD_REQUEST', detail: 'Invalid request ID' }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: req.headers });
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
    function canAccessRequest(
      req: { assignedPartnerId?: string | null; engagement?: { partnerId?: string | null } | null },
      allowedIds: string[]
    ): boolean {
      const isDirectlyAssigned = req.assignedPartnerId != null && allowedIds.includes(req.assignedPartnerId);
      const isAssignedViaEngagement = req.engagement?.partnerId != null && allowedIds.includes(req.engagement.partnerId);
      return isDirectlyAssigned || isAssignedViaEngagement;
    }

    if (!canAccessRequest(request, partnerIds)) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Access denied' }, { status: 403 });
    }
      return isDirectlyAssigned || isAssignedViaEngagement;
    }

    if (!canAccessRequest(request, partnerIds)) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Access denied' }, { status: 403 });
    }
      { status: 500 }
    );
  }
}
