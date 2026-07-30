/**
 * Admin Request Status Transition API
 * PATCH /api/admin/requests/[id]/status
 *
 * Allows coordinator/super_admin to transition request status.
 * Uses the central workflow engine (request-workflow.ts) for validation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { REQUEST_STATUS } from '@/lib/types';
import type { RequestStatus } from '@/lib/types';

const VALID_STATUSES = Object.values(REQUEST_STATUS);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();
    const { id } = await params;

    // Check admin roles for status transitions
    const isAdmin = session.roles?.some((r) => r === 'super_admin' || r === 'coordinator_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const { status, note } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', detail: `Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const correlationId = `admin-status-${id}-${Date.now()}`;

    const result = await transitionRequestStatus({
      requestId: id,
      actorId: session.userId,
      toStatus: status as RequestStatus,
      reason: note ?? null,
      correlationId,
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    const knownErrors: Record<string, number> = {
      REQUEST_NOT_FOUND: 404,
      INVALID_REQUEST_TRANSITION: 400,
      FORBIDDEN: 403,
      REQUEST_STATUS_CONFLICT: 409,
    };
    const code = error?.message && knownErrors[error.message];
    if (code) {
      return NextResponse.json({ error: error.message, detail: error.message }, { status: code });
    }
    console.error('Admin status transition error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
