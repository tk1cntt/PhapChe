/**
 * Admin Partner Requests API
 * GET /api/admin/partner/requests
 *
 * Returns all partner requests with pagination and filters.
 * Admin-only endpoint.
 * Platform-level admin - queries all memberships to find admin roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Valid admin roles per schema: coordinator_admin, super_admin
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);
  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }

  return {
    session,
    userId: session.user.id,
    roles: userRoles,
    activeWorkspaceId: memberships[0]?.workspaceId,
  };
}

import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();

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
  } catch (error: any) {
    // Handle auth errors (thrown objects)
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error fetching partner requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
