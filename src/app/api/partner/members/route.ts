/**
 * Partner Members API
 * GET /api/partner/members - List all members of partner organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { partnerAuthService } from '@/lib/services/partner-auth-service';

export async function GET(req: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: new Headers({ 'x-user-id': req.headers.get('x-user-id') || '' }),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner context
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const isActive = status === 'inactive' ? false : status === 'active' ? true : undefined;

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
          avatarUrl: m.user.avatarUrl,
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
