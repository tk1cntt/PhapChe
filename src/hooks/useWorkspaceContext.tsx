'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspacesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from './useAuth';

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  organizationId?: string;
  isActive: boolean;
}

interface OrganizationInfo {
  id: string;
  name: string;
  tenantId: string;
  status: string;
  isDefault: boolean;
}

interface WorkspaceContextValue {
  workspace: WorkspaceInfo | null;
  organization: OrganizationInfo | null;
  isLoading: boolean;
  error: Error | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  organization: null,
  isLoading: false,
  error: null,
});

/**
 * WorkspaceProvider - cung cấp workspace context cho toàn bộ app
 *
 * Nhận activeWorkspaceId từ server, fetch workspace + org data qua React Query.
 * Cache được quản lý bởi React Query với staleTime mặc định 5 phút.
 */
export function WorkspaceProvider({
  children,
  activeWorkspaceId,
}: {
  children: ReactNode;
  activeWorkspaceId?: string | null;
}) {
  const { isAuthenticated } = useAuth();

  const workspaceQuery = useQuery({
    queryKey: queryKeys.workspaces.detail(activeWorkspaceId || ''),
    queryFn: () => workspacesApi.get(activeWorkspaceId!),
    enabled: !!activeWorkspaceId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace: (workspaceQuery.data as WorkspaceInfo) || null,
    organization: null, // Organization data fetched separately when needed
    isLoading: workspaceQuery.isLoading,
    error: workspaceQuery.error as Error | null,
  }), [workspaceQuery.data, workspaceQuery.isLoading, workspaceQuery.error]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * useWorkspaceContext - Hook để lấy current workspace và org info
 *
 * @returns WorkspaceContextValue với workspace, organization, isLoading, error
 *
 * @example
 * ```tsx
 * const { workspace, isLoading } = useWorkspaceContext();
 * if (isLoading) return <LoadingSkeleton variant="text-line" />;
 * return <div>{workspace?.name}</div>;
 * ```
 */
export function useWorkspaceContext(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
