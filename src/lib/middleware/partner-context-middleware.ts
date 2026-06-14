/**
 * Partner Context Middleware
 * Extracts partner context if user is a partner member
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PartnerContextMiddlewareOptions {
  required?: boolean;
}

export function partnerContextMiddleware(options: PartnerContextMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      if (options.required) {
        return NextResponse.json(
          { error: 'User context required' },
          { status: 400 }
        );
      }
      return NextResponse.next();
    }

    const member = await prisma.partnerMember.findFirst({
      where: { userId, isActive: true },
      select: {
        partnerId: true,
        role: true,
      },
    });

    if (member) {
      req.headers.set('x-partner-id', member.partnerId);
      req.headers.set('x-partner-role', member.role);
    }

    return NextResponse.next();
  };
}
