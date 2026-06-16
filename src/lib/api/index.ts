/**
 * Central API Module
 * Import from here instead of creating duplicate API calls
 *
 * Usage:
 * import { requestsApi } from '@/lib/api';
 * const { data } = await requestsApi.list({ status: 'draft' });
 */

import { apiClient, ApiClient } from './client';

export { apiClient, ApiClient };
export type { RequestOptions, ApiResponse, ErrorResponse } from './client';

// Type definitions for API responses
interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

/**
 * Request APIs
 */
export const requestsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    search?: string;
  }) =>
    apiClient.get<{ data: unknown[]; meta?: PaginationMeta }>('/api/requests', { params }),

  get: (id: string) =>
    apiClient.get<{ data: unknown }>(`/api/requests/${id}`),

  create: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/requests', data),

  update: (id: string, data: unknown) =>
    apiClient.put<{ data: unknown }>(`/api/requests/${id}`, data),

  patch: (id: string, data: unknown) =>
    apiClient.patch<{ data: unknown }>(`/api/requests/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ data: unknown }>(`/api/requests/${id}`),

  getWorkflow: (id: string) =>
    apiClient.get<{ data: unknown }>(`/api/requests/${id}/workflow`),

  transition: (id: string, data: unknown) =>
    apiClient.post<{ data: unknown }>(`/api/requests/${id}/workflow/transition`, data),

  getMessages: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/api/requests/${id}/messages`),

  addMessage: (id: string, data: unknown) =>
    apiClient.post<{ data: unknown }>(`/api/requests/${id}/messages`, data),

  getDocuments: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/api/requests/${id}/documents`),

  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ data: unknown }>(`/api/requests/${id}/documents`, formData);
  },

  getAuditLog: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/api/requests/${id}/audit`),
};

/**
 * User APIs
 */
export const usersApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }) =>
    apiClient.get<{ data: unknown[]; meta?: PaginationMeta }>('/api/admin/users', { params }),

  get: (id: string) =>
    apiClient.get<{ data: unknown }>(`/api/admin/users/${id}`),

  create: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/admin/users', data),

  update: (id: string, data: unknown) =>
    apiClient.put<{ data: unknown }>(`/api/admin/users/${id}`, data),

  deactivate: (id: string) =>
    apiClient.delete<{ data: unknown }>(`/api/admin/users/${id}`),

  changeRole: (id: string, role: string) =>
    apiClient.put<{ data: unknown }>(`/api/admin/users/${id}/role`, { role }),
};

/**
 * Workspace APIs
 */
