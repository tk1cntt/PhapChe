/**
 * Partner Request Comments API
 * GET/POST /api/partner/requests/[id]/comments
 *
 * Partner can view and add comments for requests assigned to them
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
    include: { engagement: { select: { partnerId: true } } },
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

  const comments = await prisma.requestComment.findMany({
    where: { requestId: id },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

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
  if (access.error) {
    return NextResponse.json(
      { error: access.error, detail: access.detail },
      { status: access.status }
    );
  }

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

  // Create comment and audit log in transaction
  const [comment] = await prisma.$transaction([
    prisma.requestComment.create({
      data: {
        requestId: id,
        authorId: session.user.id,
        authorType: 'partner',
        content: trimmedContent,
        isInternal: Boolean(isInternal),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'request.comment_added',
        entityType: 'request_comment',
        entityId: id, // Will be updated after comment creation
        actorId: session.user.id,
        actorType: 'partner',
        actorName: session.user.name || 'Partner',
        metadata: {
          requestId: id,
          isInternal: Boolean(isInternal),
          contentLength: trimmedContent.length,
        },
      },
    }),
  ]);

  // Update audit log with actual comment ID
  await prisma.auditLog.update({
    where: { id: comment.id },
    data: { entityId: comment.id },
  }).catch(() => {
    // Ignore if update fails - the audit log is still created
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
