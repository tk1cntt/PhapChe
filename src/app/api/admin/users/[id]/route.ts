/**
 * User Detail/Update API
 * GET/PATCH/DELETE /api/admin/users/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      memberships: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
      _count: { select: { requests: true, comments: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'NOT_FOUND', detail: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'NOT_FOUND', detail: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, role, isActive } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Platform admin access required' }, { status: 403 });
  }

  if (session.user.id === id) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Cannot delete yourself' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'NOT_FOUND', detail: 'User not found' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
