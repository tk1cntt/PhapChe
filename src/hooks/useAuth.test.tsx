import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock the auth client
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

import { useSession } from '@/lib/auth-client';

const mockUseSession = vi.mocked(useSession);

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated State', () => {
    it('should return user data when session exists', () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        isPending: false,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return correct user properties', () => {
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        isPending: false,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user?.id).toBe('123');
      expect(result.current.user?.name).toBe('Test User');
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  describe('Unauthenticated State', () => {
    it('should return null user when no session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should show authenticated as false with null session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should show loading while session is being fetched', () => {
      mockUseSession.mockReturnValue({
        data: undefined,
        isPending: true,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Return Type', () => {
    it('should return object with user, isLoading, isAuthenticated properties', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: '1' } },
        isPending: false,
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isAuthenticated');
    });
  });
});
