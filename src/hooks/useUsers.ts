import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
}

interface PaginatedResponse {
  data: unknown[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
}

/**
 * Hook to fetch paginated users list
 *
 * @param params - Optional filter parameters (page, pageSize, search, role)
 * @returns Query result with users data and pagination metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUsers({ page: 1, pageSize: 20, role: 'admin' });
 * ```
 */
export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: () => usersApi.list(params) as Promise<PaginatedResponse>,
    staleTime: 5 * 60 * 1000, // 5 minutes - users are relatively stable
  });
}

/**
 * Hook to fetch a single user by ID
 *
 * @param id - User ID
 * @returns Query result with user details
 */
export function useUserById(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.get(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}
