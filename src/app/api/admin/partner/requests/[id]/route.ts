/**
 * Admin Partner Request Detail API
 * GET /api/admin/partner/requests/[id]
 *
 * Returns single partner request details.
 * Admin-only endpoint.
 * Platform-level admin - queries all memberships to find admin roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isEnabled } from '@/lib/config/feature-flags';

// Valid admin roles per schema
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
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
    throw { status: 403, error: 'Forbidden' };
  }

  return {
    session,
    userId: session.user.id,
    roles: userRoles,
    activeWorkspaceId: memberships[0]?.workspaceId,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();

    const { id } = await params;

    const request = await prisma.legalRequest.findUnique({
      where: { id },
      include: {
        assignedPartner: { select: { id: true, name: true } },
        engagement: {
          include: {
            partner: { select: { name: true } }
          }
        },
        createdBy: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
        // Include matterTypeRef for new FK-based approach
        ...(isEnabled('DB_MIGRATION_PHASE4') ? {
          matterTypeRef: {
            select: { id: true, key: true, label_vi: true, label_en: true },
          },
        } : {}),
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    // Transform matterTypeDisplay
    const matterTypeDisplay = isEnabled('DB_MIGRATION_PHASE4')
      ? (request as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.label_vi
        || (request as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.label_en
        || (request as { matterTypeRef?: { label_vi?: string | null; label_en?: string | null; key?: string | null } | null }).matterTypeRef?.key
        || request.matterType
      : request.matterType;

    return NextResponse.json({
      data: {
        ...request,
        matterTypeDisplay
      }
    });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error fetching partner request detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error?.message },
      { status: 500 }
    );
  }
}
