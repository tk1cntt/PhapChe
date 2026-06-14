/**
 * Admin Partner Request Comments API
 * GET/POST /api/admin/partner/requests/[id]/comments
 *
 * Admin can view and add comments on partner requests.
 * All actions are logged to audit.
 * Platform-level admin - no workspace membership required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

/**
 * Helper to check platform-level admin session
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }
  const userRole = (session.user as any).role || (session.user as any).roles?.[0];
  const userRoles = (session.user as any).roles || (userRole ? [userRole] : []);
  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));
  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }
  return { session, userId: session.user.id, roles: userRoles };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAdminSession();

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

    const comments = await prisma.requestComment.findMany({
      where: { requestId: id },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

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
    const { session, userId } = await requireAdminSession();

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

    const body = await req.json();
    const { content, isInternal } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Content is required' },
        { status: 400 }
      );
    }

    const comment = await prisma.requestComment.create({
      data: {
        requestId: id,
        authorId: userId,
        authorType: 'admin',
        content: content.trim(),
        isInternal: isInternal || false,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    // Admin audit log
    await prisma.auditLog.create({
      data: {
        action: 'admin.partner.comment_add',
        entityType: 'legal_request',
        entityId: id,
        actorId: userId,
        actorType: 'admin',
        actorName: session.user.name || 'Admin',
        metadata: { commentId: comment.id },
      },
    });

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
