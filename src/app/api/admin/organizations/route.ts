/**
 * Organization Management API
 * GET/POST /api/admin/organizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - List organizations
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  // Check if user is platform admin
  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
    ];
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { workspaces: true, users: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.organization.count({ where }),
  ]);

  return NextResponse.json({
    data: organizations,
    pagination: { total, skip, take, hasMore: skip + take < total },
  });
}

// POST - Create organization
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, tenantId, description, isActive } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Name and slug are required', field: 'name' }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Slug already exists', field: 'slug' }, { status: 400 });
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      tenantId: tenantId || null,
      description: description || null,
      isActive: isActive !== false,
      isDefault: false,
    },
  });

  return NextResponse.json({ data: organization }, { status: 201 });
}
