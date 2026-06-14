/**
 * Admin Partner Request Detail API
 * GET /api/admin/partner/requests/[id]
 *
 * Returns single partner request details.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles per schema
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
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
        customer: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: request });
  } catch (error) {
    console.error('Error fetching partner request detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
