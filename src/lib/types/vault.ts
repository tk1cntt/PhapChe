/**
 * Vault Type Definitions
 */

export type StorageProvider = 'local' | 's3';

/**
 * Vault file entity representing a stored document
 */
export interface VaultFile {
  id: string;
  workspaceId: string;
  requestId?: string;
  folderId?: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: StorageProvider;
  uploadedBy: string;
  uploadedByName?: string;
  tags?: VaultTag[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vault folder entity
 */
export interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  workspaceId: string;
  fileCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vault tag for categorizing files
 */
export interface VaultTag {
  id: string;
  name: string;
  color?: string;
  workspaceId: string;
  createdAt: Date;
}

/**
 * Vault file with signed download URL
 */
export interface VaultFileWithUrl extends VaultFile {
  downloadUrl: string;
  /** ISO 8601 date string */
  downloadUrlExpiresAt: string;
}

/**
 * Vault filters for listing
 */
export interface VaultFilters {
  folderId?: string;
  tagIds?: string[];
  search?: string;
  mimeTypes?: string[];
  uploadedBy?: string;
  /** ISO 8601 date string */
  dateFrom?: string;
  /** ISO 8601 date string */
  dateTo?: string;
}

/**
 * Input for uploading a file
 */
export interface UploadFileInput {
  file: File;
  folderId?: string;
  requestId?: string;
  tags?: string[];
}

/**
 * Input for creating a folder
 */
export interface CreateFolderInput {
  name: string;
  parentId?: string;
}

/**
 * Input for updating a folder
 */
export interface UpdateFolderInput {
  name?: string;
  parentId?: string;
}

/**
 * Vault statistics
 */
export interface VaultStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  byMimeType: Record<string, number>;
}

/**
 * Storage provider configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  bucket?: string;
  region?: string;
  endpoint?: string;
  publicUrl?: string;
}
