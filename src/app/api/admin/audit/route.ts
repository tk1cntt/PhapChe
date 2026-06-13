import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { getAuditEvents } from '@/lib/audit/audit-service';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/** Safely parse date string, returning undefined for invalid dates */
function parseDateParam(s: string | null): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : s;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '10', 10));
    const search = searchParams.get('search') || undefined;
    const action = searchParams.get('action') || undefined;
    const dateFrom = parseDateParam(searchParams.get('dateFrom'));
    const dateTo = parseDateParam(searchParams.get('dateTo'));

    const result = await getAuditEvents({
      page: Math.max(1, page || 1),
      pageSize: Math.max(1, pageSize || 10),
      search,
      action,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      data: result.data.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
      total: result.total,
      page: Math.max(1, page || 1),
      pageSize: Math.max(1, pageSize || 10),
    });
  } catch (error) {
    console.error('[GET /api/admin/audit]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
