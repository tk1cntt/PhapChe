// ── Normalized Content Cache ───────────────────────────────────

import type { CacheEntry, NormalizeResult } from './types';

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
    if (maxEntries < 1) throw new Error('maxEntries must be >= 1');
    if (pruneRatio <= 0 || pruneRatio > 1) throw new Error('pruneRatio must be in (0, 1]');
    this.maxEntries = maxEntries;
    this.pruneRatio = pruneRatio;
  }

  /** Lookup cache bằng hash — returns full NormalizeResult or null */
  get(hash: string): NormalizeResult | null {
    const entry = this.store.get(hash);
    if (!entry) return null;
    return entry.result ?? null;
  }

  /** Store full normalize result */
  set(hash: string, result: NormalizeResult): void {
    if (this.store.size >= this.maxEntries) {
      this.prune();
    }
    this.store.set(hash, {
      hash,
      result,
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
    const removeCount = Math.max(1, Math.floor(this.maxEntries * this.pruneRatio));
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
    }
  }
}

/** Singleton cache instance */
export const normalizeCache = new NormalizeCache();
