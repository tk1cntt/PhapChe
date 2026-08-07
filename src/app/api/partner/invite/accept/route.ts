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
  // --- helper: consistent error response shape ---
  function errorResponse(message: string, status: number) {
    return NextResponse.json({ success: false, error: message }, { status });
  }

  try {
    // Get session from request headers
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return errorResponse('You must be logged in to accept an invite', 401);
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return errorResponse('Invite token is required', 400);
    }

    // Accept the invite
    const result = await partnerInviteService.acceptInvite(token, session.user.id);

    if (!result.success) {
      return errorResponse(result.error, 400);
    }

    return NextResponse.json({
      success: true,
      message: 'Invite accepted successfully',
      member: result.member,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return errorResponse('Failed to accept invite', 500);
  }
}
