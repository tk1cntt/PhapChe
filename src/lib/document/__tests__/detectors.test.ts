import { describe, it, expect } from 'vitest';
import {
  detectArticles,
  detectSections,
  detectSubItems,
  detectPoints,
  normalizeLists,
  detectAllCapsHeadings,
  phase2Detect,
} from '../normalizer/detectors';

describe('Phase 2: Detectors', () => {
  // ── detectArticles ────────────────────────────────────────

  describe('detectArticles', () => {
    describe('Whitebox', () => {
      it('should detect ĐIỀU X: prefix', () => {
        const input = 'ĐIỀU 1: NỘI DUNG CÔNG VIỆC';
        const result = detectArticles(input);
        expect(result.transformed).toBe('## Điều 1: NỘI DUNG CÔNG VIỆC');
        expect(result.articles).toHaveLength(1);
        expect(result.articles[0]).toBe('Điều 1: NỘI DUNG CÔNG VIỆC');
      });

      it('should detect Điều X: prefix', () => {
        const input = 'Điều 2: THỜI HẠN HỢP ĐỒNG';
        const result = detectArticles(input);
        expect(result.transformed).toBe('## Điều 2: THỜI HẠN HỢP ĐỒNG');
      });

      it('should detect điều lowercase', () => {
        const input = 'điều 3: trách nhiệm các bên';
        const result = detectArticles(input);
        expect(result.transformed).toBe('## Điều 3: trách nhiệm các bên');
      });

      it('should detect Điều with dash separator', () => {
        const input = 'ĐIỀU 4–QUYỀN LỢI';
        const result = detectArticles(input);
        expect(result.transformed).toBe('## Điều 4: QUYỀN LỢI');
      });

      it('should detect Điều with dot separator', () => {
        const input = 'Điều 3. CHẾ ĐỘ LÀM VIỆC';
        const result = detectArticles(input);
        expect(result.transformed).toBe('## Điều 3: CHẾ ĐỘ LÀM VIỆC');
      });

      it('should detect multiple articles in text', () => {
        const input = 'Điều 1: ABC\n\nĐiều 2: DEF\n\nĐIỀU 3: GHI';
        const result = detectArticles(input);
        expect(result.articles).toHaveLength(3);
        expect(result.articles).toEqual([
          'Điều 1: ABC',
          'Điều 2: DEF',
          'Điều 3: GHI',
        ]);
      });
    });

    describe('Blackbox', () => {
      it('should not match non-article text', () => {
        const input = 'Điều này là quan trọng';
        const result = detectArticles(input);
        expect(result.transformed).toBe(input);
        expect(result.articles).toHaveLength(0);
      });

      it('should not match điểu (typo)', () => {
        const input = 'điểu 1: test';
        const result = detectArticles(input);
        expect(result.articles).toHaveLength(0);
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        const result = detectArticles('');
        expect(result.transformed).toBe('');
        expect(result.articles).toHaveLength(0);
      });

      it('should handle text with only whitespace', () => {
        const result = detectArticles('   \n\n   ');
        expect(result.transformed).toBe('   \n\n   ');
      });
    });
  });

  // ── detectSections ────────────────────────────────────────

  describe('detectSections', () => {
    describe('Whitebox', () => {
      it('should detect CHƯƠNG with Roman numeral', () => {
        const input = 'CHƯƠNG I: QUY ĐỊNH CHUNG';
        const result = detectSections(input);
        expect(result.transformed).toBe('## Chương I: QUY ĐỊNH CHUNG');
        expect(result.sections).toHaveLength(1);
      });

      it('should detect MỤC with Arabic numeral', () => {
        const input = 'MỤC 1: Trách nhiệm';
        const result = detectSections(input);
        expect(result.transformed).toBe('## Mục 1: Trách nhiệm');
      });

      it('should detect PHẦN lowercase', () => {
        const input = 'phần 2: thủ tục';
        const result = detectSections(input);
        expect(result.transformed).toBe('## Phần 2: thủ tục');
      });

      it('should detect Chương without colon', () => {
        const input = 'Chương II QUYỀN VÀ NGHĨA VỤ';
        const result = detectSections(input);
        expect(result.sections).toHaveLength(1);
      });

      it('should detect multiple sections', () => {
        const input = 'Chương I: A\n\nMục 2: B\n\nPhần III: C';
        const result = detectSections(input);
        expect(result.sections).toHaveLength(3);
      });
    });

    describe('Blackbox', () => {
      it('should not match normal text', () => {
        const input = 'Chương trình học rất hay';
        const result = detectSections(input);
        expect(result.sections).toHaveLength(0);
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        const result = detectSections('');
        expect(result.transformed).toBe('');
        expect(result.sections).toHaveLength(0);
      });
    });
  });

  // ── detectSubItems ────────────────────────────────────────

  describe('detectSubItems', () => {
    describe('Whitebox', () => {
      it('should detect Khoản 1', () => {
        // SUBSECTION_RE: /^(Khoản|khoản)\s+(\d+)[.:]?(?:\s|$)/gim
        // Matches "Khoản 1 " → replaces whole match → "### Khoản 1" + remaining "Lương cơ bản"
        const result = detectSubItems('Khoản 1 Lương cơ bản');
        expect(result).toContain('### Khoản 1');
      });

      it('should detect khoản lowercase', () => {
        const result = detectSubItems('khoản 2  Phụ cấp');
        expect(result).toContain('### Khoản 2');
      });

      it('should handle khoản with dot', () => {
        // Khoản 3.  Thưởng → "### Khoản 3" (dot removed by replace, 1 space before Thưởng remains)
        const result = detectSubItems('Khoản 3.  Thưởng');
        expect(result).toMatch(/### Khoản 3/);
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(detectSubItems('')).toBe('');
      });

      it('should not match khoản without number', () => {
        const input = 'Khoản tiền này lớn';
        expect(detectSubItems(input)).toBe(input);
      });
    });
  });

  // ── detectPoints ──────────────────────────────────────────

  describe('detectPoints', () => {
    describe('Whitebox', () => {
      it('should convert a) to bullet', () => {
        expect(detectPoints('a) Nội dung thứ nhất')).toBe('- Nội dung thứ nhất');
      });

      it('should convert b) to bullet', () => {
        expect(detectPoints('b) Nội dung thứ hai')).toBe('- Nội dung thứ hai');
      });

      it('should convert c) to bullet', () => {
        expect(detectPoints('c) Nội dung thứ ba')).toBe('- Nội dung thứ ba');
      });

      it('should convert đ) to bullet', () => {
        expect(detectPoints('đ) Nội dung cuối')).toBe('- Nội dung cuối');
      });

      it('should handle indented points', () => {
        expect(detectPoints('  a) Test')).toBe('  - Test');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(detectPoints('')).toBe('');
      });

      it('should not match "a)" mid-line', () => {
        expect(detectPoints('text a) more text')).toBe('text a) more text');
      });
    });
  });

  // ── normalizeLists ────────────────────────────────────────

  describe('normalizeLists', () => {
    describe('Whitebox', () => {
      it('should normalize 1. prefix', () => {
        expect(normalizeLists('1. First item')).toBe('1. First item');
      });

      it('should normalize 2) prefix', () => {
        expect(normalizeLists('2) Second item')).toBe('2. Second item');
      });

      it('should not modify indented list items', () => {
        expect(normalizeLists('  1. Sub item')).toBe('  1. Sub item');
      });

      it('should handle 10. prefix', () => {
        expect(normalizeLists('10. Tenth item')).toBe('10. Tenth item');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(normalizeLists('')).toBe('');
      });

      it('should not match "1.5" as list item', () => {
        expect(normalizeLists('1.5 Not a list item')).toBe('1.5 Not a list item');
      });
    });
  });

  // ── detectAllCapsHeadings ─────────────────────────────────

  describe('detectAllCapsHeadings', () => {
    describe('Whitebox', () => {
      it('should detect ALL CAPS heading', () => {
        expect(detectAllCapsHeadings('TRÁCH NHIỆM CÁC BÊN')).toBe('### TRÁCH NHIỆM CÁC BÊN');
      });

      it('should detect ALL CAPS heading with numbers', () => {
        expect(detectAllCapsHeadings('ĐIỀU KHOẢN 1')).toBe('### ĐIỀU KHOẢN 1');
      });
    });

    describe('Blackbox', () => {
      it('should not detect short ALL CAPS (< 8 chars)', () => {
        expect(detectAllCapsHeadings('TÊN')).toBe('TÊN');
      });

      it('should not detect already-markdown heading', () => {
        expect(detectAllCapsHeadings('## ĐÃ LÀ HEADING')).toBe('## ĐÃ LÀ HEADING');
      });

      it('should not detect very long ALL CAPS (> 70 chars)', () => {
        const long = 'A'.repeat(71);
        expect(detectAllCapsHeadings(long)).toBe(long);
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(detectAllCapsHeadings('')).toBe('');
      });
    });
  });

  // ── phase2Detect orchestrator ─────────────────────────────

  describe('phase2Detect', () => {
    describe('Blackbox', () => {
      it('should detect articles only when configured', () => {
        const input = 'Điều 1: ABC\n\nChương I: DEF\n\nKhoản 1 XYZ';
        const result = phase2Detect(input, {
          articles: true,
          sections: false,
          subItems: false,
          lists: false,
        });
        expect(result.articles).toHaveLength(1);
        expect(result.sections).toHaveLength(0);
      });

      it('should detect sections only when configured', () => {
        const input = 'Điều 1: ABC\n\nChương I: DEF';
        const result = phase2Detect(input, {
          articles: false,
          sections: true,
          subItems: false,
          lists: false,
        });
        expect(result.articles).toHaveLength(0);
        expect(result.sections).toHaveLength(1);
      });

      it('should handle full detection', () => {
        const input = 'Điều 1: ABC\n\nChương I: DEF\n\nKhoản 1 GHI\n\na) item 1\nb) item 2';
        const result = phase2Detect(input);
        expect(result.articles).toHaveLength(1);
        expect(result.sections).toHaveLength(1);
        expect(result.transformed).toContain('## Điều 1: ABC');
        expect(result.transformed).toContain('## Chương I: DEF');
        expect(result.transformed).toContain('### Khoản 1');
        expect(result.transformed).toContain('- item 1');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        const result = phase2Detect('');
        expect(result.transformed).toBe('');
        expect(result.articles).toHaveLength(0);
        expect(result.sections).toHaveLength(0);
      });
    });
  });
});
