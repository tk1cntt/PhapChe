/**
 * Partner Invite Management API
 * DELETE /api/partner/invite/[id] - Revoke invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { partnerInviteService } from '@/lib/services/partner-invite-service';
import { hasPermission } from '@/lib/services/partner-auth-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PartnerContext {
  session: { user: { id: string } };
  member: { partnerId: string; role: string; partner: { status: string } };
}

interface PartnerContextError {
  error: string;
  status: number;
}

async function getPartnerContext(
  req: NextRequest
): Promise<PartnerContext | PartnerContextError> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const member = await prisma.partnerMember.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      partner: { status: 'active' },
    },
    include: { partner: true },
  });

  if (!member) {
    return { error: 'Not a partner member', status: 403 };
  }

  return { session, member };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  session: { user: { id: string } };
  member: { partnerId: string; role: string; partner: { status: string } };
}

interface PartnerContextError {
  error: string;
  status: number;
}

async function getPartnerContext(
  req: NextRequest
): Promise<PartnerContext | PartnerContextError> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const member = await prisma.partnerMember.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      partner: { status: 'active' },
    },
    include: { partner: true },
  });

  if (!member) {
    return { error: 'Not a partner member', status: 403 };
  }

  return { session, member };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get session from request headers
    const session = await auth.api.getSession({
      headers: req.headers,
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
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // NOTE: intentionally no manage_members check — any active partner member may view invites
    // Get invite
    const invite = await partnerInviteService.getInviteById(id);
    const invite = await partnerInviteService.getInviteById(id);
    if (!invite || invite.partnerId !== member.partnerId) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Failed to get invite' }, { status: 500 });
  }
}
