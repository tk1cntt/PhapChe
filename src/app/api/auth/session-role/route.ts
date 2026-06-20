import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ role: 'customer' });
    }

    // Fetch user's workspace memberships to determine primary role
    const memberships = await prisma.workspaceMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        role: true,
      },
    });

    if (memberships.length === 0) {
      // No workspace memberships - default to customer
      return NextResponse.json({ role: 'customer' });
    }

    // Find highest priority role
    let primaryRole = 'customer';
    let highestPriority = 0;

    for (const membership of memberships) {
      const priority = ROLE_PRIORITY[membership.role] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        primaryRole = membership.role;
      }
    }

    return NextResponse.json({ role: primaryRole });
  } catch (error) {
    console.error('Failed to fetch session role:', error);
    return NextResponse.json({ role: 'customer' });
  }
}
