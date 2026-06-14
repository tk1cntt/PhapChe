/**
 * Admin Partner Request Detail API
 * GET /api/admin/partner/requests/[id]
 *
 * Returns single partner request details.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

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
}
