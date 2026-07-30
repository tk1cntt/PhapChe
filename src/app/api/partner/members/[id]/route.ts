/**
 * Partner Member Management API
 * PATCH /api/partner/members/[id] - Update member role/status
 * DELETE /api/partner/members/[id] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/services/partner-auth-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    // Check if user has permission to manage members
    if (!hasPermission(member.role, 'manage_members')) {
      return NextResponse.json(
        { error: 'Permission denied. Requires manage_members permission.' },
        { status: 403 }
      );
    }

    // Get target member
    const targetMember = await prisma.partnerMember.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!targetMember || targetMember.partnerId !== member.partnerId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot modify yourself
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own membership' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { role, isActive } = body;

    // Validate role if provided
    if (role !== undefined) {
      const validRoles = ['admin', 'specialist', 'viewer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: { role?: string; isActive?: boolean } = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Guard: cannot demote/deactivate the last active admin
    const isDemotingOrDeactivating =
      (role !== undefined && targetMember.role === 'admin' && role !== 'admin') ||
      (isActive === false && targetMember.isActive);

    // Wrap guard check + mutation trong transaction để tránh race condition
    // Đảm bảo giữa count và update không có request khác chen vào
    const updated = await prisma.$transaction(async (tx) => {
      if (isDemotingOrDeactivating) {
        const activeAdminCount = await tx.partnerMember.count({
          where: {
            partnerId: targetMember.partnerId,
            role: 'admin',
            isActive: true,
            id: { not: targetMember.id },
          },
        });
        if (activeAdminCount === 0) {
          throw new LastAdminError();
        }
      }

      // Update member trong cùng transaction với guard check
      return tx.partnerMember.update({
        where: { id },
        data: updateData,
        include: { user: true },
      });
    });

    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        user: {
          id: updated.user.id,
          name: updated.user.name,
          email: updated.user.email,
        },
        role: updated.role,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    if (error instanceof LastAdminError) {
      return NextResponse.json(
        { error: 'Cannot remove the last active admin. Promote another member to admin first.' },
        { status: 400 }
      );
    }
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // Check if user has permission to manage members
    if (!hasPermission(member.role, 'manage_members')) {
      return NextResponse.json(
        { error: 'Permission denied. Requires manage_members permission.' },
        { status: 403 }
      );
    }

    // Get target member
    const targetMember = await prisma.partnerMember.findUnique({
      where: { id },
    });

    if (!targetMember || targetMember.partnerId !== member.partnerId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove yourself
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot remove your own membership' },
        { status: 400 }
      );
    }

    // Wrap last-admin guard check + delete trong transaction để tránh race condition
    // Đảm bảo giữa count và delete không có request khác xóa admin khác
    await prisma.$transaction(async (tx) => {
      if (targetMember.role === 'admin' && targetMember.isActive) {
        const activeAdminCount = await tx.partnerMember.count({
          where: {
            partnerId: targetMember.partnerId,
            role: 'admin',
            isActive: true,
            id: { not: targetMember.id },
          },
        });
        if (activeAdminCount === 0) {
          throw new LastAdminError();
        }
      }

      // Delete member trong cùng transaction với guard check
      await tx.partnerMember.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof LastAdminError) {
      return NextResponse.json(
        { error: 'Cannot remove the last active admin. Promote another member to admin first.' },
        { status: 400 }
      );
    }
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

/** Error class để phân biệt lỗi last-admin guard vs lỗi thông thường trong transaction */
class LastAdminError extends Error {
  constructor() {
    super('Cannot remove the last active admin');
    this.name = 'LastAdminError';
  }
}
