import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const headers = new Headers(request.headers);
  const cookieHeader = request.headers.get('cookie');

  // Debug: log cookie received
  console.log('=== Attach-file Debug ===');
  console.log('Cookie received:', cookieHeader?.substring(0, 100));

  try {
    const session = await auth.api.getSession({ headers });
    console.log('Session from auth:', session ? 'OK' : 'NULL');

    if (!session) {
      return NextResponse.json({
        error: 'UNAUTHENTICATED',
        message: 'No valid session',
        cookieReceived: !!cookieHeader,
      }, { status: 401 });
    }

    return NextResponse.json({ success: true, userId: session.user.id });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({
      error: 'AUTH_ERROR',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
