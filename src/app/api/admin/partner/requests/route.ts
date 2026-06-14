/**
 * Admin Partner Requests API
 * GET /api/admin/partner/requests
 *
 * Returns all partner requests with pagination and filters.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const partnerId = searchParams.get('partnerId');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};

  // Filter to only partner-related requests
  const partnerFilter = {
    OR: [
      { assignedPartnerId: { not: null } },
      { engagement: { partnerId: { not: null } } },
    ],
  };

  if (status) where.status = status;
  if (partnerId) where.assignedPartnerId = partnerId;

  // Search by title, description, or customer name
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { assignedPartner: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.legalRequest.findMany({
      where: {
        ...partnerFilter,
        ...where,
      },
      include: {
        assignedPartner: { select: { id: true, name: true } },
        engagement: {
          select: {
            partnerId: true,
            partner: { select: { name: true } }
          }
        },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.legalRequest.count({
      where: {
        ...partnerFilter,
        ...where,
      },
    }),
  ]);

  return NextResponse.json({
    data: requests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
