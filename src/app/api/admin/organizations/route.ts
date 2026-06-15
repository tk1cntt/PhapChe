/**
 * Organization Management API
 * GET/POST /api/admin/organizations
 *
 * Platform admin only - queries all memberships for admin role check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'UNAUTHORIZED', detail: 'Authentication required' };
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
    throw { status: 403, error: 'FORBIDDEN', detail: 'Admin access required' };
  }

  return { session, userId: session.user.id, roles: userRoles };
}

// GET - List organizations
export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessType: { contains: search } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true } },
          _count: { select: { workspaces: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      data: organizations,
      pagination: { total, skip, take, hasMore: skip + take < total },
    });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create organization
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();

    const body = await req.json();
    const { name, tenantId, businessType, registrationNumber, address, contactEmail, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Name is required', field: 'name' }, { status: 400 });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        tenantId: tenantId || 'platform-tenant',
        businessType: businessType || null,
        registrationNumber: registrationNumber || null,
        address: address || null,
        contactEmail: contactEmail || null,
        status: status || 'active',
        isDefault: false,
      },
    });

    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
