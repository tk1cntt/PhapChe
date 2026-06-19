import { useSession } from '@/lib/auth-client';

/**
 * useAuth — hook để truy cập thông tin user và session hiện tại.
 * Wrap Better Auth's useSession hook.
 *
 * @returns user - Thông tin user hiện tại hoặc null nếu chưa đăng nhập
 * @returns isLoading - Đang tải session
 * @returns isAuthenticated - User đã đăng nhập hay chưa
 */
export function useAuth() {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const isAuthenticated = !!user;
  const isLoading = isPending;

  return { user, isLoading, isAuthenticated };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
