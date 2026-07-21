import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeCache } from '../cache';

describe('NormalizeCache', () => {
  beforeEach(() => {
    normalizeCache.clear();
  });

  // ── Whitebox ─────────────────────────────────────────────

  describe('Whitebox', () => {
    it('should store and retrieve value', () => {
      normalizeCache.set('hash1', 'content1');
      expect(normalizeCache.get('hash1')).toBe('content1');
    });

    it('should return null for missing hash', () => {
      expect(normalizeCache.get('nonexistent')).toBeNull();
    });

    it('should delete specific entry', () => {
      normalizeCache.set('hash1', 'content1');
      normalizeCache.delete('hash1');
      expect(normalizeCache.get('hash1')).toBeNull();
    });

    it('should clear all entries', () => {
      normalizeCache.set('hash1', 'content1');
      normalizeCache.set('hash2', 'content2');
      normalizeCache.clear();
      expect(normalizeCache.get('hash1')).toBeNull();
      expect(normalizeCache.get('hash2')).toBeNull();
      expect(normalizeCache.size).toBe(0);
    });

    it('should report size correctly', () => {
      expect(normalizeCache.size).toBe(0);
      normalizeCache.set('h1', 'c1');
      expect(normalizeCache.size).toBe(1);
      normalizeCache.set('h2', 'c2');
      expect(normalizeCache.size).toBe(2);
    });

    it('should overwrite existing hash', () => {
      normalizeCache.set('hash1', 'old');
      normalizeCache.set('hash1', 'new');
      expect(normalizeCache.get('hash1')).toBe('new');
      expect(normalizeCache.size).toBe(1);
    });
  });

  // ── Blackbox: Pruning ───────────────────────────────────

  describe('Blackbox: prune behavior', () => {
    it('should prune oldest entries when exceeding max', () => {
      const smallCache = new (normalizeCache.constructor as new (max: number) => typeof normalizeCache)(5);
      // Fill with 6 entries
      for (let i = 0; i < 6; i++) {
        smallCache.set(`hash${i}`, `content${i}`);
      }
      // After prune (50% of 5 = 2 removed), only ~3-4 should remain
      expect(smallCache.size).toBeLessThanOrEqual(4);
    });

    it('should not prune when under max', () => {
      const cache = new (normalizeCache.constructor as new (max: number) => typeof normalizeCache)(10);
      for (let i = 0; i < 5; i++) {
        cache.set(`hash${i}`, `content${i}`);
      }
      expect(cache.size).toBe(5);
    });
  });

  // ── Error ───────────────────────────────────────────────

  describe('Error', () => {
    it('should handle delete on empty cache', () => {
      expect(() => normalizeCache.delete('nonexistent')).not.toThrow();
    });

    it('should handle clear on empty cache', () => {
      expect(() => normalizeCache.clear()).not.toThrow();
    });

    it('should handle get on empty cache', () => {
      expect(normalizeCache.get('any')).toBeNull();
    });
  });

  // ── Abnormal ────────────────────────────────────────────

  describe('Abnormal', () => {
    it('should handle very long hash keys', () => {
      const longHash = 'a'.repeat(256);
      normalizeCache.set(longHash, 'value');
      expect(normalizeCache.get(longHash)).toBe('value');
    });

    it('should handle very long content values', () => {
      const longContent = 'x'.repeat(1_000_000);
      normalizeCache.set('big', longContent);
      expect(normalizeCache.get('big')).toBe(longContent);
    });
  });
});
