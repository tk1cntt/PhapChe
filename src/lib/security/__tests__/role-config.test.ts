import { describe, it, expect } from 'vitest';
import {
  hasAnyRole,
  canSeeMenu,
  canSeeTab,
  MENU_VISIBILITY,
  TAB_VISIBILITY,
  ALL_ADMIN_ROLES,
  ADMIN_ROUTE_GUARDS,
} from '@/lib/security/role-config';

describe('role-config', () => {
  // ── ALL_ADMIN_ROLES ──
  describe('ALL_ADMIN_ROLES', () => {
    it('contains all 5 admin roles', () => {
      expect(ALL_ADMIN_ROLES).toContain('super_admin');
      expect(ALL_ADMIN_ROLES).toContain('coordinator_admin');
      expect(ALL_ADMIN_ROLES).toContain('audit_admin');
      expect(ALL_ADMIN_ROLES).toContain('specialist');
      expect(ALL_ADMIN_ROLES).toContain('reviewer');
    });

    it('does not contain customer role', () => {
      expect(ALL_ADMIN_ROLES).not.toContain('customer');
    });

    it('is readonly tuple of exactly 5 items', () => {
      expect(ALL_ADMIN_ROLES.length).toBe(5);
    });
  });

  // ── hasAnyRole ──
  describe('hasAnyRole', () => {
    it('returns true when user has matching role', () => {
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

    it('returns true for super_admin accessing any route', () => {
      for (const roles of Object.values(ADMIN_ROUTE_GUARDS)) {
        expect(hasAnyRole(['super_admin'], roles)).toBe(true);
      }
    });
  });

  // ── canSeeMenu ──
  describe('canSeeMenu', () => {
    it('returns true for dashboard (null = always visible)', () => {
      expect(canSeeMenu('dashboard', [])).toBe(true);
      expect(canSeeMenu('dashboard', ['customer'])).toBe(true);
    });

    it('returns true for requests with allowed roles', () => {
      expect(canSeeMenu('requests', ['super_admin'])).toBe(true);
      expect(canSeeMenu('requests', ['coordinator_admin'])).toBe(true);
      expect(canSeeMenu('requests', ['specialist'])).toBe(true);
      expect(canSeeMenu('requests', ['reviewer'])).toBe(true);
    });

    it('returns false for requests with disallowed roles', () => {
      expect(canSeeMenu('requests', ['customer'])).toBe(false);
      expect(canSeeMenu('requests', ['audit_admin'])).toBe(false);
      expect(canSeeMenu('requests', [])).toBe(false);
    });

    it('users menu only visible to super_admin and coordinator_admin', () => {
      expect(canSeeMenu('users', ['super_admin'])).toBe(true);
      expect(canSeeMenu('users', ['coordinator_admin'])).toBe(true);
      expect(canSeeMenu('users', ['specialist'])).toBe(false);
      expect(canSeeMenu('users', ['reviewer'])).toBe(false);
      expect(canSeeMenu('users', ['audit_admin'])).toBe(false);
    });

    it('organizations only visible to super_admin', () => {
      expect(canSeeMenu('organizations', ['super_admin'])).toBe(true);
      expect(canSeeMenu('organizations', ['coordinator_admin'])).toBe(false);
    });

    it('audit visible to super_admin, coordinator_admin, audit_admin', () => {
      expect(canSeeMenu('audit', ['super_admin'])).toBe(true);
      expect(canSeeMenu('audit', ['coordinator_admin'])).toBe(true);
      expect(canSeeMenu('audit', ['audit_admin'])).toBe(true);
      expect(canSeeMenu('audit', ['specialist'])).toBe(false);
      expect(canSeeMenu('audit', ['reviewer'])).toBe(false);
    });

    it('returns false for unknown menu key', () => {
      expect(canSeeMenu('nonexistent', ['super_admin'])).toBe(false);
    });
  });

  // ── canSeeTab ──
  describe('canSeeTab', () => {
    it('coordinator sees all tabs', () => {
      expect(canSeeTab('triage', ['coordinator_admin'])).toBe(true);
      expect(canSeeTab('workbench', ['coordinator_admin'])).toBe(true);
      expect(canSeeTab('review', ['coordinator_admin'])).toBe(true);
      expect(canSeeTab('delivery', ['coordinator_admin'])).toBe(true);
      expect(canSeeTab('all', ['coordinator_admin'])).toBe(true);
    });

    it('specialist only sees workbench', () => {
      expect(canSeeTab('triage', ['specialist'])).toBe(false);
      expect(canSeeTab('workbench', ['specialist'])).toBe(true);
      expect(canSeeTab('review', ['specialist'])).toBe(false);
      expect(canSeeTab('delivery', ['specialist'])).toBe(false);
      expect(canSeeTab('all', ['specialist'])).toBe(false);
    });

    it('reviewer only sees review', () => {
      expect(canSeeTab('triage', ['reviewer'])).toBe(false);
      expect(canSeeTab('workbench', ['reviewer'])).toBe(false);
      expect(canSeeTab('review', ['reviewer'])).toBe(true);
      expect(canSeeTab('delivery', ['reviewer'])).toBe(false);
      expect(canSeeTab('all', ['reviewer'])).toBe(false);
    });

    it('super_admin sees all tabs', () => {
      for (const tab of Object.keys(TAB_VISIBILITY)) {
        expect(canSeeTab(tab, ['super_admin'])).toBe(true);
      }
    });

    it('returns false for unknown tab key', () => {
      expect(canSeeTab('unknown_tab', ['super_admin'])).toBe(false);
    });

    it('returns false for empty roles', () => {
      expect(canSeeTab('triage', [])).toBe(false);
    });
  });

  // ── MENU_VISIBILITY integrity ──
  describe('MENU_VISIBILITY integrity', () => {
    it('has expected keys', () => {
      const keys = Object.keys(MENU_VISIBILITY);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('requests');
      expect(keys).toContain('users');
      expect(keys).toContain('workspace');
      expect(keys).toContain('partner');
      expect(keys).toContain('organizations');
      expect(keys).toContain('operations');
      expect(keys).toContain('audit');
      expect(keys).toContain('vault');
    });

    it('only dashboard is null (always visible)', () => {
      for (const [key, roles] of Object.entries(MENU_VISIBILITY)) {
        if (key === 'dashboard') {
          expect(roles).toBeNull();
        } else {
          expect(Array.isArray(roles)).toBe(true);
          expect((roles as readonly string[]).length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ── TAB_VISIBILITY integrity ──
  describe('TAB_VISIBILITY integrity', () => {
    it('has expected tab keys', () => {
      const keys = Object.keys(TAB_VISIBILITY);
      expect(keys).toContain('triage');
      expect(keys).toContain('workbench');
      expect(keys).toContain('review');
      expect(keys).toContain('delivery');
      expect(keys).toContain('all');
    });

    it('each tab has non-empty role array', () => {
      for (const [tab, roles] of Object.entries(TAB_VISIBILITY)) {
        expect(roles.length, `Tab "${tab}" has empty roles`).toBeGreaterThan(0);
      }
    });
  });

  // ── ADMIN_ROUTE_GUARDS integrity ──
  describe('ADMIN_ROUTE_GUARDS integrity', () => {
    it('has entries for all major admin routes', () => {
      const routes = ['requests', 'dashboard', 'users', 'workspace', 'partner', 'audit', 'organizations'];
      for (const route of routes) {
        expect(ADMIN_ROUTE_GUARDS[route]).toBeDefined();
      }
    });

    it('each guard has non-empty role array', () => {
      for (const [route, roles] of Object.entries(ADMIN_ROUTE_GUARDS)) {
        expect(roles.length, `Route "${route}" has empty roles`).toBeGreaterThan(0);
      }
    });

    it('super_admin is in every guard', () => {
      for (const [route, roles] of Object.entries(ADMIN_ROUTE_GUARDS)) {
        expect(roles, `Route "${route}" should include super_admin`).toContain('super_admin');
      }
    });
  });
});
