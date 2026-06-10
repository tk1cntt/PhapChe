import { useQuery } from "@tanstack/react-query";
import { PaginationOptions } from "./useRequests";

// Query key convention: ['entity', workspaceId?, options]
export const queryKeys = {
  users: (workspaceId?: string, options?: PaginationOptions) =>
    ["users", workspaceId, options] as const,
};

export interface UserRow {
  key: string;
  name: string;
  email: string;
  role: string;
  workspace: string;
  status: string;
}

interface PaginatedResponse {
  data: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchUsers(
  workspaceId?: string,
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (options?.page) params.set("page", String(options.page));
  if (options?.pageSize) params.set("pageSize", String(options.pageSize));
  if (options?.search) params.set("search", options.search);
  if (options?.filters?.role) params.set("role", options.filters.role);

  const queryString = params.toString();
  const url = `/api/users${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

export function useUsers(
  workspaceId?: string,
  options?: PaginationOptions
) {
  return useQuery({
    queryKey: queryKeys.users(workspaceId, options),
    queryFn: () => fetchUsers(workspaceId, options),
    staleTime: 30 * 1000, // 30 seconds
  });
}
