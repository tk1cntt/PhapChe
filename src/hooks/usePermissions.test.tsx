import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('usePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role-based Permissions', () => {
    it('should allow all permissions for super_admin role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Super Admin', email: 'super@example.com', role: 'super_admin' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'users')).toBe(true);
      expect(result.current.can('write', 'requests')).toBe(true);
      expect(result.current.can('delete', 'vaultFiles')).toBe(true);
    });

    it('should allow customer to read and create requests', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Customer', email: 'customer@example.com', role: 'customer' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'requests')).toBe(true);
      expect(result.current.can('create', 'requests')).toBe(true);
      expect(result.current.can('write', 'users')).toBe(false);
      expect(result.current.can('delete', 'auditEvents')).toBe(false);
    });

    it('should allow specialist to read and write requests', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Specialist', email: 'specialist@example.com', role: 'specialist' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'requests')).toBe(true);
      expect(result.current.can('write', 'requests')).toBe(true);
      expect(result.current.can('read', 'users')).toBe(false);
      expect(result.current.can('delete', 'requests')).toBe(false);
    });

    it('should allow coordinator_admin to read requests, users, workspaces, audit, and write requests', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Coordinator', email: 'coordinator@example.com', role: 'coordinator_admin' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'requests')).toBe(true);
      expect(result.current.can('write', 'requests')).toBe(true);
      expect(result.current.can('read', 'users')).toBe(true);
      expect(result.current.can('read', 'workspaces')).toBe(true);
      expect(result.current.can('read', 'audit')).toBe(true);
      expect(result.current.can('delete', 'users')).toBe(false);
    });

    it('should allow reviewer to read and review requests, and read audit', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Reviewer', email: 'reviewer@example.com', role: 'reviewer' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'requests')).toBe(true);
      expect(result.current.can('review', 'requests')).toBe(true);
      expect(result.current.can('read', 'audit')).toBe(true);
      expect(result.current.can('write', 'requests')).toBe(false);
      expect(result.current.can('delete', 'users')).toBe(false);
    });
  });

  describe('Unauthenticated State', () => {
    it('should deny all permissions when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'users')).toBe(false);
      expect(result.current.can('write', 'requests')).toBe(false);
      expect(result.current.can('delete', 'vaultFiles')).toBe(false);
    });

    it('should deny all permissions when user has no role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'User', email: 'user@example.com' } as any,
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can('read', 'users')).toBe(false);
      expect(result.current.can('write', 'requests')).toBe(false);
    });
  });

  describe('cannot() Function', () => {
    it('should return opposite of can() for super_admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Super Admin', email: 'super@example.com', role: 'super_admin' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.cannot('read', 'users')).toBe(false);
      expect(result.current.cannot('write', 'requests')).toBe(false);
    });

    it('should return opposite of can() for customer', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Customer', email: 'customer@example.com', role: 'customer' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.cannot('read', 'requests')).toBe(false);
      expect(result.current.cannot('write', 'users')).toBe(true);
    });

    it('should return true for all cannot() when unauthenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.cannot('read', 'users')).toBe(true);
      expect(result.current.cannot('write', 'requests')).toBe(true);
    });
  });

  describe('Return Type', () => {
    it('should return object with can and cannot functions', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'super_admin' },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current).toHaveProperty('can');
      expect(result.current).toHaveProperty('cannot');
      expect(typeof result.current.can).toBe('function');
      expect(typeof result.current.cannot).toBe('function');
    });
  });
});
