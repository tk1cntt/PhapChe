// ── Normalized Content Cache ───────────────────────────────────

import type { CacheEntry } from './types';

/**
 * In-memory cache cho normalized content.
 * Keyed by SHA-256 hash của raw input — tránh normalize lặp lại
 * nội dung giống hệt.
 */
class NormalizeCache {
  private store = new Map<string, CacheEntry>();
  /** Số entries tối đa trước khi prune */
  private maxEntries: number;
  /** Prune oldest 50% entries khi đạt max */
  private pruneRatio: number;

  constructor(maxEntries = 200, pruneRatio = 0.5) {
    this.maxEntries = maxEntries;
    this.pruneRatio = pruneRatio;
  }

  /** Lookup cache bằng hash */
  get(hash: string): string | null {
    const entry = this.store.get(hash);
    if (!entry) return null;
    return entry.normalized;
  }

  /** Store normalized content */
  set(hash: string, normalized: string): void {
    if (this.store.size >= this.maxEntries) {
      this.prune();
    }
    this.store.set(hash, {
      hash,
      normalized,
      createdAt: Date.now(),
    });
  }

  /** Xóa cache entry */
  delete(hash: string): void {
    this.store.delete(hash);
  }

  /** Xóa toàn bộ cache */
  clear(): void {
    this.store.clear();
  }

  /** Kích thước hiện tại */
  get size(): number {
    return this.store.size;
  }

  /**
   * Prune cache: xóa oldest (pruneRatio * maxEntries) entries.
   */
  private prune(): void {
    const removeCount = Math.floor(this.maxEntries * this.pruneRatio);
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
    }
  }
}

/** Singleton cache instance */
export const normalizeCache = new NormalizeCache();
