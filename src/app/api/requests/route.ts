/**
 * Legal Requests API
 * GET/POST /api/requests
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';

// GET - List user's requests
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
    }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const matterTypeId = searchParams.get('matterTypeId');
  const rawSkip = parseInt(searchParams.get('skip') || '0', 10);
  const rawTake = parseInt(searchParams.get('take') || '20', 10);
  const skip = Number.isNaN(rawSkip) || rawSkip < 0 ? 0 : rawSkip;
  const take = Number.isNaN(rawTake) || rawTake < 0 ? 20 : Math.min(rawTake, 100);

  // Get user's workspace IDs
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map(m => m.workspaceId);

  const where: Record<string, unknown> = {
    workspaceId: { in: workspaceIds },
  };

  if (status) {
    where.status = status;
  }
  if (matterTypeId) {
    where.matterTypeId = matterTypeId;
  }

  const [requests, total] = await Promise.all([
    prisma.legalRequest.findMany({
      where,
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        matterTypeRef: { select: { id: true, key: true } },
        assignedSpecialist: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.legalRequest.count({ where }),
  ]);

  // Transform to include matterType display
  const transformedRequests = requests.map((req) => ({
    ...req,
    matterTypeKey: req.matterTypeRef?.key,
  }));

    return NextResponse.json({
      data: transformedRequests,
      pagination: { total, skip, take, hasMore: skip + take < total },
    });
  } catch (error: unknown) {
    console.error('Error listing requests:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new request
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
    }

  const body = await req.json();
  const {
    workspaceId,
    matterTypeId,
    engagementId,
    title,
    description,
    priority,
    contactName,
    contactEmail,
    contactPhone,
    intakeData,
  } = body;

  // Validate required fields
  if (!workspaceId || !matterTypeId || !title) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'workspaceId, matterTypeId, and title are required', field: 'workspaceId' },
      { status: 400 }
    );
  }

  // Verify workspace membership
  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId, userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'FORBIDDEN', detail: 'Not a member of this workspace' }, { status: 403 });
  }

  // Verify matter type exists
  const matterType = await prisma.matterType.findUnique({
    where: { id: matterTypeId },
  });

  if (!matterType) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Invalid matter type', field: 'matterTypeId' }, { status: 400 });
  }

  // Verify engagement belongs to workspace if provided
  if (engagementId) {
    const engagement = await prisma.engagement.findFirst({
      where: { id: engagementId, workspaceId },
      select: { id: true },
    });
    if (!engagement) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'Invalid engagement or engagement does not belong to this workspace', field: 'engagementId' },
        { status: 400 }
      );
    }
  }

  // Generate request code with collision retry
  let requestCode: string;
  let attempt = 0;
  const MAX_ATTEMPTS = 5;
  do {
    requestCode = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    attempt++;
  } while (
    attempt < MAX_ATTEMPTS &&
    (await prisma.legalRequest.findFirst({ where: { code: requestCode }, select: { id: true } }))
  );
  if (attempt >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Failed to generate unique request code' }, { status: 500 });
  }

  // Wrap request creation and audit log in transaction to ensure atomicity
  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.legalRequest.create({
      data: {
        code: requestCode,
        workspaceId,
        matterTypeId,
        engagementId: engagementId || null,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: 'submitted',
        createdById: session.user.id,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        intakeData: intakeData || null,
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        matterTypeRef: { select: { id: true, key: true } },
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: session.user.id,
        workspaceId,
        action: 'request.create',
        targetType: 'request',
        targetId: created.id,
        requestId: created.id,
        metadataSummary: JSON.stringify({ code: requestCode, title, matterTypeId }),
      },
    });

    return created;
  });

    return NextResponse.json({ data: request }, { status: 201 });
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
