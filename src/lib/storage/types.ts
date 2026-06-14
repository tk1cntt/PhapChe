/**
 * Storage Domain Types
 *
 * Provides types for the storage abstraction layer.
 * StorageProvider interface enables pluggable backends (local, S3).
 */

// ============================================================================
// Enums (as const objects for TypeScript)
// ============================================================================

export const FileCategory = {
  REQUEST_UPLOAD: 'request_upload',
  GENERATED_DOCUMENT: 'generated_document',
  VAULT_FILE: 'vault_file',
  TEMPLATE: 'template',
  OCR_OUTPUT: 'ocr_output',
  AUDIT_EXPORT: 'audit_export',
} as const;

export type FileCategory = typeof FileCategory[keyof typeof FileCategory];

export const FileVisibility = {
  PRIVATE: 'private',
  CUSTOMER_VISIBLE: 'customer_visible',
  RESTRICTED: 'restricted',
} as const;

export type FileVisibility = typeof FileVisibility[keyof typeof FileVisibility];

export const FileStatus = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  DELETED: 'deleted',
} as const;

export type FileStatus = typeof FileStatus[keyof typeof FileStatus];

export const FileAccessAction = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  VIEW: 'view',
  DELETE: 'delete',
  SHARE: 'share',
} as const;

export type FileAccessAction = typeof FileAccessAction[keyof typeof FileAccessAction];

export const StorageDriver = {
  LOCAL: 'local',
  S3: 's3',
} as const;

export type StorageDriver = typeof StorageDriver[keyof typeof StorageDriver];

// ============================================================================
// Storage Provider Interface
// ============================================================================

export interface UploadFileInput {
  objectKey: string;
  buffer?: Buffer;
  stream?: ReadableStream;
  mimeType: string;
  originalName: string;
  metadata?: Record<string, string>;
}

export interface GetObjectInput {
  objectKey: string;
  bucket?: string;
}

export interface GetDownloadUrlInput {
  objectKey: string;
  bucket?: string;
  expiresIn?: number; // seconds
}

export interface DeleteObjectInput {
  objectKey: string;
  bucket?: string;
}

export interface ExistsObjectInput {
  objectKey: string;
  bucket?: string;
}

export interface CopyObjectInput {
  sourceKey: string;
  destinationKey: string;
  sourceBucket?: string;
  destinationBucket?: string;
}

export interface MoveObjectInput {
  sourceKey: string;
  destinationKey: string;
  sourceBucket?: string;
  destinationBucket?: string;
}

export interface StoredObject {
  objectKey: string;
  size: number;
  mimeType: string;
  checksum?: string;
  storageDriver: StorageDriver;
  bucket?: string;
}

export interface StorageProvider {
  upload(input: UploadFileInput): Promise<StoredObject>;
  getObject(input: GetObjectInput): Promise<Buffer | ReadableStream>;
  getDownloadUrl(input: GetDownloadUrlInput): Promise<string>;
  deleteObject(input: DeleteObjectInput): Promise<void>;
  exists(input: ExistsObjectInput): Promise<boolean>;
  copyObject(input: CopyObjectInput): Promise<StoredObject>;
  moveObject(input: MoveObjectInput): Promise<StoredObject>;
}

// ============================================================================
// Storage Configuration
// ============================================================================

export interface StorageConfig {
  driver: StorageDriver;
  local?: {
    rootPath: string;
  };
  s3?: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
  };
  publicBaseUrl?: string;
  signedUrlExpiresIn?: number; // seconds, default 900 (15 min)
  maxFileSize?: number; // bytes, default 50MB
}

// ============================================================================
// File Record Types (from database)
// ============================================================================

export interface FileRecord {
  id: string;
  workspaceId: string;
  requestId?: string | null;
  storageDriver: StorageDriver;
  bucket?: string | null;
  objectKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string | null;
  category: FileCategory;
  visibility: FileVisibility;
  status: FileStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileVersionRecord {
  id: string;
  fileId: string;
  versionNumber: number;
  storageDriver: StorageDriver;
  bucket?: string | null;
  objectKey: string;
  size: number;
  checksum?: string | null;
  createdById: string;
  createdAt: Date;
}

export interface FileAccessLogRecord {
  id: string;
  fileId: string;
  userId?: string | null;
  action: FileAccessAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

// ============================================================================
// Service Input Types
// ============================================================================

export interface UploadFileServiceInput {
  organizationId: string;
  requestId?: string;
  file: Buffer | ArrayBuffer;
  originalName: string;
  mimeType: string;
  category: FileCategory;
  visibility: FileVisibility;
  createdBy: string;
}

export interface GetFileInput {
  fileId: string;
  userId: string;
}

export interface GetDownloadUrlServiceInput {
  fileId: string;
  userId: string;
}

export interface DeleteFileServiceInput {
  fileId: string;
  userId: string;
}

export interface GetAccessLogsInput {
  fileId: string;
  userId: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Allowed MIME Types
// ============================================================================

export const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Other
  'application/json',
  'application/xml',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

// ============================================================================
// Error Types
// ============================================================================

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(objectKey: string) {
    super(`File not found: ${objectKey}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
  }
}

export class FileValidationError extends StorageError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'FileValidationError';
  }
}

export class FilePermissionError extends StorageError {
  constructor(message: string = 'Access denied') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'FilePermissionError';
  }
}
