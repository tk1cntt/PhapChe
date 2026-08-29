import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { isStructuredError } from '@/lib/errors';
import { isValidEmail } from '@/lib/validation/email';

export async function PUT(request: Request) {
  try {
    const session = await requireAppSession();
    const userId = session.userId;

    const body = await request.json();
    const { name, email, phone, title, timezone } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user (read inside transaction)
    // Update user profile atomically
    const updatedUser = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        throw Object.assign(new Error('Email is already in use'), { status: 400, error: 'VALIDATION_ERROR' });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone || null,
          title: title || null,
          timezone: timezone || 'Asia/Ho_Chi_Minh',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          title: true,
          timezone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Profile update failed:', message);

    if (isStructuredError(error)) {
      return NextResponse.json(
        { error: error.error, detail: error.detail },
        { status: error.status }
      );
    }

    // Unique constraint violation — another user (or a racing request) already
    // holds this email. Map to 400 VALIDATION_ERROR instead of 500.
    if (typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email is already in use' },
        { status: 400 }
      );
    }

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
