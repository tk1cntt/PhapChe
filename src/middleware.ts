import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './routing';

// Create i18n middleware first
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Step 1: Handle i18n routing (redirect to locale prefix)
  const response = await intlMiddleware(request);

  // Step 2: Get locale from i18n middleware result
  const pathname = request.nextUrl.pathname;

  // Step 3: Check auth only for protected routes after i18n routing
  const sessionCookie = request.cookies.get("better-auth.session_token");

  // Skip auth check for auth routes and static files
  if (!pathname.startsWith('/sign-in') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/_next')) {
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return response;
}

export const config = {
  // Match all paths except static files and auth routes
  // I18n middleware handles locale routing for app routes
  matcher: ['/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)'],
};
