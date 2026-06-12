import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRoutingSuggestions, listRoutingCapabilities, listRoutingMatterTypes, requireRoutingAdmin } from '@/lib/routing/routing-service';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();
    const workspaceId = session.activeWorkspaceId || '';
    await requireRoutingAdmin(workspaceId, session.userId);

    const [requests, matterTypes, capabilities, members] = await Promise.all([
      prisma.legalRequest.findMany({
        where: { workspaceId, status: { in: ['intake_submitted', 'triage', 'assigned'] } },
        select: {
          id: true,
          title: true,
          status: true,
          createdBy: { select: { name: true, email: true } },
          assignedSpecialist: { select: { name: true, email: true } },
          assignedReviewer: { select: { name: true, email: true } },
          intakeSubmission: { select: { matterTypeKey: true, matterType: { select: { label: true } } } },
        },
        orderBy: [{ updatedAt: 'desc' }],
      }),
      listRoutingMatterTypes(workspaceId),
      listRoutingCapabilities(workspaceId),
      prisma.workspaceMembership.findMany({
        where: { workspaceId, role: { in: ['specialist', 'reviewer'] }, isActive: true, user: { isActive: true } },
        select: { userId: true, role: true, user: { select: { name: true, email: true } } },
        orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
      }),
    ]);

    const suggestionRows = await Promise.all(
      requests.map((request) =>
        getRoutingSuggestions({ requestId: request.id, workspaceId }).catch(() => ({ specialists: [], reviewers: [] }))
      )
    );

    return NextResponse.json({ requests, matterTypes, capabilities, members, suggestionRows });
  } catch {
    return NextResponse.json({ requests: [], matterTypes: [], capabilities: [], members: [], suggestionRows: [] });
  }
}
