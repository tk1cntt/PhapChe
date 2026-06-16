/**
 * Admin Partner Request Comments API
 * GET/POST /api/admin/partner/requests/[id]/comments
 *
 * Admin can view and add comments on partner requests.
 * Uses Message model for storing comments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);

  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }

  return {
    session,
    userId: session.user.id,
    roles: userRoles,
    activeWorkspaceId: memberships[0]?.workspaceId,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(); // Auth only, no userId needed

    const { id } = await params;

    // Verify request exists
    const requestExists = await prisma.legalRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!requestExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    // Get messages for this request (using Message model for comments)
    const messages = await prisma.message.findMany({
      where: { legalRequestId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map((m) => m.senderId))];

    // Fetch all senders in one query
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, email: true },
    });
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    // Transform to comment format
    const comments = messages.map((msg) => ({
      id: msg.id,
      requestId: msg.legalRequestId,
      content: msg.content,
      authorId: msg.senderId,
      author: senderMap.get(msg.senderId) || { id: msg.senderId, name: 'Unknown', email: '' },
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({ data: comments });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, userId, activeWorkspaceId } = await requireAdminSession();

    const { id } = await params;

    // Verify request exists and get workspace
    const requestExists = await prisma.legalRequest.findUnique({
      where: { id },
      select: { id: true, workspaceId: true },
    });

    if (!requestExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Content is required' },
        { status: 400 }
      );
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    // Use Message model for storing comments
    const message = await prisma.message.create({
      data: {
        workspaceId: requestExists.workspaceId,
        legalRequestId: id,
        senderId: userId,
        recipientId: userId, // Self-message for comments
        content: content.trim(),
        isRead: true,
      },
    });

    // Audit log using AuditEvent
    await prisma.auditEvent.create({
      data: {
        actorId: userId,
        workspaceId: requestExists.workspaceId,
        action: 'admin.partner.comment_add',
        targetType: 'request',
        targetId: id,
        requestId: id,
        metadataSummary: JSON.stringify({ commentId: message.id }),
      },
    });

    const comment = {
      id: message.id,
      requestId: message.legalRequestId,
      content: message.content,
      authorId: message.senderId,
      author: sender || { id: userId, name: 'Unknown', email: '' },
      createdAt: message.createdAt,
    };

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
