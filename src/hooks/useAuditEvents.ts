import { useQuery } from "@tanstack/react-query";
import { PaginationOptions } from "./useRequests";

// Query key convention: ['entity', options]
export const queryKeys = {
  auditEvents: (options?: PaginationOptions) =>
    ["auditEvents", options] as const,
};

export interface AuditEventRecord {
  id: string;
  actorId: string | null;
  workspaceId: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: string;
  actor: { email: string | null; name: string | null } | null;
  workspace: { name: string };
}

interface PaginatedResponse {
  data: AuditEventRecord[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchAuditEvents(
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.pageSize) params.set("pageSize", String(options.pageSize));
  if (options?.search) params.set("search", options.search);
  if (options?.filters?.action) params.set("action", options.filters.action);

  const queryString = params.toString();
  const url = `/api/audit/events${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch audit events");
  }
  return response.json();
}

export function useAuditEvents(options?: PaginationOptions) {
  return useQuery({
    queryKey: queryKeys.auditEvents(options),
    queryFn: () => fetchAuditEvents(options),
    staleTime: 30 * 1000, // 30 seconds
  });
}
