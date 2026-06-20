import { useSession } from '@/lib/auth-client';

/**
 * useAuth — Hook để truy cập thông tin user và session hiện tại.
 * Wrap Better Auth's useSession hook.
 *
 * Returns authentication state including current user, loading status, and login state.
 *
 * @returns user - Current user object or null if not authenticated
 * @returns isLoading - true while fetching session from server
 * @returns isAuthenticated - true if user has valid authentication
 *
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAuthenticated) return <LoginPage />;
 *
 * return <WelcomeUser name={user.name} />;
 * ```
 */
export function useAuth() {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const isAuthenticated = !!user;
  const isLoading = isPending;

  return { user, isLoading, isAuthenticated };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
