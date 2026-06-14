/**
 * Vault Type Definitions
 */

/**
 * Vault file entity representing a stored document
 */
export interface VaultFile {
  id: string;
  requestId?: string;
  folderId?: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: 'local' | 's3';
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
  downloadUrlExpiresAt: Date;
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
  dateFrom?: Date;
  dateTo?: Date;
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
  provider: 'local' | 's3';
  bucket?: string;
  region?: string;
  endpoint?: string;
  publicUrl?: string;
}
