/**
 * Partner Permissions Middleware
 * Role-based access control for partner operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PARTNER_PERMISSIONS, hasPermission as checkPermission } from '@/lib/services/partner-auth-service';

/**
 * Partner permission types
 */
export type PartnerRole = 'admin' | 'specialist' | 'viewer';
export type PartnerPermission =
  | 'manage_members'
  | 'manage_engagements'
  | 'view_requests'
  | 'manage_requests'
  | 'view_documents'
  | 'manage_documents';

/**
 * Get partner context for a request
 */
export async function getPartnerContext(userId: string) {
  const member = await prisma.partnerMember.findFirst({
    where: {
      userId,
      isActive: true,
      partner: { status: 'active' },
    },
    include: { partner: true },
  });

  if (!member) return null;

  return {
    memberId: member.id,
    partnerId: member.partnerId,
    role: member.role as PartnerRole,
    partner: member.partner,
  };
}

/**
 * Middleware factory for requiring partner authentication
 */
export function requirePartner(options: { required?: boolean } = {}) {
  return async (req: NextRequest & { partnerContext?: Awaited<ReturnType<typeof getPartnerContext>> }) => {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      if (options.required) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      return null;
    }

    const context = await getPartnerContext(userId);
    if (!context && options.required) {
      return NextResponse.json({ error: 'Partner membership required' }, { status: 403 });
    }

    req.partnerContext = context;
    return context;
  };
}

/**
 * Middleware factory for requiring a specific partner role
 */
export function requirePartnerRole(...allowedRoles: PartnerRole[]) {
  return async (req: NextRequest & { partnerContext?: Awaited<ReturnType<typeof getPartnerContext>> }) => {
    const context = await requirePartner({ required: true })(req);
    if (!context) return context;

    if (!allowedRoles.includes(context.role)) {
      return NextResponse.json(
        { error: `Access denied. Required roles: ${allowedRoles.join(', ')}` },
        { status: 403 }
      );
    }

    req.partnerContext = context;
    return context;
  };
}

/**
 * Middleware factory for requiring a specific partner permission
 */
export function requirePartnerPermission(permission: PartnerPermission) {
  return async (req: NextRequest & { partnerContext?: Awaited<ReturnType<typeof getPartnerContext>> }) => {
    const context = await requirePartner({ required: true })(req);
    if (!context) return context;

    if (!checkPermission(context.role, permission)) {
      return NextResponse.json(
        { error: `Access denied. Required permission: ${permission}` },
        { status: 403 }
      );
    }

    req.partnerContext = context;
    return context;
  };
}

/**
 * Check if a role has a specific permission (exported for use in route handlers)
 */
export { checkPermission as hasPermission };
