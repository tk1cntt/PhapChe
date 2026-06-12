import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

    // Check user membership (same as requireAppSession)
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        isActive: true,
        memberships: {
          where: { isActive: true, workspace: { isActive: true } },
          select: { workspaceId: true, role: true, isActive: true, workspace: { select: { id: true, name: true, isActive: true } } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      dbCheck: {
        userFound: !!user,
        userIsActive: user?.isActive,
        membershipCount: user?.memberships?.length,
        memberships: user?.memberships,
        hasActiveMembership: user?.memberships?.[0]?.isActive && user?.memberships?.[0]?.workspace?.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
