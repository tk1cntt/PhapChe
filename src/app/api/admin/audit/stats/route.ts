import { NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { getAuditStats } from '@/lib/audit/audit-service';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET() {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await getAuditStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[GET /api/admin/audit/stats]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
