/**
 * Partner Context Middleware
 * Extracts partner context if user is a partner member
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HEADER_USER_ID = 'x-user-id';
const HEADER_PARTNER_ID = 'x-partner-id';
const HEADER_PARTNER_ROLE = 'x-partner-role';

export interface PartnerContextMiddlewareOptions {
  required?: boolean;
}

export function partnerContextMiddleware(options: PartnerContextMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    const userId = req.headers.get(HEADER_USER_ID);

    if (!userId) {
      if (options.required) {
        return NextResponse.json(
          { error: 'User context required' },
          { status: 400 }
        );
      }
      return NextResponse.next();
    }

    let member;
    try {
      member = await prisma.partnerMember.findFirst({
        where: { userId, isActive: true },
        select: {
          partnerId: true,
          role: true,
        },
      });
    } catch (error) {
      console.error('Failed to fetch partner context:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (!member && options.required) {
      return NextResponse.json(
        { error: 'Partner context required' },
        { status: 403 }
      );
    }

    if (member) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set(HEADER_PARTNER_ID, member.partnerId);
      requestHeaders.set(HEADER_PARTNER_ROLE, member.role);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
  };
}
