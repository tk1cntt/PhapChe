/**
 * Workspace Management API
 * GET/POST /api/admin/workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'];

async function requireAdminSession() {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true },
  });

  const userRoles = memberships.map((m) => m.role).filter((r): r is string => r !== null);
  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }

  return { session, userId: session.user.id };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in GET workspaces:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const organizationId = searchParams.get('organizationId');
  const isActive = searchParams.get('isActive');
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
    ];
  }
  if (organizationId) {
    where.organizationId = organizationId;
  }
  if (isActive !== null) {
    where.isActive = isActive === 'true';
  }

  const [workspaces, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { members: true, requests: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.workspace.count({ where }),
  ]);

  return NextResponse.json({
    data: workspaces,
    pagination: { total, skip, take, hasMore: skip + take < total },
  });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in POST workspace auth:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { name, slug, organizationId, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const existing = await tx.workspace.findUnique({ where: { slug } });
      if (existing) {
        throw Object.assign(new Error('Slug already exists'), { status: 400, error: 'SLUG_EXISTS' });
      }

      return tx.workspace.create({
        data: {
          name,
          slug,
          organizationId: organizationId || null,
          description: description || null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          organizationId: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error creating workspace:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
