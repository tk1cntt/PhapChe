import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractAdminRoute,
  isAdminPath,
  checkRouteAccess,
  hasAnyRole,
  isForbiddenPage,
  ADMIN_ROUTE_GUARDS,
} from '@/lib/security/middleware-guard';

describe('middleware-guard', () => {
  // ── hasAnyRole ──
  describe('hasAnyRole', () => {
    it('returns true when user has at least one matching role', () => {
      expect(hasAnyRole(['coordinator_admin'], ['super_admin', 'coordinator_admin'])).toBe(true);
    });

    it('returns false when user has no matching role', () => {
      expect(hasAnyRole(['customer'], ['super_admin', 'coordinator_admin'])).toBe(false);
    });

    it('returns false for empty user roles', () => {
      expect(hasAnyRole([], ['super_admin'])).toBe(false);
    });

    it('returns true for multi-role user matching one', () => {
      expect(hasAnyRole(['specialist', 'reviewer'], ['reviewer', 'audit_admin'])).toBe(true);
    });
  });

  // ── extractAdminRoute ──
  describe('extractAdminRoute', () => {
    it('extracts sub-route from /vi/admin/requests', () => {
      expect(extractAdminRoute('/vi/admin/requests')).toBe('requests');
    });

    it('extracts sub-route from /en/admin/users', () => {
      expect(extractAdminRoute('/en/admin/users')).toBe('users');
    });

    it('extracts sub-route with trailing segments', () => {
      expect(extractAdminRoute('/vi/admin/requests/abc-123')).toBe('requests');
    });

    it('returns null for non-admin path', () => {
      expect(extractAdminRoute('/vi/dashboard')).toBeNull();
    });

    it('returns null for exact /admin path', () => {
      expect(extractAdminRoute('/vi/admin')).toBeNull();
    });

    it('handles /zh/admin/audit', () => {
      expect(extractAdminRoute('/zh/admin/audit')).toBe('audit');
    });
  });

  // ── isAdminPath ──
  describe('isAdminPath', () => {
    it('returns true for admin routes', () => {
      expect(isAdminPath('/vi/admin/requests')).toBe(true);
      expect(isAdminPath('/en/admin/users')).toBe(true);
    });

    it('returns false for non-admin routes', () => {
      expect(isAdminPath('/vi/dashboard')).toBe(false);
      expect(isAdminPath('/vi/sign-in')).toBe(false);
    });
  });

  // ── checkRouteAccess ──
  describe('checkRouteAccess — public paths', () => {
    it('allows /sign-in', () => {
      expect(checkRouteAccess('/vi/sign-in', [])).toEqual({ allowed: true });
    });

    it('allows /intake', () => {
      expect(checkRouteAccess('/en/intake/form', [])).toEqual({ allowed: true });
    });

    it('allows /api/ requests', () => {
      expect(checkRouteAccess('/api/admin/requests', [])).toEqual({ allowed: true });
    });

    it('allows /_next static', () => {
      expect(checkRouteAccess('/_next/static/chunks', [])).toEqual({ allowed: true });
    });

    it('allows /auth/ routes', () => {
      expect(checkRouteAccess('/vi/auth/callback', [])).toEqual({ allowed: true });
    });
  });

  describe('checkRouteAccess — customer routes', () => {
    it('allows customer dashboard without role check', () => {
      expect(checkRouteAccess('/vi/dashboard', [])).toEqual({ allowed: true });
      expect(checkRouteAccess('/vi/my-cases', [])).toEqual({ allowed: true });
    });
  });

  describe('checkRouteAccess — admin routes with roles', () => {
    it('allows coordinator to access requests', () => {
      expect(checkRouteAccess('/vi/admin/requests', ['coordinator_admin'])).toEqual({ allowed: true });
    });

    it('allows specialist to access requests', () => {
      expect(checkRouteAccess('/vi/admin/requests', ['specialist'])).toEqual({ allowed: true });
    });

    it('allows reviewer to access requests', () => {
      expect(checkRouteAccess('/vi/admin/requests', ['reviewer'])).toEqual({ allowed: true });
    });

    it('denies customer from admin/requests', () => {
      const result = checkRouteAccess('/vi/admin/requests', ['customer']);
      expect(result.allowed).toBe(false);
    });

    it('denies empty roles from admin/requests', () => {
      const result = checkRouteAccess('/vi/admin/requests', []);
      expect(result.allowed).toBe(false);
    });

    it('allows super_admin everywhere', () => {
      // Test all configured admin routes
      for (const route of Object.keys(ADMIN_ROUTE_GUARDS)) {
        expect(checkRouteAccess(`/vi/admin/${route}`, ['super_admin'])).toEqual({ allowed: true });
      }
    });

    it('denies coordinator from organizations (super_admin only)', () => {
      const result = checkRouteAccess('/vi/admin/organizations', ['coordinator_admin']);
      expect(result.allowed).toBe(false);
    });

    it('allows audit_admin to audit only', () => {
      expect(checkRouteAccess('/vi/admin/audit', ['audit_admin'])).toEqual({ allowed: true });
      const result = checkRouteAccess('/vi/admin/requests', ['audit_admin']);
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkRouteAccess — unconfigured admin routes', () => {
    it('allows access to admin routes not in guard map (with warning)', () => {
      // settings is not in ADMIN_ROUTE_GUARDS → should allow
      expect(checkRouteAccess('/vi/admin/settings', [])).toEqual({ allowed: true });
    });

    it('allows /admin without sub-route', () => {
      expect(checkRouteAccess('/vi/admin', [])).toEqual({ allowed: true });
    });
  });

  describe('checkRouteAccess — legacy redirect', () => {
    it('redirects /partner to /admin/requests', () => {
      const result = checkRouteAccess('/vi/partner', []);
      expect(result.allowed).toBe(false);
      expect((result as any).reason).toBe('LEGACY:/admin/requests');
    });

    it('does NOT redirect /admin/partner (admin sub-route)', () => {
      // /admin/partner is a valid admin route, not a legacy path
      expect(checkRouteAccess('/vi/admin/partner', ['coordinator_admin'])).toEqual({ allowed: true });
    });

    it('legacy redirect works regardless of locale', () => {
      const result = checkRouteAccess('/en/partner', []);
      expect(result.allowed).toBe(false);
    });
  });

  // ── ADMIN_ROUTE_GUARDS structure ──
  describe('ADMIN_ROUTE_GUARDS config integrity', () => {
    it('has entries for all major admin routes', () => {
      const expectedRoutes = ['requests', 'dashboard', 'users', 'workspace', 'partner', 'audit', 'organizations'];
      for (const route of expectedRoutes) {
        expect(ADMIN_ROUTE_GUARDS[route]).toBeDefined();
      }
    });

    it('each guard maps to a non-empty role array', () => {
      for (const [route, roles] of Object.entries(ADMIN_ROUTE_GUARDS)) {
        expect(roles.length, `Route "${route}" has empty roles`).toBeGreaterThan(0);
      }
    });
  });

  // ── isForbiddenPage — redirect loop prevention ──
  describe('isForbiddenPage — ngăn redirect loop', () => {
    function urlSearchParams(search: string): URLSearchParams {
      return new URLSearchParams(search);
    }

    it('returns true for /admin/dashboard?error=forbidden', () => {
      expect(isForbiddenPage('/vi/admin/dashboard', urlSearchParams('error=forbidden'))).toBe(true);
    });

    it('returns true for /en/admin/requests?error=forbidden', () => {
      expect(isForbiddenPage('/en/admin/requests', urlSearchParams('error=forbidden'))).toBe(true);
    });

    it('returns false for /admin/dashboard without error param', () => {
      expect(isForbiddenPage('/vi/admin/dashboard', urlSearchParams(''))).toBe(false);
    });

    it('returns false for /admin/dashboard with different error', () => {
      expect(isForbiddenPage('/vi/admin/dashboard', urlSearchParams('error=not-found'))).toBe(false);
    });

    it('returns false for non-admin path with error=forbidden', () => {
      expect(isForbiddenPage('/vi/sign-in', urlSearchParams('error=forbidden'))).toBe(false);
    });

    it('returns false for customer /dashboard with error=forbidden (not admin)', () => {
      expect(isForbiddenPage('/vi/dashboard', urlSearchParams('error=forbidden'))).toBe(false);
    });

    it('returns false when searchParams is empty (no query string)', () => {
      expect(isForbiddenPage('/vi/admin/dashboard', urlSearchParams('').toString() === ''
        ? urlSearchParams('')
        : urlSearchParams(''))).toBe(false); // safe check
    });

    // e2e: simulate đúng flow redirect loop
    it('e2e: forbidden redirect lands on a safe URL that isForbiddenPage detects', () => {
      // Mô phỏng flow:
      // 1. User truy cập /admin/requests → role không đủ → redirect → /admin/dashboard?error=forbidden
      // 2. Request mới tới /admin/dashboard?error=forbidden
      // 3. Middleware thấy isForbiddenPage = true → pass-through (không redirect nữa)

      const forbiddenUrl = '/vi/admin/dashboard?error=forbidden';
      const parsed = forbiddenUrl.split('?');
      const pathname = parsed[0];
      const searchParams = new URLSearchParams(parsed[1] || '');

      // Bước 1: đây là admin route
      expect(isAdminPath(pathname)).toBe(true);

      // Bước 2: isForbiddenPage phát hiện và ngăn redirect loop
      expect(isForbiddenPage(pathname, searchParams)).toBe(true);

      // Bước 3: không còn redirect nữa → page render bình thường
      // (đã verified trong middleware.ts: if isForbidden → return response)
    });

    it('e2e: URL có extra params vẫn detect forbidden đúng', () => {
      const complexUrl = '/ja/admin/dashboard?error=forbidden&ts=' + '123';
      const searchParams = new URLSearchParams('error=forbidden&ts=123');
      expect(isForbiddenPage('/ja/admin/dashboard', searchParams)).toBe(true);
    });
  });
});
