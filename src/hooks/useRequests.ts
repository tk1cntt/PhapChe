import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface RequestListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  search?: string;
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
 * Hook to fetch paginated requests list
 *
 * @param params - Optional filter parameters (page, pageSize, status, type, search)
 * @returns Query result with requests data and pagination metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRequests({ page: 1, pageSize: 20, status: 'pending' });
 * ```
 */
export function useRequests(params?: RequestListParams) {
  return useQuery({
    queryKey: queryKeys.requests.list(params as Record<string, unknown>),
    queryFn: () => requestsApi.list(params) as Promise<PaginatedResponse>,
    staleTime: 2 * 60 * 1000, // 2 minutes - requests change frequently
  });
}

/**
 * Hook to fetch a single request by ID
 *
 * @param id - Request ID
 * @returns Query result with request details
 */
export function useRequestById(id: string) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: () => requestsApi.get(id),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });
}
