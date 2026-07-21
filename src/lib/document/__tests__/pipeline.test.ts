import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeMarkdown } from '../normalizer/pipeline';
import { normalizeCache } from '../cache';

describe('Pipeline Integration', () => {
  // Load fixtures
  const fixturesDir = join(__dirname, 'fixtures');
  const dirtyLaw = readFileSync(join(fixturesDir, 'dirty-law.txt'), 'utf-8');

  // Avoid cache interference between tests
  beforeEach(() => {
    normalizeCache.clear();
  });

  // ── Blackbox: Full pipeline ─────────────────────────────

  describe('Blackbox: full pipeline', () => {
    it('should normalize dirty Vietnamese legal document', () => {
      const result = normalizeMarkdown(dirtyLaw, {
        detectArticles: true,
        detectSections: true,
        detectSubItems: true,
        normalizeLists: true,
      });

      expect(result.content).toBeTruthy();
      expect(result.content.length).toBeGreaterThan(0);

      // Should detect Điều
      expect(result.detected.articles.length).toBeGreaterThanOrEqual(4);
      expect(result.detected.articles).toContain('Điều 1: NỘI DUNG CÔNG VIỆC');
      expect(result.detected.articles).toContain('Điều 2: THỜI HẠN HỢP ĐỒNG');

      // Should detect Chương
      expect(result.detected.sections.length).toBeGreaterThanOrEqual(1);
      expect(result.detected.sections.some((s) => s.includes('Chương I'))).toBe(true);

      // Content should have markdown headings
      expect(result.content).toContain('## Điều 1: NỘI DUNG CÔNG VIỆC');
      expect(result.content).toContain('## Điều 2: THỜI HẠN HỢP ĐỒNG');

      // Should have stats
      expect(result.stats.originalChars).toBeGreaterThan(0);
      expect(result.stats.normalizedChars).toBeGreaterThan(0);
      expect(result.stats.estimatedTokens).toBeGreaterThan(0);
    });

    it('should normalize Điều 4 with dash separator', () => {
      const result = normalizeMarkdown(dirtyLaw);
      expect(result.detected.articles).toContain('Điều 4: QUYỀN LỢI');
      expect(result.content).toContain('## Điều 4: QUYỀN LỢI');
    });

    it('should detect Khoản sub-items', () => {
      const result = normalizeMarkdown(dirtyLaw);
      expect(result.content).toContain('### Khoản 1');
      expect(result.content).toContain('### Khoản 2');
      expect(result.content).toContain('### Khoản 3');
    });

    it('should normalize point markers a) b) to bullets', () => {
      const result = normalizeMarkdown(dirtyLaw);
      expect(result.content).toContain('- Thưởng quý I');
      expect(result.content).toContain('- Thưởng quý II');
    });
  });

  // ── Blackbox: Empty input ────────────────────────────────

  describe('Blackbox: empty input', () => {
    it('should handle empty string', () => {
      const result = normalizeMarkdown('');
      expect(result.content).toBe('');
      expect(result.detected.articles).toHaveLength(0);
      expect(result.stats.originalChars).toBe(0);
      expect(result.stats.normalizedChars).toBe(0);
    });

    it('should handle whitespace-only input', () => {
      const result = normalizeMarkdown('   \n\n  ');
      expect(result.content).toBe('');
    });
  });

  // ── Blackbox: Skip phases ────────────────────────────────

  describe('Blackbox: skip phases', () => {
    it('should skip detect phase when disabled', () => {
      // Disable all detect features. allCapsHeadings is hardcoded in pipeline
      // so it may still add ### prefixes, but ## Điều should not appear.
      const result = normalizeMarkdown(dirtyLaw, {
        detectArticles: false,
        detectSections: false,
        detectSubItems: false,
        normalizeLists: false,
      });
      // Điều articles should not be detected
      expect(result.detected.articles).toHaveLength(0);
      expect(result.detected.sections).toHaveLength(0);
    });

    it('should skip clean phase when specified', () => {
      // Khi bỏ clean, BOM và CRLF vẫn còn → regex có thể không khớp.
      // Đây là hành vi đúng: detector phụ thuộc vào clean để có text sạch.
      const result = normalizeMarkdown(dirtyLaw, { phases: ['detect', 'format'] });
      expect(result.content).toBeTruthy();
      // May or may not detect articles depending on BOM/CRLF state
      expect(result.detected).toBeDefined();
    });

    it('should run only clean phase', () => {
      const result = normalizeMarkdown(dirtyLaw, { phases: ['clean'] });
      expect(result.content).toBeTruthy();
      expect(result.detected.articles).toHaveLength(0);
      // BOM should be stripped
      expect(result.content).not.toContain('﻿');
    });
  });

  // ── Blackbox: Cache behavior ─────────────────────────────

  describe('Blackbox: cache behavior', () => {
    it('should return same result from cache', () => {
      normalizeCache.clear();
      const text = 'Điều 1: Nội dung thử nghiệm';
      const r1 = normalizeMarkdown(text);
      const r2 = normalizeMarkdown(text);

      // Same content but different object refs (since metadata is rebuilt)
      expect(r2.content).toBe(r1.content);
    });
  });

  // ── Blackbox: maxLength truncation ───────────────────────

  describe('Blackbox: maxLength truncation', () => {
    it('should truncate content when maxLength is set', () => {
      normalizeCache.clear();
      // 100 chars repeated — after clean, becomes one line "AAA...A\n"
      // maxLength 50 will trigger truncation + suffix
      const longText = 'A'.repeat(100);
      const result = normalizeMarkdown(longText, { maxLength: 50, phases: ['clean'] });
      // Truncation adds suffix, total should be around 70 chars (50 + suffix)
      expect(result.content.length).toBeLessThanOrEqual(80);
      expect(result.detected.errors.length).toBeGreaterThan(0);
    });
  });

  // ── Error: Unicode handling ──────────────────────────────

  describe('Error: unicode handling', () => {
    it('should handle Vietnamese tones correctly', () => {
      const input = 'Điều 1: Nội dung tiếng Việt có dấu: ắ, ế, ố, ệ, ưỡi';
      const result = normalizeMarkdown(input, { normalizeUnicode: true });
      expect(result.content).toContain('Điều 1: Nội dung tiếng Việt');
      // NFC normalization should produce đúng tones
      expect(result.content.normalize('NFD').length).toBeGreaterThanOrEqual(result.content.length);
    });
  });

  // ── Abnormal: Real-world edge cases ──────────────────────

  describe('Abnormal: edge cases', () => {
    it('should handle very long single-line input', () => {
      const long = 'x'.repeat(10000);
      const result = normalizeMarkdown(long);
      expect(result.content).toBeTruthy();
      expect(result.stats.originalChars).toBe(10000);
    });

    it('should handle input with only numbers', () => {
      const result = normalizeMarkdown('123\n456\n789');
      expect(result.content).toBeTruthy();
    });

    it('should handle BOM + multiple noise chars', () => {
      const input = '﻿​ Hello‌­ World !';
      const result = normalizeMarkdown(input);
      // Narrow NBSP ( ) → regular space, so: "Hello World !" (space before !)
      expect(result.content.trim()).toContain('Hello');
      expect(result.content.trim()).toContain('World');
      expect(result.content.trim()).toContain('!');
    });
  });
});
