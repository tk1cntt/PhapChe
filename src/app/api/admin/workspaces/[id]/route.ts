/**
 * Workspace Detail/Update API
 * GET/PATCH/DELETE /api/admin/workspaces/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requireAdminSession();
  } catch (e: any) {
    return NextResponse.json({ error: e.error }, { status: e.status });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { requests: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: workspace });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requireAdminSession();
  } catch (e: any) {
    return NextResponse.json({ error: e.error }, { status: e.status });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, description, isActive, organizationId } = body;

  const updated = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(organizationId !== undefined && { organizationId }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      organizationId: true,
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

  try {
    await requireAdminSession();
  } catch (e: any) {
    return NextResponse.json({ error: e.error }, { status: e.status });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.workspace.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
