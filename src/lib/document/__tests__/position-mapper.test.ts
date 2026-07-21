/**
 * Position Mapper Tests — Inline AI Review Utility
 *
 * Test categories: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { splitMarkdownToLines, getLinesArray, fuzzyMatchPosition } from '../position-mapper';

// ── Test Data ──────────────────────────────────────────────────

const SAMPLE_CONTRACT = `Điều 1: NỘI DUNG CÔNG VIỆC
Bên A giao cho Bên B thực hiện các công việc sau:
1. Thiết kế và phát triển website thương mại điện tử
2. Tích hợp cổng thanh toán trực tuyến

Điều 2: THỜI HẠN
Thời hạn thực hiện hợp đồng là 90 ngày kể từ ngày ký.

Điều 3: GIÁ TRỊ HỢP ĐỒNG
Tổng giá trị hợp đồng là 500.000.000 VND (năm trăm triệu đồng).

Điều 4: THANH TOÁN
Bên A thanh toán cho Bên B theo các đợt:
- Đợt 1: 30% sau khi ký hợp đồng
- Đợt 2: 40% sau khi hoàn thành giai đoạn 1
- Đợt 3: 30% sau khi nghiệm thu và bàn giao

Điều 5: BẢO HÀNH
Thời gian bảo hành là 12 tháng kể từ ngày nghiệm thu.`;

// ── Whitebox Tests ─────────────────────────────────────────────

describe('Position Mapper — Whitebox', () => {
  describe('splitMarkdownToLines', () => {
    it('prefixes each line with line number and pipe', () => {
      const result = splitMarkdownToLines('line one\nline two\nline three');
      expect(result).toBe('1| line one\n2| line two\n3| line three');
    });

    it('handles single line', () => {
      const result = splitMarkdownToLines('only one line');
      expect(result).toBe('1| only one line');
    });

    it('preserves empty lines with numbers', () => {
      const result = splitMarkdownToLines('a\n\nb\n\nc');
      expect(result).toBe('1| a\n2| \n3| b\n4| \n5| c');
    });
  });

  describe('getLinesArray', () => {
    it('splits markdown into array of lines', () => {
      const lines = getLinesArray('a\nb\nc');
      expect(lines).toEqual(['a', 'b', 'c']);
    });

    it('handles empty input', () => {
      expect(getLinesArray('')).toEqual([]);
    });
  });

  describe('fuzzyMatchPosition — exact match', () => {
    it('returns high confidence for exact substring match at AI position', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      // "Bên A thanh toán cho Bên B" is on line 13 (1-indexed)
      const result = fuzzyMatchPosition('Bên A thanh toán cho Bên B', lines, 13);
      expect(result.lineStart).toBe(13);
      expect(result.confidence).toBe(1.0);
    });

    it('finds match when AI is slightly off by a few lines', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      // "Tổng giá trị hợp đồng là 500.000.000" is on line 10, AI says line 8
      const result = fuzzyMatchPosition('Tổng giá trị hợp đồng là 500.000.000', lines, 8);
      expect(result.lineStart).toBe(10);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('handles multi-line match spanning multiple lines', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      // Snippet spans lines 2-3: the algorithm finds it via multi-line match
      // near the AI-estimated position (line 2), falling back to lines 1-3 span
      const result = fuzzyMatchPosition('Bên A giao cho Bên B thực hiện các công việc sau: 1. Thiết', lines, 2);
      expect(result.lineStart).toBeGreaterThanOrEqual(1);
      expect(result.lineEnd).toBeGreaterThan(result.lineStart);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });
});

// ── Blackbox Tests ─────────────────────────────────────────────

describe('Position Mapper — Blackbox', () => {
  it('preserves all content after round-trip (line number → split)', () => {
    const numbered = splitMarkdownToLines(SAMPLE_CONTRACT);
    // Remove line number prefixes to recover original
    const recovered = numbered
      .split('\n')
      .map((line) => line.replace(/^\d+\| /, ''))
      .join('\n');
    expect(recovered).toBe(SAMPLE_CONTRACT);
  });

  it('finds Vietnamese legal clause references correctly', () => {
    const lines = getLinesArray(SAMPLE_CONTRACT);
    const result = fuzzyMatchPosition('Thời gian bảo hành là 12 tháng', lines, 19);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.lineStart).toBe(19);
  });

  it('handles a full contract with all line numbers intact', () => {
    const lines = getLinesArray(SAMPLE_CONTRACT);
    expect(lines.length).toBe(19); // 19 lines total
    // Verify key lines exist
    expect(lines[0]).toContain('Điều 1');
    expect(lines[8]).toContain('Điều 3');
    expect(lines[11]).toContain('Điều 4');
  });
});

// ── Abnormal Tests ─────────────────────────────────────────────

describe('Position Mapper — Abnormal', () => {
  describe('splitMarkdownToLines edge cases', () => {
    it('handles empty string gracefully', () => {
      expect(splitMarkdownToLines('')).toBe('');
    });

    it('handles extremely long single line (10K chars)', () => {
      const longLine = 'x'.repeat(10000);
      const result = splitMarkdownToLines(longLine);
      expect(result).toBe(`1| ${longLine}`);
      expect(result.split('\n').length).toBe(1);
    });

    it('handles only newlines', () => {
      const result = splitMarkdownToLines('\n\n\n');
      expect(result).toBe('1| \n2| \n3| \n4| ');
    });
  });

  describe('fuzzyMatchPosition edge cases', () => {
    it('handles empty snippet gracefully', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      const result = fuzzyMatchPosition('', lines, 5);
      expect(result.confidence).toBe(0);
    });

    it('handles empty lines array', () => {
      const result = fuzzyMatchPosition('test', [], 1);
      expect(result.confidence).toBe(0);
    });

    it('handles AI lineStart out of bounds (too large)', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      const result = fuzzyMatchPosition('thanh toán', lines, 9999);
      // Should clamp to valid range
      expect(result.lineStart).toBeGreaterThanOrEqual(1);
      expect(result.lineStart).toBeLessThanOrEqual(lines.length);
    });

    it('handles AI lineStart negative (treated as 1)', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      const result = fuzzyMatchPosition('Điều 1', lines, -5);
      expect(result.lineStart).toBeGreaterThanOrEqual(1);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('finds closest match when snippet has partial match', () => {
      const lines = getLinesArray(SAMPLE_CONTRACT);
      // Partial match - "thanh toán" appears in multiple lines
      const result = fuzzyMatchPosition('thanh toán', lines, 13);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});

// ── Error Tests ────────────────────────────────────────────────

describe('Position Mapper — Error', () => {
  it('returns zero confidence for non-existent text', () => {
    const lines = getLinesArray(SAMPLE_CONTRACT);
    const result = fuzzyMatchPosition('XYZABC_NOT_IN_DOCUMENT_999', lines, 5);
    expect(result.confidence).toBe(0);
  });

  it('returns zero confidence for completely unrelated snippet', () => {
    const lines = getLinesArray(SAMPLE_CONTRACT);
    const result = fuzzyMatchPosition('This is English text not in Vietnamese document', lines, 10);
    expect(result.confidence).toBe(0);
  });

  it('returns zero confidence for whitespace-only snippet', () => {
    const lines = getLinesArray(SAMPLE_CONTRACT);
    const result = fuzzyMatchPosition('   ', lines, 5);
    expect(result.confidence).toBe(0);
  });

  it('handles snippet with number patterns', () => {
    const lines = getLinesArray(SAMPLE_CONTRACT);
    // The line contains "500.000.000 VND"
    const result = fuzzyMatchPosition('500.000.000 VND', lines, 10);
    // Should find line 10
    expect(result.lineStart).toBe(10);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
