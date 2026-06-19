import { useQuery } from '@tanstack/react-query';
import { workspacesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface WorkspaceListParams {
  page?: number;
  pageSize?: number;
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
 * Hook to fetch paginated workspaces list
 *
 * @param params - Optional filter parameters (page, pageSize, search)
 * @returns Query result with workspaces data and pagination metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useWorkspaces({ page: 1, pageSize: 20 });
 * ```
 */
export function useWorkspaces(params?: WorkspaceListParams) {
  return useQuery({
    queryKey: queryKeys.workspaces.list(params as Record<string, unknown>),
    queryFn: () => workspacesApi.list(params) as Promise<PaginatedResponse>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single workspace by ID
 *
 * @param id - Workspace ID
 * @returns Query result with workspace details
 */
export function useWorkspaceById(id: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => workspacesApi.get(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}
