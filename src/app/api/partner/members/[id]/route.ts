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

    // Update member
    const updated = await prisma.partnerMember.update({
      where: { id },
      data: updateData,
      include: { user: true },
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

    // Delete member
    await prisma.partnerMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
