/**
 * Partner Accept Invite API
 * POST /api/partner/invite/accept - Accept an invite (public endpoint)
 *
 * This endpoint is public but requires a valid session.
 * The user must be logged in to accept an invite.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { partnerInviteService } from '@/lib/services/partner-invite-service';

export async function POST(req: NextRequest) {
  try {
    // Get session - user must be logged in
    const session = await auth.api.getSession({
      headers: new Headers({ 'x-user-id': req.headers.get('x-user-id') || '' }),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to accept an invite' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invite token is required' },
        { status: 400 }
      );
    }

    // Accept the invite
    const result = await partnerInviteService.acceptInvite(token, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invite accepted successfully',
      member: result.member,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
