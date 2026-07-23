import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid roles per schema: all admin, specialist, reviewer roles can access request details
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

// GET /api/admin/requests/[id] - Get single request detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    // Authorization check: require admin role
    const hasAccess = session.roles?.some((role) => (ALLOWED_ROLES as readonly string[]).includes(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id },
        ],
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedSpecialist: {
          select: { id: true, name: true, email: true },
        },
        assignedReviewer: {
          select: { id: true, name: true, email: true },
        },
        documents: {
          include: {
            documentVersions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        workflowTransitions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        intakeSubmission: {
          select: { matterTypeKey: true },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(legalRequest);
  } catch (error) {
    console.error('Admin request detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
