/**
 * Workspace Management API
 * GET/POST /api/admin/workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, organizationId, description } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
  }

  const workspace = await prisma.workspace.create({
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

  return NextResponse.json({ data: workspace }, { status: 201 });
}
