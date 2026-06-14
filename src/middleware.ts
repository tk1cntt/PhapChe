import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './routing';

// Cookie name for locale preference
const LOCALE_COOKIE = 'preferred-locale';

export default async function middleware(request: NextRequest) {
  // Step 1: Check for saved locale preference in cookie
  const preferredLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  // Extract current locale from pathname (first segment after /)
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = segments[0];

  // If there's a preferred locale and it differs from current, redirect
  if (preferredLocale &&
      routing.locales.includes(preferredLocale as typeof routing.locales[number]) &&
      preferredLocale !== currentLocale &&
      currentLocale &&
      routing.locales.includes(currentLocale as typeof routing.locales[number])) {
    // Replace current locale with preferred locale in pathname
    segments[0] = preferredLocale;
    const newPath = '/' + segments.join('/') + request.nextUrl.search;

    const response = NextResponse.redirect(new URL(newPath, request.url));
    // Preserve the cookie
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax'
    });
    return response;
  }

  // Step 2: Handle i18n routing (redirect to locale prefix)
  const intlMiddleware = createMiddleware(routing);
  const response = await intlMiddleware(request);

  // Step 3: If user has a preferred locale, set the cookie in response
  if (preferredLocale && routing.locales.includes(preferredLocale as typeof routing.locales[number])) {
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });
  }

  // Step 4: Check auth only for protected routes after i18n routing
  const sessionCookie = request.cookies.get("better-auth.session_token");

  const isProtectedRoute = !pathname.includes('/sign-in') &&
                          !pathname.includes('/auth/') &&
                          !pathname.startsWith('/api/') &&
                          !pathname.startsWith('/_next') &&
                          !pathname.startsWith('/intake');

  if (isProtectedRoute) {
    if (!sessionCookie?.value) {
      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(new URL(`/vi/sign-in?returnUrl=${returnUrl}`, request.url));
    }
  }

  return response;
}

export const config = {
  // Match all paths except static files, auth routes, and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
