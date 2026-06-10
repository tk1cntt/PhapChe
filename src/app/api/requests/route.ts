import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Mitigate T-25-01: Enforce max pageSize
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10));
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';

    const where: Record<string, unknown> = {};

    // Search filter (case-insensitive via LIKE in SQLite)
    if (search) {
      where.title = { contains: search };
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Admin sees all requests in their workspace
    if (session.activeWorkspaceId) {
      where.workspaceId = session.activeWorkspaceId;
    }

    const [requests, total] = await Promise.all([
      prisma.legalRequest.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          workspace: { select: { name: true } },
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.legalRequest.count({ where }),
    ]);

    const data = requests.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      workspaceName: r.workspace.name,
      customerName: r.createdBy.name,
      customerEmail: r.createdBy.email,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE }, { status: 200 });
  }
}
