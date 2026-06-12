import { NextResponse } from 'next/server';
import { auth } from '@/auth';

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
        cookieName: 'better-auth.session_token',
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      session: {
        expiresAt: session.session.expiresAt,
        token: session.session.token?.substring(0, 50) + '...',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
