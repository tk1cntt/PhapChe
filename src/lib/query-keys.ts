/**
 * Query Key Factories
 *
 * Centralized query key management for all domains.
 * Pattern: ['entity', ...params] — array-based for consistent cache invalidation.
 *
 * Usage:
 *   queryKeys.requests.list(filters)  → ['requests', 'list', filters]
 *   queryKeys.requests.detail(id)     → ['requests', 'detail', id]
 */

function createDomainKeys(entity: string) {
  return {
    all: [entity] as const,
    lists: () => [entity, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters ? [entity, 'list', filters] as const : [entity, 'list'] as const,
    details: () => [entity, 'detail'] as const,
    detail: (id: string) => [entity, 'detail', id] as const,
  };
}

export const queryKeys = {
  users: createDomainKeys('users'),
  requests: createDomainKeys('requests'),
  workspaces: createDomainKeys('workspaces'),
  auditEvents: createDomainKeys('auditEvents'),
  vaultFiles: createDomainKeys('vaultFiles'),
  messages: createDomainKeys('messages'),
};
