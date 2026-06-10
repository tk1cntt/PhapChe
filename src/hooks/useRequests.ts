import { useQuery } from "@tanstack/react-query";

// Query key convention: ['entity', workspaceId?, options]
export const queryKeys = {
  requests: (workspaceId?: string) => ["requests", workspaceId] as const,
  // Can add filters as third element: ['requests', workspaceId, { status: 'open' }]
};

interface Request {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

async function fetchRequests(workspaceId?: string): Promise<Request[]> {
  // TODO: Replace with actual API call in Phase 25
  // Mock data for now - demonstrates the query hook pattern
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    {
      id: "1",
      title: "Yeu cau kiem tra hop dong",
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function useRequests(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.requests(workspaceId),
    queryFn: () => fetchRequests(workspaceId),
    staleTime: 30 * 1000, // 30 seconds - can override default
  });
}
