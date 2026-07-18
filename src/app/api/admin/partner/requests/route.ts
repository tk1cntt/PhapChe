/**
 * Admin Partner Requests API
 * GET /api/admin/partner/requests
 *
 * Returns all partner requests with pagination and filters.
 * Access: super_admin, coordinator_admin, specialist, reviewer (per role-config).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { ADMIN_ROUTE_GUARDS } from '@/lib/security/role-config';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAppSession(req.headers);

    const allowed = ADMIN_ROUTE_GUARDS.partner;
    if (!allowed || !session.roles.some(r => allowed.includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const status = searchParams.get('status');
    const partnerId = searchParams.get('partnerId');
    const search = searchParams.get('search');

    // Build base where clause
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (partnerId) where.assignedPartnerId = partnerId;

    // Search by title, description, or customer (createdBy) name
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { createdBy: { name: { contains: search, mode: 'insensitive' } } },
        { assignedPartner: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch more records to filter for partner-related ones in memory
    // SQLite doesn't handle OR with NOT NULL well
    const fetchLimit = 200; // Fetch up to 200 to filter

    const allRequests = await prisma.legalRequest.findMany({
      where,
      include: {
        assignedPartner: { select: { id: true, name: true } },
        engagement: {
          select: {
            partnerId: true,
            partner: { select: { name: true } }
          }
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: fetchLimit,
    });

    // Filter in-memory for partner-related requests
    const partnerRequests = allRequests.filter(
      (r) => r.assignedPartnerId || r.engagement?.partnerId
    );

    // Apply pagination
    const total = partnerRequests.length;
    const paginatedRequests = partnerRequests.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      data: paginatedRequests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Admin partner requests error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error?.message },
      { status: 500 }
    );
  }
}
