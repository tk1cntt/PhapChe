/**
 * Partner Request Comments API
 * GET/POST /api/partner/requests/[id]/comments
 *
 * Partner can view and add comments for requests assigned to them
 * Uses Message model for comments
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Helper to check partner access
async function checkPartnerAccess(requestId: string, userId: string) {
  const member = await prisma.partnerMember.findFirst({
    where: { userId, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return { error: 'FORBIDDEN', detail: 'User is not an active partner member', status: 403 };
  }

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, workspaceId: true, assignedPartnerId: true, engagement: { select: { partnerId: true } } },
  });

  if (!request) {
    return { error: 'NOT_FOUND', detail: 'Request not found', status: 404 };
  }

  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return { error: 'FORBIDDEN', detail: 'Partner does not have access to this request', status: 403 };
  }

  return { member, request, hasAccess: true };
}

// GET - List comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const access = await checkPartnerAccess(id, session.user.id);
  if (access.error) {
    return NextResponse.json(
      { error: access.error, detail: access.detail },
      { status: access.status }
    );
  }

  // Get messages for this request (using Message model for comments)
  const messages = await prisma.message.findMany({
    where: { legalRequestId: id },
    orderBy: { createdAt: 'asc' },
  });

  // Get sender info
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
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
    isInternal: false,
    createdAt: msg.createdAt,
  }));

  return NextResponse.json({ data: comments });
}

// POST - Add comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const access = await checkPartnerAccess(id, session.user.id);
  if (access.error || !access.request) {
    return NextResponse.json(
      { error: access.error || 'Access denied', detail: access.detail || 'Access denied' },
      { status: access.status || 403 }
    );
  }

  const { request: currentRequest } = access;
  const body = await req.json();
  const { content, isInternal } = body;

  // Validate content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Content is required and must be non-empty', field: 'content' },
      { status: 400 }
    );
  }

  if (content.length > 10000) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Content exceeds maximum length of 10000 characters', field: 'content' },
      { status: 400 }
    );
  }

  const trimmedContent = content.trim();

  // Create message and audit event
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        workspaceId: currentRequest.workspaceId,
        legalRequestId: id,
        senderId: session.user.id,
        recipientId: session.user.id,
        content: trimmedContent,
        isRead: true,
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: session.user.id,
        workspaceId: currentRequest.workspaceId,
        action: 'request.comment_added',
        targetType: 'request',
        targetId: id,
        requestId: id,
        metadataSummary: JSON.stringify({
          isInternal: Boolean(isInternal),
          contentLength: trimmedContent.length,
        }),
      },
    }),
  ]);

  // Get sender info
  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  const comment = {
    id: message.id,
    requestId: message.legalRequestId,
    content: message.content,
    authorId: message.senderId,
    author: sender || { id: session.user.id, name: 'Unknown', email: '' },
    isInternal: Boolean(isInternal),
    createdAt: message.createdAt,
  };

  return NextResponse.json({ data: comment }, { status: 201 });
}
