import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { getAuditEvents } from '@/lib/audit/audit-service';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
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

    const { searchParams } = request.nextUrl;

    const pageRaw = parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10);
    const pageSizeRaw = Math.min(MAX_PAGE_SIZE, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10));
    const page = Math.max(1, pageRaw || DEFAULT_PAGE);
    const pageSize = Math.max(1, pageSizeRaw || DEFAULT_PAGE_SIZE);
    const search = searchParams.get('search') || undefined;
    const action = searchParams.get('action') || undefined;
    const dateFrom = parseDateParam(searchParams.get('dateFrom'));
    const dateTo = parseDateParam(searchParams.get('dateTo'));

    const result = await getAuditEvents({
      page,
      pageSize,
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
      page,
      pageSize,
    });
      pageSize,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
