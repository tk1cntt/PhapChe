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
    const role = searchParams.get('role') ?? '';

    const where: Record<string, unknown> = {};

    // Search filter on name and email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Role filter
    if (role) {
      where.memberships = {
        some: {
          role: role,
          workspaceId: session.activeWorkspaceId ?? undefined,
        },
      };
    }

    // If workspace is set, only show users in that workspace
    if (session.activeWorkspaceId) {
      where.memberships = {
        some: {
          workspaceId: session.activeWorkspaceId,
        },
      };
      if (role) {
        (where.memberships as Record<string, unknown>).role = role;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          memberships: {
            where: session.activeWorkspaceId ? { workspaceId: session.activeWorkspaceId } : undefined,
            select: { role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const dataSource = users.map((user) => ({
      key: user.id,
      name: user.name,
      email: user.email,
      role: user.memberships[0]?.role ?? 'customer',
      workspace: '-',
      status: user.isActive ? 'active' : 'inactive',
    }));

    return NextResponse.json({
      data: dataSource,
      total,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE }, { status: 200 });
  }
}
