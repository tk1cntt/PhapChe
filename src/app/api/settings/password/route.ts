import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { compare, hash } from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await requireAppSession();
    const userId = session.userId;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Current password is required' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'New password is required' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find account with password
    const account = await prisma.account.findFirst({
      where: { userId, password: { not: null } }
    });

    if (!account || !account.password) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No password set for this account' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await compare(currentPassword, account.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await compare(newPassword, account.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await hash(newPassword, 10);

    // Update account with new password
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Password change failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to change password' },
      { status: 500 }
    );
  }
}
