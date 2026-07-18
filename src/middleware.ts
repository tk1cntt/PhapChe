import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './routing';

// Cookie names
const LOCALE_COOKIE = 'preferred-locale';
const SESSION_COOKIE = 'better-auth.session_token';

/**
 * Các prefix route công khai — luôn cho phép, không cần session.
 */
const PUBLIC_PREFIXES = [
  '/sign-in', '/sign-up', '/auth/', '/api/auth/',
  '/_next', '/favicon.ico', '/intake',
];

/**
 * Các suffix static files cần exclude.
 */
const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|ttf|map|webmanifest)$/i;

// ============================================================
// Helpers
// ============================================================

function isPublicPath(pathname: string): boolean {
  if (STATIC_EXTENSIONS.test(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p) || pathname.includes(p));
}

function isAdminPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const adminIdx = segments.findIndex(s => s === 'admin');
  return adminIdx !== -1 && adminIdx < segments.length - 1;
}

function buildLoginUrl(pathname: string, search: string, locale: string): string {
  const returnUrl = encodeURIComponent(pathname + search);
  return `/${locale}/sign-in?returnUrl=${returnUrl}`;
}

// ============================================================
// Middleware
// ============================================================
// Strategy: Edge runtime — NO database access.
// - Session cookie check only (Edge-safe)
// - Role-based guard delegated to admin layout.tsx (Node.js server component)
// - This avoids the "Edge can't use Prisma/SQLite" silent-fail → empty roles → redirect loop

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // ── Step 0: Public paths — pass through immediately ──
  if (isPublicPath(pathname)) {
    const intlMiddleware = createMiddleware(routing);
    return intlMiddleware(request);
  }

  // ── Step 1: Locale preference redirect ──
  const preferredLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = segments[0];

  if (preferredLocale &&
      routing.locales.includes(preferredLocale as typeof routing.locales[number]) &&
      preferredLocale !== currentLocale &&
      currentLocale &&
      routing.locales.includes(currentLocale as typeof routing.locales[number])) {
    segments[0] = preferredLocale;
    const newPath = `/${segments.join('/')}${search}`;
    const response = NextResponse.redirect(new URL(newPath, request.url));
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax',
    });
    return response;
  }

  // ── Step 2: i18n routing ──
  const intlMiddleware = createMiddleware(routing);
  const response = await intlMiddleware(request);

  // Preserve locale cookie
  if (preferredLocale && routing.locales.includes(preferredLocale as typeof routing.locales[number])) {
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax',
    });
  }

  // ── Step 3: Session gate (Edge-safe — cookie check only) ──
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const isAdmin = isAdminPath(pathname);

  // Pass pathname to downstream server components via header
  response.headers.set('x-pathname', pathname);

  // Break redirect loop: if already showing the forbidden error page, pass through
  if (isAdmin && request.nextUrl.searchParams.get('error') === 'forbidden') {
    return response;
  }

  // Admin routes require session → redirect to login if missing
  // Role-based access is checked by admin layout.tsx (Node.js server component)
  if (isAdmin && !sessionCookie) {
    const locale = currentLocale && routing.locales.includes(currentLocale as typeof routing.locales[number])
      ? currentLocale : 'vi';
    return NextResponse.redirect(new URL(buildLoginUrl(pathname, search, locale), request.url));
  }

  // Non-admin routes with session cookie → pass through
  // NOTE: Role guard moved to admin layout.tsx which runs on Node.js (can use Prisma)
  return response;
}

// ============================================================
// Matcher
// ============================================================

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
