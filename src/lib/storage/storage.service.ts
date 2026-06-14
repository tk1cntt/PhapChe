/**
 * Storage Service
 *
 * High-level file operations with business logic.
 * Wraps StorageProvider with database operations and audit logging.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { recordFileAccessLog } from '@/lib/audit/audit-service';
import { generateSafeFileName } from './utils/file-name.util';
import { generateObjectKey } from './utils/object-key.util';
import { computeChecksum, type ChecksumAlgorithm } from './utils/checksum.util';
import { isAllowedMimeType, FilePermissionError, FileValidationError } from './types';
import type {
  StorageProvider,
  FileCategory,
  FileVisibility,
  UploadFileServiceInput,
  FileRecord,
  FileAccessLogRecord,
} from './types';

// Default max file size: 50MB
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Storage Service
 *
 * Provides high-level file operations with business logic.
 * All file access is logged for audit purposes.
 */
export class StorageService {
  private readonly provider: StorageProvider;
  private readonly maxFileSize: number;

  constructor(provider: StorageProvider, maxFileSize: number = DEFAULT_MAX_FILE_SIZE) {
    this.provider = provider;
    this.maxFileSize = maxFileSize;
  }

  /**
   * Validate file before upload
   */
  private validateFile(buffer: Buffer, mimeType: string): void {
    // Validate MIME type
    if (!isAllowedMimeType(mimeType)) {
      throw new FileValidationError(`MIME type not allowed: ${mimeType}`);
    }

    // Validate file size
    if (buffer.length > this.maxFileSize) {
      throw new FileValidationError(
        `File size exceeds maximum allowed: ${buffer.length} > ${this.maxFileSize}`
      );
    }
  }

  /**
   * Check if user has permission to access the workspace
   */
  private async checkWorkspacePermission(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId,
        userId,
        isActive: true,
      },
    });
    return !!membership;
  }

  /**
   * Upload a file
   *
   * 1. Validate file (MIME type, size)
   * 2. Generate file ID and object key
   * 3. Upload to storage provider
   * 4. Create database record
   * 5. Log access
   */
  async uploadFile(input: UploadFileServiceInput): Promise<FileRecord> {
    // Get buffer from input
    const buffer = Buffer.isBuffer(input.file)
      ? input.file
      : Buffer.from(input.file);

    // Validate file
    this.validateFile(buffer, input.mimeType);

    // Check workspace permission
    const hasPermission = await this.checkWorkspacePermission(input.organizationId, input.createdBy);
    if (!hasPermission) {
      throw new FilePermissionError('User does not have permission to upload to this workspace');
    }

    // Generate file ID
    const fileId = randomUUID();

    // Sanitize and generate safe file name
    const safeFileName = generateSafeFileName(input.originalName, fileId);

    // Generate object key
    const objectKey = generateObjectKey({
      organizationId: input.organizationId,
      requestId: input.requestId,
      fileId,
      safeFileName,
      category: input.category,
    });

    // Compute checksum
    const checksum = computeChecksum(buffer, 'sha256');

    // Upload to storage
    const storedObject = await this.provider.upload({
      objectKey,
      buffer,
      mimeType: input.mimeType,
      originalName: input.originalName,
    });

    // Create database record
    const fileRecord = await prisma.file.create({
      data: {
        id: fileId,
        workspaceId: input.organizationId,
        requestId: input.requestId,
        storageDriver: storedObject.storageDriver,
        bucket: storedObject.bucket,
        objectKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: storedObject.size,
        checksum,
        category: input.category,
        visibility: input.visibility,
        status: 'uploaded',
        createdById: input.createdBy,
      },
    });

    // Log access
    await recordFileAccessLog({
      fileId,
      action: 'upload',
      actorId: input.createdBy,
    });

    return fileRecord as unknown as FileRecord;
  }

  /**
   * Get file metadata and download URL
   */
  async getFile(fileId: string, userId: string): Promise<FileRecord & { downloadUrl: string }> {
    // Fetch file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new FileNotFoundError(fileId);
    }

    // Check permission
    const hasPermission = await this.checkWorkspacePermission(fileRecord.workspaceId, userId);
    if (!hasPermission) {
      throw new FilePermissionError('User does not have permission to access this file');
    }

    // Log access
    await recordFileAccessLog({
      fileId,
      action: 'view',
      actorId: userId,
    });

    // Get download URL
    const downloadUrl = await this.provider.getDownloadUrl({
      objectKey: fileRecord.objectKey,
      bucket: fileRecord.bucket || undefined,
    });

    return {
      ...(fileRecord as unknown as FileRecord),
      downloadUrl,
    };
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(fileId: string, userId: string): Promise<string> {
    // Fetch file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new FileNotFoundError(fileId);
    }

    // Check permission
    const hasPermission = await this.checkWorkspacePermission(fileRecord.workspaceId, userId);
    if (!hasPermission) {
      throw new FilePermissionError('User does not have permission to download this file');
    }

    // Log access
    await recordFileAccessLog({
      fileId,
      action: 'download',
      actorId: userId,
    });

    return this.provider.getDownloadUrl({
      objectKey: fileRecord.objectKey,
      bucket: fileRecord.bucket || undefined,
    });
  }

  /**
   * Delete a file (soft delete - sets status to deleted)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Fetch file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new FileNotFoundError(fileId);
    }

    // Check permission (only workspace members can delete)
    const hasPermission = await this.checkWorkspacePermission(fileRecord.workspaceId, userId);
    if (!hasPermission) {
      throw new FilePermissionError('User does not have permission to delete this file');
    }

    // Delete from storage
    await this.provider.deleteObject({
      objectKey: fileRecord.objectKey,
      bucket: fileRecord.bucket || undefined,
    });

    // Update database record (soft delete)
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'deleted' },
    });

    // Log access
    await recordFileAccessLog({
      fileId,
      action: 'delete',
      actorId: userId,
    });
  }

  /**
   * Get file access logs
   */
  async getAccessLogs(
    fileId: string,
    userId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<{ data: FileAccessLogRecord[]; total: number }> {
    // Fetch file record
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new FileNotFoundError(fileId);
    }

    // Check permission (user must have workspace access)
    const hasPermission = await this.checkWorkspacePermission(fileRecord.workspaceId, userId);
    if (!hasPermission) {
      throw new FilePermissionError('User does not have permission to view access logs');
    }

    // Pagination
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    // Fetch logs
    const [data, total] = await Promise.all([
      prisma.fileAccessLog.findMany({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.fileAccessLog.count({ where: { fileId } }),
    ]);

    return {
      data: data as unknown as FileAccessLogRecord[],
      total,
    };
  }
}

// Import FileNotFoundError
import { FileNotFoundError } from './types';

/**
 * Create storage service based on environment configuration
 */
export function createStorageService(): StorageService {
  const driver = process.env.STORAGE_DRIVER || 'local';

  if (driver === 'local') {
    const { LocalStorageProvider } = require('./providers/local-storage.provider');
    const provider = new LocalStorageProvider();
    return new StorageService(provider);
  }

  // Future: S3 support
  // if (driver === 's3') {
  //   const { S3StorageProvider } = require('./providers/s3-storage.provider');
  //   const provider = new S3StorageProvider({ ... });
  //   return new StorageService(provider);
  // }

  throw new Error(`Unknown storage driver: ${driver}`);
}
