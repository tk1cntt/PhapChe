import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User with this email does not exist. They must register first.' },
        { status: 404 }
      );
    }

    // Check if user is already a member of this workspace
    const existingMembership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: activeWorkspaceId,
        userId: invitedUser.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 409 }
      );
    }

    // Create workspace membership for existing user
    const membership = await prisma.workspaceMembership.create({
      data: {
        workspaceId: activeWorkspaceId,
        userId: invitedUser.id,
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
