import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './routing';

// Cookie names
const LOCALE_COOKIE = 'preferred-locale';
const SESSION_COOKIE = 'better-auth.session_token';

/**
 * Route → role mapping.
 * Key là admin sub-route (sau /{locale}/admin/), value là các role được phép.
 */
const ROUTE_ROLES: Record<string, readonly string[]> = {
  requests: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
  dashboard: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer', 'audit_admin'],
  vault: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
  users: ['super_admin', 'coordinator_admin'],
  workspace: ['super_admin', 'coordinator_admin'],
  partner: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
  operations: ['super_admin', 'coordinator_admin'],
  audit: ['super_admin', 'coordinator_admin', 'audit_admin'],
  organizations: ['super_admin'],
};

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

function extractAdminRoute(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const adminIdx = segments.findIndex(s => s === 'admin');
  if (adminIdx === -1 || adminIdx === segments.length - 1) return null;
  return segments[adminIdx + 1];
}

function buildLoginUrl(pathname: string, search: string, locale: string): string {
  const returnUrl = encodeURIComponent(pathname + search);
  return `/${locale}/sign-in?returnUrl=${returnUrl}`;
}

function buildForbiddenUrl(locale: string): string {
  return `/${locale}/admin/dashboard?error=forbidden`;
}

// ============================================================
// Middleware
// ============================================================

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

  // ── Step 3: Auth check — non-admin protected routes ──
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminPath = extractAdminRoute(pathname) !== null;

  // API routes handle their own auth → pass through
  if (isApiRoute) {
    return response;
  }

  // Customer/settings/etc routes: just need a session
  if (!isAdminPath) {
    if (!sessionCookie) {
      const locale = currentLocale && routing.locales.includes(currentLocale as typeof routing.locales[number])
        ? currentLocale : 'vi';
      return NextResponse.redirect(new URL(buildLoginUrl(pathname, search, locale), request.url));
    }
    return response;
  }

  // ── Step 4: Role-based guard for admin routes ──
  // Break redirect loop: if already showing the forbidden error page, pass through
  if (isAdminPath && request.nextUrl.searchParams.get('error') === 'forbidden') {
    return response;
  }

  if (!sessionCookie) {
    const locale = currentLocale && routing.locales.includes(currentLocale as typeof routing.locales[number])
      ? currentLocale : 'vi';
    return NextResponse.redirect(new URL(buildLoginUrl(pathname, search, locale), request.url));
  }

  // Resolve user roles from DB (via auth session)
  const userRoles = await resolveUserRoles(request);
  const adminRoute = extractAdminRoute(pathname)!;
  const requiredRoles = ROUTE_ROLES[adminRoute];

  // Route not in guard map → allow (new route chưa config)
  if (!requiredRoles) {
    console.warn(`[middleware] No role config for admin route: "${adminRoute}" — allowing`);
    return response;
  }

  // User roles vs required roles
  const hasAccess = userRoles.length > 0 && userRoles.some(r => requiredRoles.includes(r));

  if (!hasAccess) {
    const locale = currentLocale && routing.locales.includes(currentLocale as typeof routing.locales[number])
      ? currentLocale : 'vi';
    console.log(`[middleware] FORBIDDEN: user roles=[${userRoles.join(',')}] required=[${requiredRoles.join(',')}] path=${pathname}`);
    return NextResponse.redirect(new URL(buildForbiddenUrl(locale), request.url));
  }

  return response;
}

// ============================================================
// User role resolution (imported at runtime for Edge compat)
// ============================================================

async function resolveUserRoles(request: NextRequest): Promise<string[]> {
  try {
    // Dynamically import to keep edge compatibility
    const { auth } = await import('@/auth');
    const { prisma } = await import('@/lib/prisma');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return [];

    const user = await prisma.user.findFirst({
      where: { id: session.user.id, isActive: true },
      select: {
        memberships: {
          where: { isActive: true, workspace: { isActive: true } },
          select: { role: true },
        },
      },
    });

    if (!user || user.memberships.length === 0) return [];

    return Array.from(new Set(user.memberships.map(m => m.role)));
  } catch (err) {
    console.error('[middleware] Failed to resolve user roles:', err);
    return [];
  }
}

// ============================================================
// Matcher
// ============================================================

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
