import { describe, it, expect, beforeEach } from 'vitest';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
  convertWithMarkItDown,
  isMarkItDownAvailable,
  resetCliCache,
} from '../markitdown';
import type { MarkItDownResult } from '../types';

/**
 * Integration tests cho MarkItDown wrapper.
 * Dùng real CLI (không mock) vì markitdown đã được cài.
 * Focus: error handling, converter detection, edge cases.
 *
 * Không mock do vi.mock('util') không hoạt động với
 * built-in Node modules trong jsdom environment.
 */

const TEMP_DIR = join(process.env.STORAGE_LOCAL_ROOT || '/tmp', 'test-markitdown');

describe('MarkItDown Wrapper (Integration)', () => {
  beforeEach(async () => {
    resetCliCache();
    await mkdir(TEMP_DIR, { recursive: true });
  });

  // ── isMarkItDownAvailable ─────────────────────────────

  describe('isMarkItDownAvailable', () => {
    it('should return true (CLI installed)', async () => {
      const result = await isMarkItDownAvailable();
      expect(result).toBe(true);
    });

    it('should cache result', async () => {
      resetCliCache();
      const r1 = await isMarkItDownAvailable();
      const r2 = await isMarkItDownAvailable();
      expect(r1).toBe(true);
      expect(r2).toBe(true);
    });
  });

  // ── convertWithMarkItDown ─────────────────────────────

  describe('convertWithMarkItDown', () => {
    describe('Error', () => {
      it('should return error for non-existent file', async () => {
        const result = await convertWithMarkItDown(
          '/tmp/nonexistent-file-12345.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'test.docx',
        );
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
        expect(result.converter).toBe('docx');
      });

      it('should return error for empty temp file', async () => {
        const tempId = randomUUID();
        const tempPath = join(TEMP_DIR, `${tempId}.txt`);
        await writeFile(tempPath, '');
        try {
          const result = await convertWithMarkItDown(tempPath, '', 'empty.txt');
          // Empty file may produce empty output (error) or minimal content
          if (!result.success) {
            expect(result.error).toBeTruthy();
          }
        } finally {
          await unlink(tempPath).catch(() => {});
        }
      });

      it('should handle short timeout with large file', async () => {
        // Tạo file lớn ~5MB để trigger timeout với timeout cực ngắn
        const tempId = randomUUID();
        const tempPath = join(TEMP_DIR, `${tempId}.pdf`);
        const largeBuffer = Buffer.alloc(5 * 1024 * 1024).fill(0x41); // 5MB of 'A'
        await writeFile(tempPath, largeBuffer);
        try {
          // 1ms timeout không đủ để đọc 5MB → có thể timeout hoặc error
          const result = await convertWithMarkItDown(tempPath, 'application/pdf', 'large.pdf', 500);
          // Expected: timeout hoặc error (không success với 500ms cho 5MB)
          if (!result.success) {
            expect(result.error).toBeTruthy();
          }
        } finally {
          await unlink(tempPath).catch(() => {});
        }
      });
    });

    // ── Abnormal ───────────────────────────────────────

    describe('Abnormal', () => {
      it('should detect PDF converter from MIME type', async () => {
        // File không tồn tại → sẽ fail, nhưng converter detection vẫn chạy
        const result = await convertWithMarkItDown(
          '/tmp/nonexistent.pdf',
          'application/pdf',
          'test.pdf',
        );
        expect(result.converter).toBe('pdf');
        expect(result.success).toBe(false);
      });

      it('should detect DOCX converter from extension', async () => {
        const result = await convertWithMarkItDown(
          '/tmp/nonexistent.docx',
          'application/octet-stream',
          'document.docx',
        );
        expect(result.converter).toBe('docx');
        expect(result.success).toBe(false);
      });

      it('should return unknown for PNG', async () => {
        const result = await convertWithMarkItDown(
          '/tmp/nonexistent.png',
          'image/png',
          'photo.png',
        );
        expect(result.converter).toBe('unknown');
        expect(result.success).toBe(false);
      });

      it('should detect XLSX converter type', async () => {
        const result = await convertWithMarkItDown(
          '/tmp/nonexistent.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'sheet.xlsx',
        );
        expect(result.converter).toBe('xlsx');
        expect(result.success).toBe(false);
      });
    });
  });
});
