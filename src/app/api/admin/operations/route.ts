import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { getOpsAggregate, OpsAggregateDto } from '@/lib/ops/ops-service';
import type { RequestStatus } from '@/lib/types';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
const VALID_STATUSES: RequestStatus[] = [
  'draft_intake', 'intake_submitted', 'triage', 'assigned', 'in_progress',
  'pending_review', 'revision_required', 'approved', 'delivered', 'closed', 'cancelled',
];

/** Safely parse date string, returning undefined for invalid dates */
function parseDateParam(s: string | null): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    console.log('[API /operations] page:', page, 'pageSize:', pageSize, 'params:', searchParams.toString());

    const filters = {
      workspaceId: searchParams.get('workspaceId') || undefined,
      matterTypeKey: searchParams.get('matterTypeKey') || undefined,
      status: rawStatus && VALID_STATUSES.includes(rawStatus as RequestStatus) ? (rawStatus as RequestStatus) : undefined,
      assignedSpecialistId: searchParams.get('assignedSpecialistId') || undefined,
      assignedReviewerId: searchParams.get('assignedReviewerId') || undefined,
      dateFrom: parseDateParam(searchParams.get('dateFrom')),
      dateTo: parseDateParam(searchParams.get('dateTo')),
      search: searchParams.get('search') || undefined,
      page,
      pageSize,
    };

    const data = await getOpsAggregate(session, filters);
    return NextResponse.json(data as OpsAggregateDto);
  } catch (error) {
    console.error('[GET /api/admin/operations]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
