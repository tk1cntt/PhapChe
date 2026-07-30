/**
 * Workspace Detail/Update API
 * GET/PATCH/DELETE /api/admin/workspaces/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'];

async function requireAdminSession(workspaceId: string) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Verify admin membership in the SPECIFIC workspace, not just any workspace
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.user.id,
      workspaceId,
      isActive: true,
      role: { in: ADMIN_ROLES },
    },
    select: { role: true },
  });

  if (!membership) {
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
    await requireAdminSession(id);
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in GET workspace:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    await requireAdminSession(id);
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in PATCH workspace:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    await requireAdminSession(id);
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in DELETE workspace:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
