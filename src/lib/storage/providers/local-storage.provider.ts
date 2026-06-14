/**
 * Local Storage Provider
 *
 * Implements StorageProvider interface for local filesystem storage.
 * Files are stored in a private directory, NOT in public folder.
 */

import { mkdir, readFile, writeFile, unlink, stat, copyFile, mkdir as mkdirSync } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { computeChecksum } from '../utils/checksum.util';
import {
  type StorageProvider,
  type UploadFileInput,
  type GetObjectInput,
  type GetDownloadUrlInput,
  type DeleteObjectInput,
  type ExistsObjectInput,
  type CopyObjectInput,
  type MoveObjectInput,
  type StoredObject,
  FileNotFoundError,
  type StorageDriver,
} from '../types';

// Default storage root path
const DEFAULT_STORAGE_ROOT = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';

/**
 * Local Storage Adapter implementing the StorageProvider interface
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly rootPath: string;

  constructor(rootPath: string = DEFAULT_STORAGE_ROOT) {
    this.rootPath = rootPath;
  }

  /**
   * Get the full local path for an object key
   */
  private getFullPath(objectKey: string): string {
    // Prevent path traversal attacks
    if (objectKey.includes('..')) {
      throw new Error('Invalid object key: path traversal not allowed');
    }
    return `${this.rootPath}/${objectKey}`;
  }

  /**
   * Ensure directory exists, creating parent directories as needed
   */
  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Upload a file to local storage
   */
  async upload(input: UploadFileInput): Promise<StoredObject> {
    const fullPath = this.getFullPath(input.objectKey);

    // Ensure directory exists
    await this.ensureDirectory(fullPath);

    // Get buffer from input
    const buffer = input.buffer;
    if (!buffer) {
      throw new Error('Buffer is required for local storage upload');
    }

    // Write file
    await writeFile(fullPath, buffer);

    // Compute checksum
    const checksum = computeChecksum(buffer, 'sha256');

    // Get file stats
    const stats = await stat(fullPath);

    return {
      objectKey: input.objectKey,
      size: stats.size,
      mimeType: input.mimeType,
      checksum,
      storageDriver: 'local' as StorageDriver,
    };
  }

  /**
   * Get a file from local storage
   */
  async getObject(input: GetObjectInput): Promise<Buffer | ReadableStream> {
    const fullPath = this.getFullPath(input.objectKey);

    if (!existsSync(fullPath)) {
      throw new FileNotFoundError(input.objectKey);
    }

    return readFile(fullPath);
  }

  /**
   * Get download URL for a file
   *
   * For local storage, returns the API endpoint path.
   * The actual file streaming is handled by the API route.
   */
  async getDownloadUrl(input: GetDownloadUrlInput): Promise<string> {
    const fullPath = this.getFullPath(input.objectKey);

    if (!existsSync(fullPath)) {
      throw new FileNotFoundError(input.objectKey);
    }

    // For local storage, we return the API download endpoint
    // The fileId will be extracted from the object key or passed separately
    const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL || '';
    return `${publicBaseUrl}/api/files/download?key=${encodeURIComponent(input.objectKey)}`;
  }

  /**
   * Delete a file from local storage
   */
  async deleteObject(input: DeleteObjectInput): Promise<void> {
    const fullPath = this.getFullPath(input.objectKey);

    if (!existsSync(fullPath)) {
      // File doesn't exist - handle gracefully
      return;
    }

    await unlink(fullPath);
  }

  /**
   * Check if a file exists
   */
  async exists(input: ExistsObjectInput): Promise<boolean> {
    const fullPath = this.getFullPath(input.objectKey);
    return existsSync(fullPath);
  }

  /**
   * Copy a file within local storage
   */
  async copyObject(input: CopyObjectInput): Promise<StoredObject> {
    const sourcePath = this.getFullPath(input.sourceKey);
    const destPath = this.getFullPath(input.destinationKey);

    if (!existsSync(sourcePath)) {
      throw new FileNotFoundError(input.sourceKey);
    }

    // Ensure destination directory exists
    await this.ensureDirectory(destPath);

    // Copy file
    await copyFile(sourcePath, destPath);

    // Get file stats
    const stats = await stat(destPath);

    // Read buffer to compute checksum
    const buffer = await readFile(destPath);
    const checksum = computeChecksum(buffer, 'sha256');

    return {
      objectKey: input.destinationKey,
      size: stats.size,
      mimeType: 'application/octet-stream', // Default, could be detected
      checksum,
      storageDriver: 'local' as StorageDriver,
    };
  }

  /**
   * Move a file within local storage
   */
  async moveObject(input: MoveObjectInput): Promise<StoredObject> {
    // Copy to new location
    const copied = await this.copyObject({
      sourceKey: input.sourceKey,
      destinationKey: input.destinationKey,
    });

    // Delete source
    await this.deleteObject({ objectKey: input.sourceKey });

    return copied;
  }

  /**
   * Initialize storage directory structure
   * Call this on application startup
   */
  async initialize(): Promise<void> {
    const directories = [
      this.rootPath,
      `${this.rootPath}/organizations`,
      `${this.rootPath}/templates`,
      `${this.rootPath}/system`,
    ];

    for (const dir of directories) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }
  }
}

/**
 * Create a new LocalStorageProvider instance
 */
export function createLocalStorageProvider(rootPath?: string): LocalStorageProvider {
  return new LocalStorageProvider(rootPath);
}
