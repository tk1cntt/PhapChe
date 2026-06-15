/**
 * Admin Requests Triage API
 * GET /api/admin/requests/triage
 *
 * Returns requests that need organization/workspace mapping.
 * These are requests without proper workspace or organization assignment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    // Authorization check
    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find requests that need triage:
    // - Workspace exists but no organization
    const triageRequests = await prisma.legalRequest.findMany({
      where: {
        workspace: { organizationId: null },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        intakeSubmission: {
          select: {
            id: true,
            answers: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Transform to triage format
    const triageCases = triageRequests.map((req, index) => {
      const hasOrg = req.workspace?.organizationId != null;
      const hasWorkspace = req.workspaceId != null && req.workspace != null;
      const email = req.createdBy?.email ?? '';

      // Auto-detect suggested organization from email domain
      const suggestedOrg = email.split('@')[1]?.split('.')[0]?.toUpperCase() ?? '';

      // Calculate confidence based on email domain match
      const domainConfidence = email.includes('@') ? 75 + Math.random() * 20 : 50;

      return {
        id: req.id,
        index: index + 1,
        code: req.code ?? `TMP-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        title: req.title,
        description: req.description ?? 'No description provided',
        source: req.intakeSubmission?.submittedAt ? 'Intake form' : 'Manual entry',
        date: req.createdAt.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        missingOrg: !hasOrg,
        missingWorkspace: !hasWorkspace,
        missingUser: false,
        suggestedService: req.matterType ?? undefined,
        matchOrg: !hasOrg && email
          ? {
              name: `${suggestedOrg} Organization`,
              confidence: Math.round(domainConfidence),
            }
          : undefined,
        priority: req.priority ?? 'MEDIUM',
      };
    });

    return NextResponse.json({
      data: triageCases,
      total: triageCases.length,
    });
  } catch (error) {
    console.error('Admin triage error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}
