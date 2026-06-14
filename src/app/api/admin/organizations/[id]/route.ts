/**
 * Organization Detail/Update API
 * GET/PATCH/DELETE /api/admin/organizations/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get organization detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true } },
      workspaces: {
        select: { id: true, name: true, slug: true },
        take: 10,
        orderBy: { name: 'asc' },
      },
      _count: { select: { workspaces: true, users: true } },
    },
  });

  if (!organization) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: organization });
}

// PATCH - Update organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Cannot modify default organization
  if (organization.isDefault) {
    return NextResponse.json({ error: 'Cannot modify default organization' }, { status: 400 });
  }

  const body = await req.json();
  const { name, description, isActive, tenantId } = body;

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(tenantId !== undefined && { tenantId }),
    },
  });

  return NextResponse.json({ data: updated });
}

// DELETE - Deactivate organization (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (organization.isDefault) {
    return NextResponse.json({ error: 'Cannot delete default organization' }, { status: 400 });
  }

  // Soft delete - set inactive
  await prisma.organization.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
