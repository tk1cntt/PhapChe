import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Role priority map for determining primary role
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 80,
  audit_admin: 70,
  reviewer: 60,
  specialist: 50,
  customer: 10,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    // Fetch user's workspace memberships to determine roles
    const memberships = await prisma.workspaceMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        role: true,
        workspaceId: true,
      },
    });

    if (memberships.length === 0) {
      return NextResponse.json({ role: 'customer', roles: {} });
    }

    // Optional: workspaceId query param for workspace-scoped role
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (workspaceId) {
      // Return role scoped to the requested workspace
      const membership = memberships.find((m) => m.workspaceId === workspaceId);
      return NextResponse.json({
        role: membership?.role ?? 'customer',
        workspaceId,
      });
    }

    // Return per-workspace role map so clients can look up correct role
    // for the current workspace context
    const roles: Record<string, string> = {};
    for (const m of memberships) {
      roles[m.workspaceId] = m.role ?? 'customer';
    }

    // Also compute primary (highest-priority) role across all workspaces
    let primaryRole = 'customer';
    let highestPriority = 0;

    for (const membership of memberships) {
      const role = membership.role ?? 'customer';
      const priority = ROLE_PRIORITY[role];
      // If role is not in priority map, assign a default low priority
      const effectivePriority = priority !== undefined ? priority : 5;
      if (effectivePriority > highestPriority) {
        highestPriority = effectivePriority;
        primaryRole = role;
      }
    }

    return NextResponse.json({ role: primaryRole, roles });
  } catch (error) {
    console.error('Failed to fetch session role:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
