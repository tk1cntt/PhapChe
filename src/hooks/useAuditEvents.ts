import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface AuditEventParams {
  page?: number;
  pageSize?: number;
  actor?: string;
  action?: string;
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
 * Hook to fetch paginated audit events list
 *
 * @param params - Optional filter parameters (page, pageSize, actor, action)
 * @returns Query result with audit events data and pagination metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAuditEvents({ page: 1, pageSize: 20, actor: 'admin' });
 * ```
 */
export function useAuditEvents(params?: AuditEventParams) {
  return useQuery({
    queryKey: queryKeys.auditEvents.list(params as Record<string, unknown>),
    queryFn: () => adminApi.getAuditLog(params) as Promise<PaginatedResponse>,
    staleTime: 60 * 1000, // 1 minute - audit events need fresh data
  });
}
