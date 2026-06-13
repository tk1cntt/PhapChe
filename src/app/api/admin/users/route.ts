import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const ROLE_PRIORITY: Record<string, number> = {
  'super_admin': 1,
  'audit_admin': 2,
  'coordinator_admin': 3,
  'reviewer': 4,
  'specialist': 5,
  'customer': 6,
};

// GET /api/admin/users - List users with pagination, search, filters
export async function GET(request: NextRequest) {
  try {
    await requireAppSession();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    const search = searchParams.get('search') ?? '';
    const roleFilter = searchParams.get('filter_role');
    const workspaceFilter = searchParams.get('filter_workspace');

    // Build where clause
    const where: Record<string, unknown> = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        } : {},
        roleFilter ? {
          memberships: { some: { role: roleFilter } },
        } : {},
        workspaceFilter ? {
          memberships: { some: { workspaceId: workspaceFilter } },
        } : {},
      ],
    };

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          memberships: {
            include: {
              workspace: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform users with primary role calculation
    const transformedUsers = users.map((user) => {
      // Get primary role (highest priority)
      const primaryMembership = user.memberships.reduce((best, m) => {
        const currentPriority = ROLE_PRIORITY[m.role] ?? 99;
        const bestPriority = ROLE_PRIORITY[best?.role ?? ''] ?? 99;
        return currentPriority < bestPriority ? m : best;
      }, user.memberships[0]);

      // Determine status
      let status: 'active' | 'invited' | 'inactive' = 'inactive';
      if (user.isActive && user.emailVerified) {
        status = 'active';
      } else if (!user.emailVerified) {
        status = 'invited';
      }

      return {
        id: user.id,
        key: user.id,
        name: user.name,
        email: user.email,
        role: primaryMembership?.role ?? 'customer',
        workspace: primaryMembership?.workspace?.name ?? '—',
        workspaceId: primaryMembership?.workspace?.id ?? null,
        status,
        lastActive: user.lastActiveAt?.toISOString() ?? null,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      data: transformedUsers,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAppSession();

    const body = await request.json();
    const { email, name, phone, timezone, locale } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Get default workspace (first active workspace or create one)
    let defaultWorkspace = await prisma.workspace.findFirst({
      where: { isActive: true },
    });

    if (!defaultWorkspace) {
      // Create default workspace if none exists
      defaultWorkspace = await prisma.workspace.create({
        data: {
          name: 'Default Workspace',
          slug: 'default-workspace',
          isActive: true,
        },
      });
    }

    // Create user with workspace membership
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        phone: phone ?? null,
        timezone: timezone ?? 'Asia/Ho_Chi_Minh',
        locale: locale ?? 'vi',
        emailVerified: false,
        isActive: true,
        memberships: {
          create: {
            workspaceId: defaultWorkspace.id,
            role: 'customer',
            isActive: true,
          },
        },
      },
      include: {
        memberships: {
          include: {
            workspace: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        timezone: user.timezone,
        locale: user.locale,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin user create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
