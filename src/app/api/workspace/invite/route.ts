import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { isValidEmail } from '@/lib/validation/email';

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json(
        { error: 'No active workspace' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, role = 'customer' } = body;

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed workspace roles
    const VALID_ROLES = ['customer', 'specialist', 'reviewer', 'coordinator_admin', 'audit_admin', 'super_admin'];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Fetch the current user's membership in the active workspace for authorization
    const currentMembership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: activeWorkspaceId,
        userId,
        isActive: true,
      },
    });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    const ALLOWED_INVITE_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'];
    if (!ALLOWED_INVITE_ROLES.includes(currentMembership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      );
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'Unable to process invitation. Please check the email and try again.' },
        { status: 404 }
      );
    }

    // Prevent self-invite
    if (invitedUser.id === userId) {
      return NextResponse.json(
        { error: 'You cannot invite yourself to the workspace' },
        { status: 400 }
      );
    }

    // Atomic upsert — avoids race condition between findFirst and create
    const membership = await prisma.workspaceMembership.upsert({
      where: {
        userId_workspaceId: {
          workspaceId: activeWorkspaceId,
          userId: invitedUser.id,
        },
      },
      create: {
        workspaceId: activeWorkspaceId,
        userId: invitedUser.id,
        role: role,
        isActive: true,
      },
      update: {
        role: role,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Member added successfully',
        membership: {
          id: membership.id,
          email: membership.user?.email,
          name: membership.user?.name,
          role: membership.role,
          isActive: membership.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
