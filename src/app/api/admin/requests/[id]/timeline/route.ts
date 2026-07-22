/**
 * Request Timeline API
 * GET /api/admin/requests/[id]/timeline
 *
 * Aggregates all traceability events for a request into a unified timeline:
 * - Status changes (WorkflowTransition)
 * - Assignment history (RequestAssignment)
 * - Audit events (AuditEvent)
 *
 * Returns chronological timeline + current assignments.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

// ── Types ──────────────────────────────────────────────────────

interface TimelineActor {
  id: string;
  name: string;
}

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'assignment' | 'audit';
  ts: string;
  actor: TimelineActor | null;
  detail: string;
  note: string | null;
  extra: Record<string, unknown>;
}

interface TimelineResponse {
  timeline: TimelineEvent[];
  current: {
    specialist: TimelineActor | null;
    reviewer: TimelineActor | null;
  };
}

// ── Helpers ────────────────────────────────────────────────────

function buildAssignmentDetail(kind: string, userName: string | null, assignedByName: string | null): string {
  const roleLabel = kind === 'specialist' ? 'Chuyên viên' : 'Người kiểm duyệt';
  const name = userName ?? '—';
  const by = assignedByName ? ` bởi ${assignedByName}` : '';
  return `Phân công ${roleLabel}: ${name}${by}`;
}

// ── GET /api/admin/requests/[id]/timeline ──────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();

    const hasAccess = session.roles?.some((r) => (ALLOWED_ROLES as readonly string[]).includes(r));
    if (!hasAccess) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;

    // Verify request exists
    const legalRequest = await prisma.legalRequest.findFirst({
      where: { OR: [{ id }, { code: id }] },
      select: {
        id: true,
        workspaceId: true,
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    const requestId = legalRequest.id;

    // ── Query 3 sources in parallel ──
    const [transitions, assignments, audits] = await Promise.all([
      prisma.workflowTransition.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),
      prisma.requestAssignment.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.auditEvent.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true } },
        },
      }),
    ]);

    // ── Build unified timeline ──
    const timeline: TimelineEvent[] = [];

    for (const t of transitions) {
      timeline.push({
        id: `tr_${t.id}`,
        type: 'status_change',
        ts: t.createdAt.toISOString(),
        actor: t.actor ? { id: t.actor.id, name: t.actor.name } : null,
        detail: `${t.fromStatus} → ${t.toStatus}`,
        note: t.reason ?? null,
        extra: { fromStatus: t.fromStatus, toStatus: t.toStatus },
      });
    }

    for (const a of assignments) {
      timeline.push({
        id: `as_${a.id}`,
        type: 'assignment',
        ts: a.createdAt.toISOString(),
        actor: a.createdBy ? { id: a.createdBy.id, name: a.createdBy.name } : null,
        detail: buildAssignmentDetail(a.kind, a.user?.name ?? null, a.createdBy?.name ?? null),
        note: a.reason ?? null,
        extra: { kind: a.kind, userId: a.userId, isCurrent: a.isCurrent },
      });
    }

    for (const evt of audits) {
      timeline.push({
        id: `au_${evt.id}`,
        type: 'audit',
        ts: evt.createdAt.toISOString(),
        actor: evt.actor ? { id: evt.actor.id, name: evt.actor.name } : null,
        detail: evt.action,
        note: evt.metadataSummary ?? null,
        extra: { targetType: evt.targetType, correlationId: evt.correlationId },
      });
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => b.ts.localeCompare(a.ts));

    // ── Current assignments ──
    const current: TimelineResponse['current'] = {
      specialist: legalRequest.assignedSpecialist
        ? { id: legalRequest.assignedSpecialist.id, name: legalRequest.assignedSpecialist.name }
        : null,
      reviewer: legalRequest.assignedReviewer
        ? { id: legalRequest.assignedReviewer.id, name: legalRequest.assignedReviewer.name }
        : null,
    };

    const response: TimelineResponse = { timeline, current };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Request timeline error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
