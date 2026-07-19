/**
 * Role Configuration — Shared role constants and visibility maps
 *
 * Dùng chung cho middleware-guard, AdminLayout sidebar, và requests page tabs.
 * MỌI thay đổi role permission nên tập trung ở file này.
 */

import type { AppRole } from '@/lib/types';

/** Tất cả role admin */
export const ALL_ADMIN_ROLES: readonly AppRole[] = [
  'super_admin',
  'coordinator_admin',
  'audit_admin',
  'specialist',
  'reviewer',
] as const;

/**
 * Menu visibility: key = menu item key, value = roles được phép thấy (null = luôn hiện).
 */
export const MENU_VISIBILITY: Record<string, readonly AppRole[] | null> = {
  dashboard: null,
  requests: ['super_admin', 'coordinator_admin'],
  users: ['super_admin', 'coordinator_admin'],
  workspace: ['super_admin', 'coordinator_admin'],
  partner: ['super_admin', 'coordinator_admin'],
  organizations: ['super_admin'],
  operations: ['super_admin', 'coordinator_admin'],
  audit: ['super_admin', 'coordinator_admin', 'audit_admin'],
  vault: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
} as const;

/**
 * Tab visibility cho requests page.
 * Mỗi role sẽ thấy các tab khác nhau.
 */
export const TAB_VISIBILITY: Record<string, readonly AppRole[]> = {
  triage: ['super_admin', 'coordinator_admin'],
  workbench: ['super_admin', 'coordinator_admin', 'specialist'],
  review: ['super_admin', 'coordinator_admin', 'reviewer'],
  delivery: ['super_admin', 'coordinator_admin'],
  all: ['super_admin', 'coordinator_admin'],
} as const;

/**
 * Admin route → roles được phép truy cập.
 */
export const ADMIN_ROUTE_GUARDS: Record<string, readonly AppRole[]> = {
  requests: ['super_admin', 'coordinator_admin'],
  dashboard: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer', 'audit_admin'],
  vault: ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'],
  users: ['super_admin', 'coordinator_admin'],
  workspace: ['super_admin', 'coordinator_admin'],
  partner: ['super_admin', 'coordinator_admin'],
  operations: ['super_admin', 'coordinator_admin'],
  audit: ['super_admin', 'coordinator_admin', 'audit_admin'],
  organizations: ['super_admin'],
} as const;

/**
 * Kiểm tra user có ít nhất một role trong allowed không.
 */
export function hasAnyRole(userRoles: readonly string[], allowedRoles: readonly string[]): boolean {
  if (userRoles.length === 0) return false;
  return userRoles.some(r => allowedRoles.includes(r));
}

/**
 * Kiểm tra một menu key có hiển thị với role của user không.
 */
export function canSeeMenu(menuKey: string, userRoles: readonly string[]): boolean {
  const required = MENU_VISIBILITY[menuKey];
  if (required === null) return true;
  if (!required) return false;
  return hasAnyRole(userRoles, required);
}

/**
 * Kiểm tra một tab trên requests page có hiển thị không.
 */
export function canSeeTab(tabKey: string, userRoles: readonly string[]): boolean {
  const required = TAB_VISIBILITY[tabKey];
  if (!required) return false;
  return hasAnyRole(userRoles, required);
}

/**
 * Kiểm tra user có quyền truy cập một admin route cụ thể không.
 * Dùng trong page-level guard (Node.js server component).
 *
 * Ví dụ: canAccessRoute('users', session.roles) → true/false
 */
export function canAccessRoute(routeKey: string, userRoles: readonly string[]): boolean {
  const required = ADMIN_ROUTE_GUARDS[routeKey];
  if (!required) return true; // Route chưa config → allow (sẽ được thêm sau)
  return hasAnyRole(userRoles, required);
}
