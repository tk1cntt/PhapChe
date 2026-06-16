/**
 * User Management API
 * GET/POST /api/admin/users
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

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const workspaceId = searchParams.get('workspaceId');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (workspaceId) {
      where.memberships = { some: { workspaceId } };
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastActiveAt: true,
          memberships: {
            select: {
              id: true,
              workspaceId: true,
              role: true,
              workspace: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform users to include computed fields
    const transformedUsers = users.map((user) => {
      // Determine status: 'invited' if not verified, 'active' if active, 'inactive' otherwise
      let status: 'active' | 'invited' | 'inactive' = 'inactive';
      if (!user.emailVerified) {
        status = 'invited';
      } else if (user.isActive) {
        status = 'active';
      }

      // Get primary membership
      const primaryMembership = user.memberships?.[0];
      const primaryRole = primaryMembership?.role || 'customer';
      const primaryWorkspace = primaryMembership?.workspace?.name || '—';

      return {
        ...user,
        key: user.id,
        status,
        role: primaryRole,
        workspace: primaryWorkspace,
        lastActive: user.lastActiveAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      data: transformedUsers,
      pagination: { total, skip, take, hasMore: skip + take < total },
    });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();

    const body = await req.json();
    const { email, name, password, workspaceId, role } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Email and name are required', field: 'email' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Email already exists', field: 'email' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
        memberships: workspaceId ? {
          create: {
            workspaceId,
            role: role || 'customer',
            isActive: true,
          },
        } : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
