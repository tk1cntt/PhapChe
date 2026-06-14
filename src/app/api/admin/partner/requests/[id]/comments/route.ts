/**
 * Admin Partner Request Comments API
 * GET/POST /api/admin/partner/requests/[id]/comments
 *
 * Admin can view and add comments on partner requests.
 * All actions are logged to audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

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
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

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
}
