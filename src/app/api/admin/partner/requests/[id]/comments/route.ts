/**
 * Admin Partner Request Comments API
 * GET/POST /api/admin/partner/requests/[id]/comments
 *
 * Admin can view and add comments on partner requests.
 * All actions are logged to audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
  } catch (error) {
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
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
        authorId: session.user.id,
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
        actorId: session.user.id,
        actorType: 'admin',
        actorName: session.user.name || 'Admin',
        metadata: { commentId: comment.id },
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
