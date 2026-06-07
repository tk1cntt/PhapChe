import { NextResponse } from 'next/server';
import { getOpsDashboard, parseOpsFilters } from '@/lib/ops/ops-service';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: Request) {
  try {
    const session = await requireAppSession();
    const { searchParams } = new URL(request.url);
    const filters = parseOpsFilters({
      workspaceId: searchParams.get('workspaceId') ?? undefined,
      matterTypeKey: searchParams.get('matterTypeKey') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    const dashboard = await getOpsDashboard(session, filters);

    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({ total: 0, requests: [], workload: [], byStatus: [] });
  }
}
