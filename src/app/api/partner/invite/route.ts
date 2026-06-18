/**
 * Partner Invite API
 * POST /api/partner/invite - Create new invite (partner admin only)
 * GET /api/partner/invite - List pending invites
 * DELETE /api/partner/invite/[id] - Revoke invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { partnerInviteService } from '@/lib/services/partner-invite-service';
import { hasPermission } from '@/lib/services/partner-auth-service';

export async function GET(req: NextRequest) {
  try {
    // Get session from request headers (better-auth reads from cookie)
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
      include: { partner: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // Get pending invites
    const invites = await partnerInviteService.listPendingInvites(member.partnerId);

    return NextResponse.json({
      success: true,
      data: invites.map(invite => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        invitedBy: invite.invitedBy,
        createdAt: invite.createdAt,
      })),
      total: invites.length,
    });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json({ error: 'Failed to get invites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get session from request headers (better-auth reads from cookie)
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
      include: { partner: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // Check if user has permission to manage members
    if (!hasPermission(member.role, 'manage_members')) {
      return NextResponse.json(
        { error: 'Permission denied. Requires manage_members permission.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, role } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'specialist', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create invite
    const result = await partnerInviteService.createInvite({
      partnerId: member.partnerId,
      email,
      role,
      invitedBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: result.invite?.id,
        email: result.invite?.email,
        role: result.invite?.role,
        status: result.invite?.status,
        expiresAt: result.invite?.expiresAt,
        createdAt: result.invite?.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
