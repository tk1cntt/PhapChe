/**
 * Legal Requests API
 * GET/POST /api/requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List user's requests
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const serviceTypeId = searchParams.get('serviceTypeId');
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);

  // Get user's workspace IDs
  const memberships = await prisma.workspaceMember.findMany({
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
  if (serviceTypeId) {
    where.serviceTypeId = serviceTypeId;
  }

  const [requests, total] = await Promise.all([
    prisma.legalRequest.findMany({
      where,
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        serviceType: { select: { id: true, name: true } },
        assignedSpecialist: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.legalRequest.count({ where }),
  ]);

  return NextResponse.json({
    data: requests,
    pagination: { total, skip, take, hasMore: skip + take < total },
  });
}

// POST - Create new request
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    workspaceId,
    serviceTypeId,
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
  if (!workspaceId || !serviceTypeId || !title) {
    return NextResponse.json(
      { error: 'workspaceId, serviceTypeId, and title are required' },
      { status: 400 }
    );
  }

  // Verify workspace membership
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
  }

  // Verify service type exists
  const serviceType = await prisma.serviceType.findUnique({
    where: { id: serviceTypeId },
  });

  if (!serviceType || !serviceType.isActive) {
    return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
  }

  // Generate request code
  const count = await prisma.legalRequest.count();
  const code = `REQ-${String(count + 1).padStart(5, '0')}`;

  const request = await prisma.legalRequest.create({
    data: {
      code,
      workspaceId,
      serviceTypeId,
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
      serviceType: { select: { id: true, name: true } },
    },
  });

  // Log to audit
  await prisma.auditLog.create({
    data: {
      action: 'request.create',
      entityType: 'legal_request',
      entityId: request.id,
      actorId: session.user.id,
      actorType: 'user',
      actorName: session.user.name || 'User',
      metadata: { code, title, serviceTypeId },
    },
  });

  return NextResponse.json({ data: request }, { status: 201 });
}
