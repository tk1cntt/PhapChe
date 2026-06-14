/**
 * Partner Request Comments API
 * GET/POST /api/partner/requests/[id]/comments
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const request = await prisma.legalRequest.findUnique({
    where: { id },
    include: { engagement: { select: { partnerId: true } } },
  });

  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const request = await prisma.legalRequest.findUnique({
    where: { id },
    include: { engagement: { select: { partnerId: true } } },
  });

  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const { content, isInternal } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const comment = await prisma.requestComment.create({
    data: {
      requestId: id,
      authorId: session.user.id,
      authorType: 'partner',
      content: content.trim(),
      isInternal: isInternal || false,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
