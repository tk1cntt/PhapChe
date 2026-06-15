/**
 * Admin Partners List API
 * GET /api/admin/partners
 *
 * Returns all partners with their request counts and engagement info.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET() {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all partners with their assignments and engagements
    const partners = await prisma.partner.findMany({
      include: {
        _count: {
          select: {
            members: true,
            engagements: true,
          },
        },
        // Get active engagements with organization info
        engagements: {
          where: { status: 'active' },
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
        // Count assigned requests
        assignedRequests: {
          where: {
            status: { notIn: ['closed', 'cancelled'] },
          },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform to include partner model type
    const transformedPartners = partners.map((partner) => {
      // Determine partner model type based on engagement pattern
      const orgIds = partner.engagements.map((e) => e.organizationId);
      const hasMultipleOrgs = new Set(orgIds).size > 1;
      const partnerType = hasMultipleOrgs ? 'specialist' : 'dedicated';

      return {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        status: partner.status,
        modelType: partnerType,
        contactEmail: partner.contactEmail,
        memberCount: partner._count.members,
        engagementCount: partner._count.engagements,
        activeEngagements: partner.engagements.map((e) => ({
          id: e.id,
          organization: e.organization,
          serviceScopes: [], // Could be populated from EngagementServiceScope
        })),
        activeRequestCount: partner.assignedRequests.length,
      };
    });

    // Separate into specialist and dedicated partners
    const specialistPartners = transformedPartners.filter((p) => p.modelType === 'specialist');
    const dedicatedPartners = transformedPartners.filter((p) => p.modelType === 'dedicated');

    return NextResponse.json({
      data: transformedPartners,
      summary: {
        total: transformedPartners.length,
        specialistCount: specialistPartners.length,
        dedicatedCount: dedicatedPartners.length,
      },
      specialistPartners,
      dedicatedPartners,
    });
  } catch (error) {
    console.error('Admin partners list error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
  }
}
