/**
 * Partner Request Documents API
 * GET/POST /api/partner/requests/[id]/documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Upload document
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

  // Handle multipart form data
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const description = formData.get('description') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  // Validate file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
  }

  // Read file buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `partners/${member.partnerId}/requests/${id}/${timestamp}-${safeName}`;

  // TODO: Use StorageService for actual upload (Phase 56 StorageService)
  // For now, store file info in database only
  const document = await prisma.requestDocument.create({
    data: {
      requestId: id,
      filename: file.name,
      storageKey: filename,
      mimeType: file.type,
      size: file.size,
      uploadedBy: session.user.id,
      uploadedByType: 'partner',
      description: description || null,
    },
  });

  return NextResponse.json({ data: document }, { status: 201 });
}

// GET - List documents
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

  const documents = await prisma.requestDocument.findMany({
    where: { requestId: id },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      description: true,
      createdAt: true,
      uploadedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: documents });
}
