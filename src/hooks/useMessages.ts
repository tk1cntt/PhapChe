import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Hook to fetch message threads
 *
 * @param requestId - Optional request ID to filter threads
 * @returns Query result with message threads
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMessages('request-123');
 * ```
 */
export function useMessages(requestId?: string) {
  return useQuery({
    queryKey: queryKeys.messages.list({ requestId }),
    queryFn: () => messagesApi.getThreads({ requestId }),
    staleTime: 30 * 1000, // 30 seconds - messages are real-time
  });
}

/**
 * Hook to fetch a single message thread by ID
 *
 * @param id - Thread ID
 * @returns Query result with thread details
 */
export function useMessageById(id: string) {
  return useQuery({
    queryKey: queryKeys.messages.detail(id),
    queryFn: () => messagesApi.get(id),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}
