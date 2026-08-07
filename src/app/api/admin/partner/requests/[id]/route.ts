/**
 * Admin Partner Request Detail API
 * GET /api/admin/partner/requests/[id]
 *
 * Returns single partner request details.
 * Access: super_admin, coordinator_admin, specialist, reviewer (per role-config).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';
import { requireAppSession } from '@/lib/security/session';
import { ADMIN_ROUTE_GUARDS } from '@/lib/security/role-config';
import { isEnabled } from '@/lib/config/feature-flags';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession(req.headers);

    if (!canAccessRoute('partner', session.roles)) {
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
      ? ('matterTypeRef' in request && request.matterTypeRef && typeof request.matterTypeRef === 'object' && 'key' in request.matterTypeRef
          ? (request.matterTypeRef as { key?: string | null }).key
          : undefined) ?? request.matterType
      : request.matterType;
          : undefined) ?? request.matterType
      : request.matterType;
    const { matterType, matterTypeId, matterTypeRef: _ref, ...rest } = request as typeof request & { matterTypeRef?: unknown };
    return NextResponse.json({
      data: {
        ...rest,
        matterTypeDisplay
      }
    });
      }
    });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error fetching partner request detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: "Internal server error" },
      { status: 500 }
    );
  }
}
