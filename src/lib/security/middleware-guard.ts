/**
 * Middleware Route Guard — Role-based access control for admin routes
 *
 * Trong middleware (edge runtime), không thể dùng Prisma trực tiếp.
 * Strategy: kiểm tra session cookie → extract userId → query DB roles
 * → so khớp với route requirement.
 */
import { NextRequest } from 'next/server';
import type { AppRole } from '@/lib/types';

/**
 * Admin route → minimum roles required.
 * Key là path segment (sau /{locale}/admin/), value là roles được phép.
 * Thứ tự ưu tiên: nếu user có ÍT NHẤT MỘT role trong list → cho phép.
 */
export const ADMIN_ROUTE_GUARDS: Record<string, readonly AppRole[]> = {
  // ── Coordinator pipeline ──
  requests: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
  dashboard: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer', 'audit_admin'],
  vault: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],

  // ── Admin-only (quản lý org, users, workspace, partner) ──
  users: ['super_admin', 'coordinator_admin'],
  workspace: ['super_admin', 'coordinator_admin'],
  partner: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
  operations: ['super_admin', 'coordinator_admin'],
  audit: ['super_admin', 'coordinator_admin', 'audit_admin'],
  organizations: ['super_admin'],
} as const;

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
    // oldPath phải khớp toàn bộ segment đầu tiên (sau locale)
    if (oldSegments.length === 1 && segments.length >= 1 && segments[1] === oldSegments[0]) {
      return redirectTo;
    }
  }
  return null;
}

/**
 * Check if a path is public (no role check needed).
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(p => pathname.startsWith(p) || pathname.includes(p));
}

/**
 * Kiểm tra xem user có ít nhất một role trong danh sách allowed không.
 */
export function hasAnyRole(userRoles: AppRole[], allowedRoles: readonly string[]): boolean {
  if (userRoles.length === 0) return false;
  return userRoles.some(r => allowedRoles.includes(r));
}

/**
 * Trích xuất admin sub-route từ pathname.
 * Ví dụ: "/vi/admin/requests/abc" → "requests"
 *         "/vi/admin/dashboard"  → "dashboard"
 */
export function extractAdminRoute(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  // segments: ['vi', 'admin', 'requests', ...]
  const adminIdx = segments.findIndex(s => s === 'admin');
  if (adminIdx === -1) return null;
  return segments[adminIdx + 1] ?? null; // sub-route hoặc null nếu là /admin
}

/**
 * Lấy required roles cho một admin sub-route.
 */
export function getRequiredRoles(adminRoute: string): readonly AppRole[] | null {
  return (ADMIN_ROUTE_GUARDS as Record<string, readonly AppRole[]>)[adminRoute] ?? null;
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

  // Nếu route không có trong guard map → cho phép (có thể là route mới chưa config)
  if (!requiredRoles) {
    console.warn(`[middleware-guard] No role config for admin route: "${adminRoute}" — allowing access`);
    return { allowed: true };
  }

  if (!hasAnyRole(userRoles, requiredRoles)) {
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
