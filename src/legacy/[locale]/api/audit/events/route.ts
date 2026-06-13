// This file re-exports from the root legacy API
// Actual implementation is in src/legacy/api/audit/events/route.ts
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextResponse, type NextRequest } from 'next/server';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10));
    const search = searchParams.get('search') ?? '';
    const action = searchParams.get('action') ?? '';

    const where: Record<string, unknown> = {};
    if (session.activeWorkspaceId) {
      where.workspaceId = session.activeWorkspaceId;
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { metadataSummary: { contains: search } },
      ];
    }
    if (action) {
      where.action = action;
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        select: {
          id: true,
          actorId: true,
          workspaceId: true,
          action: true,
          targetType: true,
          targetId: true,
          correlationId: true,
          metadataSummary: true,
          createdAt: true,
          actor: { select: { email: true, name: true } },
          workspace: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return NextResponse.json({ data: events, total, page, pageSize });
  } catch {
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE }, { status: 200 });
  }
}
