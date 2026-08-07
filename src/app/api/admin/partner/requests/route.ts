/**
 * Admin Partner Requests API
 * GET /api/admin/partner/requests
 *
 * Returns all partner requests with pagination and filters.
 * Access: super_admin, coordinator_admin, specialist, reviewer (per role-config).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';
import { requireAppSession } from '@/lib/security/session';
import { ADMIN_ROUTE_GUARDS } from '@/lib/security/role-config';

export async function GET(req: NextRequest) {
  // requireAppSession must be OUTSIDE the try block so that
  // Next.js redirect errors (NEXT_REDIRECT) propagate to the framework.
  const session = await requireAppSession(req.headers);

  try {
    const allowed = ADMIN_ROUTE_GUARDS.partner;
    if (!allowed || !session.roles.some(r => allowed.includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    const { searchParams } = new URL(req.url);
const MAX_LIMIT = 100;

// … inside function:
    const rawPage = parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= MAX_LIMIT ? rawLimit : DEFAULT_LIMIT;
// … inside function:
    const rawPage = parseInt(searchParams.get('page') ?? String(DEFAULT_PAGE), 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= MAX_LIMIT ? rawLimit : DEFAULT_LIMIT;
    const where: Record<string, unknown> = {
      OR: [
        { assignedPartnerId: { not: null } },
        { engagement: { partnerId: { not: null } } },
      ],
    };

    if (status) where.status = status;
    if (partnerId) where.assignedPartnerId = partnerId;

    // Search by title, description, or customer name
    // SQLite LIKE is case-insensitive for ASCII by default, no need for mode: 'insensitive'
    if (search) {
      where.AND = [
        { OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { createdBy: { name: { contains: search } } },
          { assignedPartner: { name: { contains: search } } },
        ]},
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.legalRequest.count({ where }),
      prisma.legalRequest.findMany({
        where,
        include: {
          assignedPartner: { select: { id: true, name: true } },
          engagement: {
            select: {
              partnerId: true,
              partner: { select: { name: true } }
            }
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    // Re-throw Next.js redirect errors so framework can perform the redirect
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    // Use a stable error discriminator instead of fragile string match
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || (error as Record<string, unknown>).code === 'UNAUTHENTICATED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || (error as Record<string, unknown>).code === 'UNAUTHENTICATED')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin partner requests error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
