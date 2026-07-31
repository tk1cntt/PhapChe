/**
 * Middleware Route Guard — Role-based access control for admin routes
 *
 * Trong middleware (edge runtime), không thể dùng Prisma trực tiếp.
 * Strategy: kiểm tra session cookie → extract userId → query DB roles
 * → so khớp với route requirement.
 *
 * Các role map hiện được định nghĩa tập trung trong role-config.ts.
 */
import type { AppRole } from '@/lib/types';
import {
  ADMIN_ROUTE_GUARDS as _ADMIN_ROUTE_GUARDS,
  hasAnyRole as _hasAnyRole,
} from './role-config';

// Re-export để backward-compatible
export { ADMIN_ROUTE_GUARDS } from './role-config';
export { hasAnyRole } from './role-config';

/**
 * Các route công khai — không cần role check.
 * Bao gồm: auth, intake, api (API tự check role), static assets.
 */
const PUBLIC_PATH_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/auth/',
  '/api/',
  '/_next',
  '/intake',
  '/favicon.ico',
];

/**
 * Legacy route đã deprecated — redirect về dashboard.
 * Match chính xác segment (không dùng includes để tránh false match).
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/partner': '/admin/requests',
};

/**
 * Kiểm tra legacy redirect bằng cách so khớp path segment chính xác.
 */
function checkLegacyRedirect(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  for (const [oldPath, redirectTo] of Object.entries(LEGACY_REDIRECTS)) {
    const oldSegments = oldPath.split('/').filter(Boolean);
    if (oldSegments.length === 1 && segments.length >= 1) {
      // Check both with and without locale prefix
      const lastSegment = segments[segments.length - 1];
      if (lastSegment === oldSegments[0] || (segments.length > 1 && segments[1] === oldSegments[0])) {
        return redirectTo;
      }
    }
  }
  return null;
}

/**
 * Check if a path is public (no role check needed).
 */
function isPublicPath(pathname: string): boolean {
  // Match prefix at segment boundaries to avoid substring bypass.
  // e.g. /sign-in → public, /admin/sign-in → NOT public
  return PUBLIC_PATH_PREFIXES.some(p => {
    if (pathname.startsWith(p)) return true;
    // Also match locale-prefixed paths like /vi/sign-in, /vi/sign-in/...
    const normalized = p.replace(/\/$/, '');
    return pathname.startsWith(`/${normalized}/`) || pathname === `/${normalized}` || pathname.startsWith(`/${normalized}?`);
  });
}

/**
 * Trích xuất admin sub-route từ pathname.
 * Ví dụ: "/vi/admin/requests/abc" → "requests"
 *         "/vi/admin/dashboard"  → "dashboard"
 */
export function extractAdminRoute(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const adminIdx = segments.findIndex(s => s === 'admin');
  if (adminIdx === -1) return null;
  // Admin root path (e.g. /vi/admin) without sub-route → treat as 'dashboard'
  return segments[adminIdx + 1] ?? 'dashboard';
}

/**
 * Lấy required roles cho một admin sub-route.
 */
export function getRequiredRoles(adminRoute: string): readonly AppRole[] | null {
  if (typeof _ADMIN_ROUTE_GUARDS !== 'object' || _ADMIN_ROUTE_GUARDS === null) {
    console.error('[middleware-guard] ADMIN_ROUTE_GUARDS is not a valid object');
    return null;
  }
  return (_ADMIN_ROUTE_GUARDS as Record<string, readonly AppRole[]>)[adminRoute] ?? null;
}

/**
 * Kiểm tra xem path có phải admin route không.
 */
export function isAdminPath(pathname: string): boolean {
  return extractAdminRoute(pathname) !== null;
}

/**
 * Xác định xem user có được phép truy cập route không.
 * Trả về null nếu được phép, hoặc lý do từ chối.
 */
export function checkRouteAccess(pathname: string, userRoles: AppRole[]): { allowed: true } | { allowed: false; reason: string } {
  // Defensive: treat null/undefined roles as unauthenticated
  if (!userRoles || !Array.isArray(userRoles)) {
    return { allowed: false, reason: 'NO_ROLES' };
  }

  // 1. Public routes — always allowed
  if (isPublicPath(pathname)) {
    return { allowed: true };
  }

  // 2. Legacy redirects
  const legacyRedirect = checkLegacyRedirect(pathname);
  if (legacyRedirect) {
    return { allowed: false, reason: `LEGACY:${legacyRedirect}` };
  }

  // 3. Admin routes — check role
  if (!isAdminPath(pathname)) {
    // Non-admin, non-public → allow (customer dashboard etc.)
    return { allowed: true };
  }

  const adminRoute = extractAdminRoute(pathname)!;
  const requiredRoles = getRequiredRoles(adminRoute);

  // Nếu route không có trong guard map → deny (fail-closed) để tránh lộ admin route mới
  if (!requiredRoles) {
    console.error(`[middleware-guard] MISSING GUARD for admin route: "${adminRoute}" — denying access (fail-closed)`);
    return { allowed: false, reason: `NO_ROUTE_GUARD:${adminRoute}` };
  }

  if (!_hasAnyRole(userRoles, requiredRoles)) {
    return { allowed: false, reason: `ROLE_REQUIRED:${requiredRoles.join(',')}` };
  }

  return { allowed: true };
}

/**
 * Resolve user roles từ request (dùng trong middleware).
 * Đọc session cookie, gọi auth API, query membership roles.
 *
 * ⚠ Hàm này gọi DB — tách riêng sang middleware-resolver.ts để giữ
 * middleware-guard.ts thuần logic (dễ unit test).
 */
export { resolveGuardUser } from './middleware-resolver';
export type { GuardUser } from './middleware-resolver';

/**
 * Kiểm tra pathname có đang hiển thị trang lỗi forbidden không.
 * Ngăn redirect loop: /admin/dashboard → forbidden → /admin/dashboard?error=forbidden → ... (loop)
 *
 * Khi middleware redirect ROUTE_REQUIRED về ?error=forbidden,
 * request tiếp theo phải được pass-through để tránh vòng lặp vô hạn.
 */
export function isForbiddenPage(pathname: string, searchParams: URLSearchParams): boolean {
  return isAdminPath(pathname) && searchParams.get('error') === 'forbidden';
}
