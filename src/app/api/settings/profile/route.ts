import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
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

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Profile update failed:', message);

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
