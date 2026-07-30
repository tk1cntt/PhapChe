/**
 * Partner Members API
 * GET /api/partner/members - List all members of partner organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { partnerAuthService } from '@/lib/services/partner-auth-service';

// Valid partner roles for filter validation
const VALID_ROLES = ['admin', 'specialist', 'viewer'];

export async function GET(req: NextRequest) {
  try {
    // Get session from request headers (better-auth reads from cookie)
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner context with deterministic ordering
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Validate role filter if provided
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 });
    }

    // Compute isActive filter
    let isActive: boolean | undefined;
    if (status === 'active') {
      isActive = true;
    } else if (status === 'inactive') {
      isActive = false;
    }

    // Get all members
    const members = await partnerAuthService.getPartnerMembers(member.partnerId, {
      role: role || undefined,
      isActive,
    });

    return NextResponse.json({
      success: true,
      data: members.map(m => ({
        id: m.id,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: (m.user as any).avatarUrl ?? null,
        },
        role: m.role,
        isActive: m.isActive,
        joinedAt: m.createdAt,
      })),
      total: members.length,
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Failed to get members' }, { status: 500 });
  }
}
