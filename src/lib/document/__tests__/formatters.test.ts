import { describe, it, expect } from 'vitest';
import {
  formatHeadingHierarchy,
  formatListMarkers,
  formatBlankLineSpacing,
  escapeHtmlEntities,
  phase3Format,
} from '../normalizer/formatters';

describe('Phase 3: Formatters', () => {
  // ── formatHeadingHierarchy ────────────────────────────────

  describe('formatHeadingHierarchy', () => {
    describe('Whitebox', () => {
      it('should upgrade ### to ## when no ## exists', () => {
        const input = '### Khoản 1\nNội dung\n### Khoản 2\nNội dung 2';
        const result = formatHeadingHierarchy(input);
        expect(result).not.toContain('###');
        expect(result).toContain('## Khoản 1');
        expect(result).toContain('## Khoản 2');
      });

      it('should keep ### when ## exists', () => {
        const input = '## Điều 1\n### Khoản 1\nNội dung';
        const result = formatHeadingHierarchy(input);
        expect(result).toContain('### Khoản 1');
      });

      it('should not change text without headings', () => {
        const input = 'Đây là văn bản bình thường';
        expect(formatHeadingHierarchy(input)).toBe(input);
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(formatHeadingHierarchy('')).toBe('');
      });
    });
  });

  // ── formatListMarkers ─────────────────────────────────────

  describe('formatListMarkers', () => {
    describe('Whitebox', () => {
      it('should convert * to - for unordered list items', () => {
        expect(formatListMarkers('* Item 1\n* Item 2')).toBe('- Item 1\n- Item 2');
      });

      it('should keep - unchanged', () => {
        expect(formatListMarkers('- Item 1\n- Item 2')).toBe('- Item 1\n- Item 2');
      });

      it('should not convert **bold** markers', () => {
        expect(formatListMarkers('**bold text**')).toBe('**bold text**');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(formatListMarkers('')).toBe('');
      });
    });
  });

  // ── formatBlankLineSpacing ────────────────────────────────

  describe('formatBlankLineSpacing', () => {
    describe('Whitebox', () => {
      it('should add blank line before heading', () => {
        const input = 'text\n## Heading';
        const result = formatBlankLineSpacing(input);
        expect(result).toBe('text\n\n## Heading');
      });

      it('should add blank line before list', () => {
        const input = 'text\n- Item';
        const result = formatBlankLineSpacing(input);
        expect(result).toBe('text\n\n- Item');
      });

      it('should not add blank line if already there', () => {
        const input = 'text\n\n## Heading';
        const result = formatBlankLineSpacing(input);
        expect(result).toBe('text\n\n## Heading');
      });

      it('should not add blank line if previous is heading', () => {
        const input = '## Heading\n### Sub';
        const result = formatBlankLineSpacing(input);
        expect(result).toBe('## Heading\n### Sub');
      });

      it('should handle ordered list', () => {
        const input = 'text\n1. First';
        const result = formatBlankLineSpacing(input);
        expect(result).toBe('text\n\n1. First');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(formatBlankLineSpacing('')).toBe('');
      });
    });
  });

  // ── escapeHtmlEntities ────────────────────────────────────

  describe('escapeHtmlEntities', () => {
    describe('Whitebox', () => {
      it('should escape & to &amp;', () => {
        expect(escapeHtmlEntities('A & B')).toBe('A &amp; B');
      });

      it('should escape < to &lt;', () => {
        expect(escapeHtmlEntities('a < b')).toBe('a &lt; b');
      });

      it('should escape > to &gt;', () => {
        expect(escapeHtmlEntities('a > b')).toBe('a &gt; b');
      });

      it('should not double-escape &amp;', () => {
        expect(escapeHtmlEntities('A &amp; B')).toBe('A &amp; B');
      });

      it('should not re-escape &lt;', () => {
        expect(escapeHtmlEntities('a &lt; b')).toBe('a &lt; b');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(escapeHtmlEntities('')).toBe('');
      });
    });
  });

  // ── phase3Format orchestrator ─────────────────────────────

  describe('phase3Format', () => {
    describe('Blackbox', () => {
      it('should run all formatters', () => {
        const input = '### A\n### B\n\ntext\n* item\n<p>test</p>';
        const result = phase3Format(input);
        // ### upgraded to ## since no ## exists
        expect(result).toContain('## A');
        expect(result).toContain('## B');
        // * converted to -
        expect(result).toContain('- item');
        // HTML escaped
        expect(result).toContain('&lt;p&gt;test&lt;/p&gt;');
      });
    });

    describe('Error', () => {
      it('should handle empty string', () => {
        expect(phase3Format('')).toBe('');
      });

      it('should handle all formatters disabled', () => {
        const input = '### A\n* item\n<p>test</p>';
        const result = phase3Format(input, {
          htmlEntities: false,
          headingHierarchy: false,
          listMarkers: false,
          blankLineSpacing: false,
        });
        // All disabled → output should be identical (blankLineSpacing adds blanks)
        expect(result).toContain('### A');
        expect(result).toContain('* item');
      });
    });
  });
});
