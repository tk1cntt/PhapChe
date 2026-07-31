/**
 * Storage Server Module
 *
 * Server-side storage service initialization.
 * Use this module in API routes - it handles provider instantiation.
 */

import { StorageService } from './storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';

// Singleton storage service instance + init promise
let storageService: StorageService | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Get the storage service instance
 *
 * Initializes the service on first call based on STORAGE_DRIVER env var.
 * Subsequent calls return the same instance.
 * Callers should await ensureStorageReady() before using async methods.
 */
export function getStorageService(): StorageService {
  if (!storageService) {
    const driver = process.env.STORAGE_DRIVER || 'local';

    if (driver === 'local') {
      const rootPath = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
      const provider = new LocalStorageProvider(rootPath);
      const maxFileSize = parseInt(process.env.STORAGE_MAX_FILE_SIZE || '52428800', 10); // 50MB default

      // Start async init; capture promise so delegate methods can await it
      initPromise = provider.initialize().catch((err) => {
        console.error('Failed to initialize storage:', err);
        throw err;
      });

      storageService = new StorageService(provider, maxFileSize);
    } else {
      throw new Error(`Unknown storage driver: ${driver}`);
    }
  }

  return storageService;
}

/** Ensure storage provider initialization completed before proceeding */
async function ensureStorageReady(): Promise<void> {
  if (initPromise) await initPromise;
}

// Export alias for convenience
export const storageServer = {
  get service() {
    return getStorageService();
  },

  // Delegate methods for convenience — each awaits init before proceeding
  async uploadFile(input: Parameters<StorageService['uploadFile']>[0]) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.uploadFile(input);
  },

  async getFile(fileId: string, userId: string) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.getFile(fileId, userId);
  },

  async getDownloadUrl(fileId: string, userId: string) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.getDownloadUrl(fileId, userId);
  },

  async deleteFile(fileId: string, userId: string) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.deleteFile(fileId, userId);
  },

  async getAccessLogs(fileId: string, userId: string, options?: { page?: number; pageSize?: number }) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.getAccessLogs(fileId, userId, options);
  },
};
