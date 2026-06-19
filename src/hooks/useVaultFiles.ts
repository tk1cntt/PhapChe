import { useQuery } from '@tanstack/react-query';
import { vaultApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface VaultFileParams {
  page?: number;
  pageSize?: number;
  search?: string;
  folderId?: string;
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
 * Hook to fetch paginated vault files list
 *
 * @param params - Optional filter parameters (page, pageSize, search, folderId)
 * @returns Query result with vault files data and pagination metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useVaultFiles({ page: 1, pageSize: 20, folderId: 'abc123' });
 * ```
 */
export function useVaultFiles(params?: VaultFileParams) {
  return useQuery({
    queryKey: queryKeys.vaultFiles.list(params as Record<string, unknown>),
    queryFn: () => vaultApi.list(params) as Promise<PaginatedResponse>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single vault file by ID
 *
 * @param id - Vault file ID
 * @returns Query result with vault file details
 */
export function useVaultFileById(id: string) {
  return useQuery({
    queryKey: queryKeys.vaultFiles.detail(id),
    queryFn: () => vaultApi.get(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}
