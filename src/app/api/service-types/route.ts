/**
 * Service Types API
 * GET /api/service-types
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get('isActive') !== 'false';

  const serviceTypes = await prisma.serviceType.findMany({
    where: isActive ? { isActive: true } : {},
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ data: serviceTypes });
}
