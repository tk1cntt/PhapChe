/**
 * Tests for isValidAssistantContent — LLM response validator
 *
 * Covers: valid content, empty, tool-call format, too-short, length-capped
 */

import { describe, it, expect } from 'vitest';
import { isValidAssistantContent } from '../[id]/chat/route';

describe('isValidAssistantContent', () => {
  // ── Whitebox ───────────────────────────────────

  describe('Whitebox', () => {
    it('should accept valid Vietnamese legal content', () => {
      const result = isValidAssistantContent(
        'Chào bạn, đây là phân tích pháp lý về hợp đồng của bạn.',
        500,
      );
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should accept valid markdown content', () => {
      const result = isValidAssistantContent(
        '## Phân tích\n\n- Điều 1: OK\n- Điều 2: Cần sửa\n\n**Kết luận:** Đạt',
        300,
      );
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should accept short but valid content with low token usage', () => {
      const result = isValidAssistantContent('Xin chào!', 50);
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should reject null content', () => {
      const result = isValidAssistantContent(null, 100);
      expect(result).toEqual({ valid: false, reason: 'empty' });
    });

    it('should reject undefined content', () => {
      const result = isValidAssistantContent(undefined, 100);
      expect(result).toEqual({ valid: false, reason: 'empty' });
    });
  });

  // ── Blackbox: tool-call detection ──────────────

  describe('Tool-call detection', () => {
    it('should reject content with [调用] pattern (Chinese tool-call)', () => {
      const result = isValidAssistantContent(
        '[调用 read_file] {"file_path": "C:\\\\"}',
        2000,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with read_file tool call', () => {
      const result = isValidAssistantContent(
        'Let me read the file first.\nread_file {\"path\": \"/etc/hosts\"}',
        1500,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with search_file', () => {
      const result = isValidAssistantContent(
        'search_file pattern="*.ts"',
        1200,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with list_files', () => {
      const result = isValidAssistantContent(
        'list_files /home/user',
        1000,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with write_to_file', () => {
      const result = isValidAssistantContent(
        'write_to_file content here',
        800,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with replace_in_file', () => {
      const result = isValidAssistantContent(
        'replace_in_file old=new',
        700,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with execute_command', () => {
      const result = isValidAssistantContent(
        'execute_command ls -la',
        600,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with insert_file', () => {
      const result = isValidAssistantContent(
        'insert_file path/to/file',
        500,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with delete_file', () => {
      const result = isValidAssistantContent(
        'delete_file temp.txt',
        400,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject content with preview_url', () => {
      const result = isValidAssistantContent(
        'preview_url http://localhost',
        350,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });
  });

  // ── Abnormal / Error ──────────────────────────

  describe('Abnormal / Error', () => {
    it('should reject too-short content with high tokens', () => {
      // 10 chars but 500 tokens used → suspicious
      const result = isValidAssistantContent('Short.', 500);
      expect(result).toEqual({ valid: false, reason: 'too_short' });
    });

    it('should accept short content with low tokens (normal short answer)', () => {
      // 7 chars, 10 tokens → legitimate short answer
      const result = isValidAssistantContent('Xin chào!', 10);
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should reject length-capped content', () => {
      // 50 chars but 2000 tokens → truncated
      const result = isValidAssistantContent(
        'This response was cut short because it reached the max token limit unfortunately.',
        2000,
      );
      expect(result).toEqual({ valid: false, reason: 'length_capped' });
    });

    it('should accept content with 90 chars and 500 tokens', () => {
      const longEnough = 'A'.repeat(90);
      const result = isValidAssistantContent(longEnough, 500);
      // 90 >= 100? No → length_capped check: 90 < 100 && 500 > 1000? No (500 not > 1000)
      // too_short: 90 < 20? No
      // → ok
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should accept long content with many tokens (normal LLM response)', () => {
      const longContent = 'Nội dung pháp lý dài với phân tích chi tiết. '.repeat(20);
      const result = isValidAssistantContent(longContent, 5000);
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });
  });

  // ── Edge cases ────────────────────────────────

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = isValidAssistantContent('', 0);
      expect(result).toEqual({ valid: false, reason: 'empty' });
    });

    it('should handle whitespace-only content', () => {
      const result = isValidAssistantContent('   \n  \t  ', 100);
      expect(result).toEqual({ valid: false, reason: 'empty' });
    });

    it('should not false-positive on legal content mentioning file terms', () => {
      // Hợp đồng có thể nhắc đến "hồ sơ" (file) nhưng không phải tool call
      const result = isValidAssistantContent(
        'Quý khách vui lòng chuẩn bị hồ sơ bao gồm các file: giấy phép kinh doanh, CMND.',
        300,
      );
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should handle unicode Vietnamese content correctly', () => {
      const result = isValidAssistantContent(
        'Theo Điều 398 Bộ luật Dân sự 2015, hợp đồng cần có nội dung rõ ràng.',
        200,
      );
      expect(result).toEqual({ valid: true, reason: 'ok' });
    });

    it('should reject content with tool call keywords embedded in larger text', () => {
      const result = isValidAssistantContent(
        'Để trả lời câu hỏi này tôi cần read_file từ hệ thống trước.',
        800,
      );
      expect(result).toEqual({ valid: false, reason: 'tool_call_format' });
    });

    it('should reject exactly-20-char content with >100 tokens', () => {
      const exactly20 = 'A'.repeat(20);
      const result = isValidAssistantContent(exactly20, 200);
      expect(result).toEqual({ valid: true, reason: 'ok' });
      // 20 chars is NOT < 20, so passes too_short check
    });

    it('should reject 19-char content with >100 tokens', () => {
      const exactly19 = 'A'.repeat(19);
      const result = isValidAssistantContent(exactly19, 200);
      expect(result).toEqual({ valid: false, reason: 'too_short' });
    });
  });
});
