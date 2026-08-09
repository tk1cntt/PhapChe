import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './routing';

// Cookie names
const LOCALE_COOKIE = 'preferred-locale';
const SESSION_COOKIE = 'better-auth.session_token';
const SESSION_COOKIE_ALT = 'better-auth-session_token';

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

/**
 * Trích xuất session token từ raw Cookie header.
 * Dùng khi request.cookies.get() không parse được dotted cookie names
 * trong Edge Runtime (VD: `better-auth.session_token`).
 */
function extractSessionTokenFromHeader(
  cookieHeader: string | null,
  cookieName: string
): string | undefined {
  if (!cookieHeader) return undefined;
  const altName = cookieName.replace('.', '-');
  // Duyệt từng cookie pair: key=value
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const name = pair.substring(0, eqIndex).trim();
    const value = pair.substring(eqIndex + 1).trim();
    if (name === cookieName || name === altName) {
      try {
        return decodeURIComponent(value);
      } catch {
        // Malformed percent-encoding — return raw value
        return value;
      }
    }
  }
  return undefined;
}

function isPublicPath(pathname: string): boolean {
  if (STATIC_EXTENSIONS.test(pathname)) return true;
  // Strip locale prefix (e.g. /vi/sign-in → /sign-in) before matching
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  return PUBLIC_PREFIXES.some(p => withoutLocale.startsWith(p));
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
  // Mặc định tiếng Việt nếu chưa có cookie
  const preferredLocale = request.cookies.get(LOCALE_COOKIE)?.value || 'vi';
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = segments[0];

  if (routing.locales.includes(preferredLocale as typeof routing.locales[number]) &&
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

  // Always preserve locale cookie (defaults to 'vi')
  response.cookies.set(LOCALE_COOKIE, preferredLocale, {
    path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax',
  });

  // ── Step 3: Session gate (Edge-safe — cookie check only) ──
  // Kiểm tra session cookie từ request.
  // request.cookies.get() đôi khi không parse được dotted cookie names trong
  // Edge Runtime → fallback sang raw Cookie header để đảm bảo độ tin cậy.
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
    || request.cookies.get(SESSION_COOKIE_ALT)?.value
    || extractSessionTokenFromHeader(request.headers.get('cookie'), SESSION_COOKIE);

  // Pass pathname to downstream server components via header
  response.headers.set('x-pathname', pathname);

  // All non-public routes require session → redirect to login if missing
  // Role-based access for admin is checked by admin layout.tsx (Node.js server component)
  if (!sessionCookie) {
    const locale = currentLocale && routing.locales.includes(currentLocale as typeof routing.locales[number])
      ? currentLocale : 'vi';
    return NextResponse.redirect(new URL(buildLoginUrl(pathname, search, locale), request.url));
  }

  return response;
}

// ============================================================
// Matcher
// ============================================================

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
