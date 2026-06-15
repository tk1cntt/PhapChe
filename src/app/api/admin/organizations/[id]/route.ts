/**
 * Organization Detail/Update API
 * GET/PATCH/DELETE /api/admin/organizations/[id]
 *
 * Platform admin only - queries all memberships for admin role check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'UNAUTHORIZED', detail: 'Authentication required' };
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

  return { session, userId: session.user.id, roles: userRoles };
}

// GET - Get organization detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true } },
        workspaces: {
          select: { id: true, name: true, slug: true },
          take: 10,
          orderBy: { name: 'asc' },
        },
        _count: { select: { workspaces: true } },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ data: organization });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const organization = await prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'Organization not found' }, { status: 404 });
    }

    // Cannot modify default organization
    if (organization.isDefault) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Cannot modify default organization' }, { status: 400 });
    }

    const body = await req.json();
    const { name, businessType, registrationNumber, address, contactEmail, status } = body;

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(businessType !== undefined && { businessType }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(address !== undefined && { address }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deactivate organization (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;

    const organization = await prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      return NextResponse.json({ error: 'NOT_FOUND', detail: 'Organization not found' }, { status: 404 });
    }

    if (organization.isDefault) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Cannot delete default organization' }, { status: 400 });
    }

    // Soft delete - set inactive
    await prisma.organization.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
