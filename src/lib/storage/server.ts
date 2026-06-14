/**
 * Storage Server Module
 *
 * Server-side storage service initialization.
 * Use this module in API routes - it handles provider instantiation.
 */

import { StorageService } from './storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';

// Singleton storage service instance
let storageService: StorageService | null = null;

/**
 * Get the storage service instance
 *
 * Initializes the service on first call based on STORAGE_DRIVER env var.
 * Subsequent calls return the same instance.
 */
export function getStorageService(): StorageService {
  if (!storageService) {
    const driver = process.env.STORAGE_DRIVER || 'local';

    if (driver === 'local') {
      const rootPath = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
      const provider = new LocalStorageProvider(rootPath);
      const maxFileSize = parseInt(process.env.STORAGE_MAX_FILE_SIZE || '52428800', 10); // 50MB default

      // Initialize storage directories
      provider.initialize().catch((err) => {
        console.error('Failed to initialize storage:', err);
      });

      storageService = new StorageService(provider, maxFileSize);
    } else {
      throw new Error(`Unknown storage driver: ${driver}`);
    }
  }

  return storageService;
}

// Export alias for convenience
export const storageServer = {
  get service() {
    return getStorageService();
  },

  // Delegate methods for convenience
  async uploadFile(input: Parameters<StorageService['uploadFile']>[0]) {
    return getStorageService().uploadFile(input);
  },

  async getFile(fileId: string, userId: string) {
    return getStorageService().getFile(fileId, userId);
  },

  async getDownloadUrl(fileId: string, userId: string) {
    return getStorageService().getDownloadUrl(fileId, userId);
  },

  async deleteFile(fileId: string, userId: string) {
    return getStorageService().deleteFile(fileId, userId);
  },

  async getAccessLogs(fileId: string, userId: string, options?: { page?: number; pageSize?: number }) {
    return getStorageService().getAccessLogs(fileId, userId, options);
  },
};
