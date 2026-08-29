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
import { isStructuredError } from '@/lib/errors';
import { hashPassword } from '@better-auth/utils/password';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

// Valid membership roles for creation
const VALID_ROLES = [...ADMIN_ROLES, 'customer', 'member', 'specialist', 'reviewer', 'audit_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'UNAUTHORIZED', detail: 'Authentication required' };
  }

  // Verify user account is active
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });
  if (!user?.isActive) {
    throw { status: 403, error: 'FORBIDDEN', detail: 'User account is deactivated' };
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

  // For non-super_admin roles, determine accessible workspace IDs for scoping
  const workspaceIds = memberships
    .filter((m) => m.role && ADMIN_ROLES.includes(m.role as any))
    .map((m) => m.workspaceId);

  return { session, userId: session.user.id, roles: userRoles, workspaceIds };
}

export async function GET(req: NextRequest) {
  try {
    const { userId, roles: userRoles, workspaceIds } = await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const workspaceId = searchParams.get('workspaceId');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const rawSkip = parseInt(searchParams.get('skip') || '0', 10);
    const rawTake = parseInt(searchParams.get('take') || '20', 10);
    const skip = Number.isFinite(rawSkip) ? Math.max(0, rawSkip) : 0;
    const take = Number.isFinite(rawTake) ? Math.min(100, Math.max(1, rawTake)) : 20;

    const where: Record<string, unknown> = {};

    if (search) {
      // Normalize search to lowercase for case-insensitive matching.
      // NOTE: Prisma `mode: 'insensitive'` is Postgres-only and throws
      // PrismaClientValidationError on SQLite (the runtime DB, see src/auth.ts).
      // SQLite LIKE is ASCII-case-insensitive by default; lowercasing the needle
      // additionally fixes Vietnamese uppercase diacritics (e.g. "NGUYỄN" -> "nguyễn").
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { email: { contains: searchLower } },
      ];
    }

    if (workspaceId) {
      where.memberships = { some: { workspaceId } };
    }

    if (role) {
      where.memberships = {
        ...(where.memberships as object),
        some: {
          ...(where.memberships ? (where.memberships as any).some : {}),
          role,
        },
      };
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // For non-super_admin, scope users to those in the admin's accessible workspaces
    const isSuperAdmin = userRoles.includes('super_admin');
    if (!isSuperAdmin && workspaceIds.length > 0) {
      where.memberships = {
        ...(where.memberships as object),
        some: {
          ...(where.memberships ? (where.memberships as any).some : {}),
          workspaceId: { in: workspaceIds },
        },
      };
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
  } catch (error: unknown) {
    if (isStructuredError(error)) {
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

    // Normalize email (lowercase + trim) BEFORE uniqueness check + create
    // so admin-created users can never create case-collisions with signup.
    const normalizedEmail = String(email).toLowerCase().trim();

    // Validate role against allowed values
    const safeRole = role && (VALID_ROLES as readonly string[]).includes(role) ? role : 'customer';

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Email already exists', field: 'email' }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          name,
          emailVerified: true,
          memberships: workspaceId ? {
            create: {
              workspaceId,
              role: safeRole,
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

      // When a password is provided, create the credential Account with a
      // BetterAuth-compatible scrypt hash (accountId=email, providerId='credential')
      // so the user can actually log in. Same format as prisma/seed.ts.
      // NEVER log the password.
      if (password) {
        const hashedPassword = await hashPassword(password);
        await tx.account.create({
          data: {
            userId: created.id,
            accountId: normalizedEmail,
            providerId: 'credential',
            password: hashedPassword,
          },
        });
      }

      return created;
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    // Unique constraint violation (race between check and create) — map to 400
    if (typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Email already exists', field: 'email' }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
