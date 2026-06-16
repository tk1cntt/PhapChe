/**
 * Storage API Client
 *
 * Client functions for file operations via the API.
 */

import { apiClient, type ApiResponse } from './client';

// Types for API responses
export interface FileUploadResponse {
  id: string;
  workspaceId: string;
  requestId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string;
  category: string;
  visibility: string;
  status: string;
  objectKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata extends FileUploadResponse {
  downloadUrl?: string;
}

export interface FileAccessLogItem {
  id: string;
  fileId: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaginatedAccessLogs {
  data: FileAccessLogItem[];
  total: number;
}

/**
 * Upload a file to storage
 *
 * @param file - The file to upload
 * @param options - Upload options
 * @returns Uploaded file metadata
 */
export async function uploadFile(
  file: File,
  options: {
    organizationId: string;
    requestId?: string;
    category?: string;
    visibility?: string;
  }
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('organizationId', options.organizationId);
  if (options.requestId) {
    formData.append('requestId', options.requestId);
  }
  formData.append('category', options.category || 'request_upload');
  formData.append('visibility', options.visibility || 'private');

  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get file metadata
 *
 * @param fileId - The file ID
 * @returns File metadata with download URL
 */
export async function getFile(fileId: string): Promise<FileMetadata> {
  return apiClient.get<FileMetadata>(`/api/files/${fileId}`);
}

/**
 * Download a file
 *
 * @param fileId - The file ID
 * @returns File as Blob
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await fetch(`/api/files/${fileId}/download`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(error.error || 'Download failed');
  }

  return response.blob();
}

/**
 * Delete a file
 *
 * @param fileId - The file ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(error.error || 'Delete failed');
  }
}

/**
 * Get file access logs
 *
 * @param fileId - The file ID
 * @param params - Pagination parameters
 * @returns Paginated access logs
 */
export async function getAccessLogs(
  fileId: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<PaginatedAccessLogs> {
  const response = await apiClient.get<PaginatedAccessLogs>(`/api/files/${fileId}/access-logs`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  });
  return response;
}
