import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Debug session endpoint — development only.
 * In production this returns 404 to avoid exposing internal state.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const headers = new Headers();
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  try {
    const session = await auth.api.getSession({ headers });

    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No session found',
        cookieReceived: !!cookieHeader,
      });
    }

    const userId = session.user.id;

    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        isActive: true,
        memberships: {
          where: { isActive: true, workspace: { isActive: true } },
          select: { workspaceId: true, role: true },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: session.user.id },
      dbCheck: {
        userFound: !!user,
        userIsActive: user?.isActive,
        hasActiveMembership: !!user?.memberships?.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal error',
    });
  }
}
