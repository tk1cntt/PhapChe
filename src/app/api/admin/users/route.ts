/**
 * User Management API
 * GET/POST /api/admin/users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const organizationId = searchParams.get('organizationId');
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
  if (organizationId) {
    where.memberships = { some: { organizationId } };
  }
  if (role) {
    where.role = role;
  }
  if (isActive !== null) {
    where.isActive = isActive === 'true';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            organizationId: true,
            organization: { select: { id: true, name: true } },
          },
        },
        _count: { select: { requests: true, comments: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users,
    pagination: { total, skip, take, hasMore: skip + take < total },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, password, role, organizationId } = body;

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
      role: role || 'user',
      isActive: true,
      password: password || null,
      memberships: organizationId ? {
        create: { organizationId, role: 'member' },
      } : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
