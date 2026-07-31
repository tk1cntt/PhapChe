/**
 * Storage API Client
 *
 * Client functions for file operations via the API.
 */

import { apiClient } from './client';

// Base URLs
const FILES_ENDPOINT = '/api/files';

async function assertResponseOk(response: Response, fallbackMessage: string): Promise<void> {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const body = await response.json();
      message = body.error || body.message || fallbackMessage;
    } catch {
      // non-JSON response; keep fallback
    }
    throw new Error(`${message} (HTTP ${response.status}: ${response.statusText})`);
  }
}

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

  const response = await fetch(FILES_ENDPOINT, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  await assertResponseOk(response, 'Upload failed');

  const result = await response.json();
  if (!result?.data) {
    throw new Error('Upload succeeded but no file data returned');
  }
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
  const response = await fetch(`${FILES_ENDPOINT}/${fileId}/download`, {
    method: 'GET',
    credentials: 'include',
  });

  await assertResponseOk(response, 'Download failed');

  return response.blob();
}

/**
 * Delete a file
 *
 * @param fileId - The file ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`${FILES_ENDPOINT}/${fileId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await assertResponseOk(response, 'Delete failed');
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