export const workspacesApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) =>
    apiClient.get<{ data: unknown[]; meta?: PaginationMeta }>('/api/workspaces', { params }),

  get: (id: string) =>
    apiClient.get<{ data: unknown }>(`/api/workspaces/${id}`),

  create: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/workspaces', data),

  update: (id: string, data: unknown) =>
    apiClient.put<{ data: unknown }>(`/api/workspaces/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ data: unknown }>(`/api/workspaces/${id}`),

  getMembers: (id: string) =>
    apiClient.get<{ data: unknown[] }>(`/api/workspaces/${id}/members`),

  inviteMember: (id: string, email: string, role: string) =>
    apiClient.post<{ data: unknown }>(`/api/workspaces/${id}/invite`, { email, role }),

  removeMember: (id: string, userId: string) =>
    apiClient.delete<{ data: unknown }>(`/api/workspaces/${id}/members/${userId}`),
};

/**
 * Message APIs
 */
export const messagesApi = {
  getThreads: (params?: { requestId?: string }) =>
    apiClient.get<{ data: unknown[] }>('/api/messages', { params }),

  getThread: (threadId: string) =>
    apiClient.get<{ data: unknown[] }>(`/api/messages/${threadId}`),

  send: (requestId: string, content: string) =>
    apiClient.post<{ data: unknown }>('/api/messages/send', { requestId, content }),

  poll: (requestId: string) =>
    apiClient.get<{ data: unknown[] }>('/api/messages/poll', { params: { requestId } }),

  markRead: (messageId: string) =>
    apiClient.put<{ data: unknown }>(`/api/messages/${messageId}/read`, {}),
};

/**
 * Vault APIs
 */
export const vaultApi = {
  list: (params?: {
    folderId?: string;
    tagId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) =>
    apiClient.get<{ data: unknown[]; meta?: PaginationMeta }>('/api/vault', { params }),

  get: (fileId: string) =>
    apiClient.get<{ data: unknown }>(`/api/vault/${fileId}`),

  upload: async (file: File, folderId?: string, requestId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (requestId) formData.append('requestId', requestId);

    const response = await fetch('/api/vault/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return response.json();
  },

  download: (fileId: string) =>
    apiClient.get<Blob>(`/api/vault/${fileId}/download`),

  getDownloadUrl: (fileId: string) =>
    apiClient.get<{ data: { url: string } }>(`/api/vault/${fileId}/download`),

  delete: (fileId: string) =>
    apiClient.delete<{ data: unknown }>(`/api/vault/${fileId}`),

  addTags: (fileId: string, tagIds: string[]) =>
    apiClient.post<{ data: unknown }>(`/api/vault/${fileId}/tags`, { tagIds }),

  removeTag: (fileId: string, tagId: string) =>
    apiClient.delete<{ data: unknown }>(`/api/vault/${fileId}/tags/${tagId}`),

  listFolders: (params?: { parentId?: string }) =>
    apiClient.get<{ data: unknown[] }>('/api/vault/folders', { params }),

  createFolder: (name: string, parentId?: string) =>
    apiClient.post<{ data: unknown }>('/api/vault/folders', { name, parentId }),

  updateFolder: (folderId: string, name: string) =>
    apiClient.put<{ data: unknown }>(`/api/vault/folders/${folderId}`, { name }),

  deleteFolder: (folderId: string) =>
    apiClient.delete<{ data: unknown }>(`/api/vault/folders/${folderId}`),
};

/**
 * Settings APIs
 */
export const settingsApi = {
  getProfile: () =>
    apiClient.get<{ data: unknown }>('/api/settings/profile'),

  updateProfile: (data: unknown) =>
    apiClient.put<{ data: unknown }>('/api/settings/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ data: unknown }>('/api/settings/password', { currentPassword, newPassword }),

  getNotifications: () =>
    apiClient.get<{ data: unknown }>('/api/settings/notifications'),

  updateNotifications: (data: unknown) =>
    apiClient.put<{ data: unknown }>('/api/settings/notifications', data),

  getAuditLog: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<{ data: unknown[]; meta?: PaginationMeta }>('/api/settings/audit', { params }),
};

/**
 * Admin APIs
 */
export const adminApi = {
  getDashboard: () =>
    apiClient.get<{ data: unknown }>('/api/admin/dashboard'),

  getStats: (params?: { period?: string }) =>
    apiClient.get<{ data: unknown }>('/api/admin/stats', { params }),

  getAuditLog: (params?: {
    page?: number;
    pageSize?: number;
    actor?: string;
    action?: string;
  }) =>
    apiClient.get<{ data: unknown[]; meta?: PaginationMeta }>('/api/admin/audit', { params }),
};

/**
 * Intake APIs
 */
export const intakeApi = {
  getForms: () =>
    apiClient.get<{ data: unknown[] }>('/api/intake/forms'),

  getForm: (code: string) =>
    apiClient.get<{ data: unknown }>(`/api/intake/forms/${code}`),

  submit: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/intake/submit', data),
};

/**
 * Workflow APIs
 */
export const workflowsApi = {
  list: () =>
    apiClient.get<{ data: unknown[] }>('/api/workflows'),

  get: (code: string) =>
    apiClient.get<{ data: unknown }>(`/api/workflows/${code}`),

  create: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/workflows', data),

  update: (id: string, data: unknown) =>
    apiClient.put<{ data: unknown }>(`/api/workflows/${id}`, data),
};

/**
 * Template APIs
 */
export const templatesApi = {
  list: () =>
    apiClient.get<{ data: unknown[] }>('/api/templates'),

  get: (code: string) =>
    apiClient.get<{ data: unknown }>(`/api/templates/${code}`),

  create: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/templates', data),

  update: (id: string, data: unknown) =>
    apiClient.put<{ data: unknown }>(`/api/templates/${id}`, data),

  render: (id: string, data: unknown) =>
    apiClient.post<{ data: { rendered: string } }>(`/api/templates/${id}/render`, data),

  preview: (id: string, data: unknown) =>
    apiClient.post<{ data: { preview: string } }>(`/api/templates/${id}/preview`, data),
};
