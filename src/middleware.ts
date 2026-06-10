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

  // Skip auth check for auth routes (both /sign-in and /{locale}/sign-in), API routes, intake, and static files
  const isProtectedRoute = !pathname.includes('/sign-in') &&
                          !pathname.startsWith('/api/') &&
                          !pathname.startsWith('/_next') &&
                          !pathname.startsWith('/intake');
  if (isProtectedRoute) {
    if (!sessionCookie?.value) {
      // Redirect to locale-prefixed sign-in to maintain i18n context
      return NextResponse.redirect(new URL('/vi/sign-in', request.url));
    }
  }

  return response;
}

export const config = {
  // Match all paths except static files, auth routes, and API routes
  // API routes should not be i18n-prefixed
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
