import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'] as string[];

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAppSession();

    // Authorization check: require admin role
    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, timezone, locale } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if new email already exists for another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone !== undefined && { phone }),
        ...(timezone && { timezone }),
        ...(locale && { locale }),
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      timezone: updatedUser.timezone,
      locale: updatedUser.locale,
      isActive: updatedUser.isActive,
      emailVerified: updatedUser.emailVerified,
      updatedAt: updatedUser.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAppSession();

    // Authorization check: require admin role
    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      id: deactivatedUser.id,
      email: deactivatedUser.email,
      name: deactivatedUser.name,
      isActive: deactivatedUser.isActive,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Admin user deactivate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
