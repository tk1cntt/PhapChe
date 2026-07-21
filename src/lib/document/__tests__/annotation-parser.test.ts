/**
 * Tests for annotation-parser.ts
 */
import { describe, it, expect } from 'vitest';
import { parseAiAnnotationContent, extractIssueSummary } from '../annotation-parser';

describe('parseAiAnnotationContent', () => {
  // ── Whitebox: standard format ──

  it('parses all 3 sections correctly', () => {
    const content = [
      '**Vấn đề:** Phí dịch vụ không được ấn định cụ thể trong hợp đồng, chỉ dẫn chiếu đến "báo giá đính kèm".',
      '**Đề xuất:** Ghi rõ tổng phí dịch vụ bằng số và chữ, phương thức thanh toán, các mốc thanh toán.',
      '**Căn cứ:** Điều 398 Bộ luật Dân sự 2015.',
    ].join('\n');

    const result = parseAiAnnotationContent(content);
    expect(result.sections).toHaveLength(3);
    expect(result.sections[0].label).toBe('Vấn đề');
    expect(result.sections[1].label).toBe('Đề xuất');
    expect(result.sections[2].label).toBe('Căn cứ pháp lý');
    expect(result.sections[0].content).toContain('Phí dịch vụ');
  });

  it('preserves multi-line content within sections', () => {
    const content = [
      '**Vấn đề:** Phí dịch vụ không được ấn định cụ thể.',
      'Dòng thứ hai của vấn đề.',
      '**Đề xuất:** Ghi rõ phí.',
    ].join('\n');

    const result = parseAiAnnotationContent(content);
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].content).toContain('Dòng thứ hai');
  });

  // ── Blackbox: edge cases ──

  it('handles single-section content', () => {
    const content = '**Vấn đề:** Chỉ có vấn đề thôi.';
    const result = parseAiAnnotationContent(content);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].label).toBe('Vấn đề');
  });

  it('handles content without markdown bold markers', () => {
    const content = 'Vấn đề: Plain text version.';
    const result = parseAiAnnotationContent(content);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].label).toBe('Vấn đề');
  });

  it('handles English labels (Issue, Recommendation, Legal Basis)', () => {
    const content = [
      '**Issue:** Missing payment terms.',
      '**Recommendation:** Add payment schedule.',
      '**Legal Basis:** Article 398 Civil Code.',
    ].join('\n');

    const result = parseAiAnnotationContent(content);
    expect(result.sections).toHaveLength(3);
    expect(result.sections[0].label).toBe('Issue');
    expect(result.sections[1].label).toBe('Recommendation');
    expect(result.sections[2].label).toBe('Legal Basis');
  });

  it('sorts sections to fixed order regardless of AI output order', () => {
    const content = [
      '**Căn cứ:** Article 398.',
      '**Vấn đề:** Missing terms.',
      '**Đề xuất:** Fix it.',
    ].join('\n');

    const result = parseAiAnnotationContent(content);
    expect(result.sections[0].label).toBe('Vấn đề');
    expect(result.sections[1].label).toBe('Đề xuất');
    expect(result.sections[2].label).toBe('Căn cứ pháp lý');
  });

  // ── Abnormal ──

  it('returns raw for empty string', () => {
    const result = parseAiAnnotationContent('');
    expect(result.sections).toHaveLength(0);
    expect(result.raw).toBe('');
  });

  it('returns raw for null-like content', () => {
    const result = parseAiAnnotationContent('   ');
    expect(result.sections).toHaveLength(0);
  });

  it('returns raw for content with no recognizable sections', () => {
    const content = 'Đây là ghi chú bình thường, không có marker section nào.';
    const result = parseAiAnnotationContent(content);
    expect(result.sections).toHaveLength(0);
    expect(result.raw).toBe(content);
  });

  it('handles section with no content after label', () => {
    const content = '**Vấn đề:**\n**Đề xuất:** Fix it.';
    const result = parseAiAnnotationContent(content);
    // Vấn đề has empty content → skipped; Đề xuất has content
    expect(result.sections.length).toBeGreaterThanOrEqual(1);
    const deXuat = result.sections.find(s => s.label === 'Đề xuất');
    expect(deXuat?.content).toBe('Fix it.');
  });

  it('handles duplicate sections by keeping both', () => {
    const content = '**Vấn đề:** Problem 1.\n**Vấn đề:** Problem 2.';
    const result = parseAiAnnotationContent(content);
    expect(result.sections.filter(s => s.label === 'Vấn đề')).toHaveLength(2);
  });

  // ── Error ──

  it('handles content with only markdown markers but no labels', () => {
    const content = '**abc:** nothing **xyz:** else';
    const result = parseAiAnnotationContent(content);
    // No known section labels → raw
    expect(result.raw).toBe(content);
  });
});

describe('extractIssueSummary', () => {
  it('extracts issue text', () => {
    const content = [
      '**Vấn đề:** Phí dịch vụ không rõ ràng.',
      '**Đề xuất:** Ghi rõ phí.',
    ].join('\n');

    const summary = extractIssueSummary(content);
    expect(summary).toBe('Phí dịch vụ không rõ ràng.');
  });

  it('truncates long summaries', () => {
    const content = `**Vấn đề:** ${'a'.repeat(200)}`;
    const summary = extractIssueSummary(content, 50);
    expect(summary.length).toBeLessThanOrEqual(53); // 50 + '...'
    expect(summary.endsWith('...')).toBe(true);
  });

  it('falls back to raw content if no issue section', () => {
    const summary = extractIssueSummary('Just raw text');
    expect(summary).toBe('Just raw text');
  });
});
