/**
 * Admin Partner Request Detail API
 * GET /api/admin/partner/requests/[id]
 *
 * Returns single partner request details.
 * Access: super_admin, coordinator_admin, specialist, reviewer (per role-config).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { ADMIN_ROUTE_GUARDS } from '@/lib/security/role-config';
import { isEnabled } from '@/lib/config/feature-flags';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession(req.headers);

    const allowed = ADMIN_ROUTE_GUARDS.partner;
    if (!allowed || !session.roles.some(r => allowed.includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const request = await prisma.legalRequest.findUnique({
      where: { id },
      include: {
        assignedPartner: { select: { id: true, name: true } },
        engagement: {
          include: {
            partner: { select: { name: true } }
          }
        },
        createdBy: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
        // Include matterTypeRef for new FK-based approach
        ...(isEnabled('DB_MIGRATION_PHASE4') ? {
          matterTypeRef: {
            select: { id: true, key: true },
          },
        } : {}),
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    // Matter type key (clients translate)
    const matterTypeDisplay = isEnabled('DB_MIGRATION_PHASE4')
      ? (request as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key ?? request.matterType
      : request.matterType;

    return NextResponse.json({
      data: {
        ...request,
        matterTypeDisplay
      }
    });
  } catch (error: any) {
    if (error?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error fetching partner request detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error?.message },
      { status: 500 }
    );
  }
}
