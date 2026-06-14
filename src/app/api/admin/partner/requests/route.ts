/**
 * Admin Partner Requests API
 * GET /api/admin/partner/requests
 *
 * Returns all partner requests with pagination and filters.
 * Admin-only endpoint.
 * Platform-level admin - no workspace membership required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Valid admin roles per schema: coordinator_admin, super_admin
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET(req: NextRequest) {
  try {
    // Get session with auth() directly - platform-level admin doesn't need workspace membership
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin roles - these are platform-level roles stored in user record
    // Roles may be stored in session.user.role or session.user.roles
    const userRole = (session.user as any).role || (session.user as any).roles?.[0];
    const userRoles = (session.user as any).roles || (userRole ? [userRole] : []);
    const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
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
  } catch (error) {
    console.error('Error fetching partner requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
