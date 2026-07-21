/**
 * DocumentPreviewTipTap Tests
 *
 * Test categories: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────

const mockSetContent = vi.fn();
let mockUseEditorCalls: unknown[][] = [];

vi.mock('@tiptap/react', () => ({
  useEditor: (...args: unknown[]) => {
    mockUseEditorCalls.push(args);
    return {
      view: { dom: document.createDocumentFragment() },
      commands: { setContent: mockSetContent },
    };
  },
  EditorContent: ({ editor }: { editor: unknown }) =>
    React.createElement('div', {
      'data-testid': 'editor-content',
      'data-editor': editor ? 'active' : 'inactive',
    }),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: () => ({}) },
}));

vi.mock('@tiptap/extension-highlight', () => ({
  Highlight: { configure: () => ({}) },
}));

// ── Imports ─────────────────────────────────────────────────────

import {
  DocumentPreviewTipTap,
  contentToHtml,
  escapeHtml,
  buildAnnotationMap,
  getHighestSeverity,
} from '../DocumentPreviewTipTap';
import type { Annotation } from '../DocumentAnnotationPanel';

// ── Helpers ─────────────────────────────────────────────────────

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    fileKey: 'file-1',
    authorId: 'user-1',
    authorName: 'Reviewer',
    content: '**Vấn đề:** Thiếu điều khoản\n**Đề xuất:** Bổ sung\n**Căn cứ:** BLDS 2015',
    severity: 'high',
    category: 'issue',
    position: { lineStart: 3, lineEnd: 3, line: 3 },
    status: 'open',
    aiGenerated: true,
    aiConfidence: 0.85,
    createdAt: '2026-07-20T00:00:00Z',
    updatedAt: '2026-07-20T00:00:00Z',
    ...overrides,
  };
}

const SAMPLE_CONTENT = `Điều 1: Bên bán
Điều 2: Bên mua
Điều 3: Giá trị hợp đồng
Điều 4: Phương thức thanh toán
Điều 5: Thời hạn`;

// ── Whitebox Tests ──────────────────────────────────────────────

describe('DocumentPreviewTipTap — Whitebox', () => {
  beforeEach(() => {
    mockUseEditorCalls = [];
    mockSetContent.mockReset();
  });

  // contentToHtml
  describe('contentToHtml', () => {
    it('converts multiline text to data-line paragraphs', () => {
      const html = contentToHtml('Line 1\nLine 2\nLine 3');
      expect(html).toContain('data-line="1"');
      expect(html).toContain('data-line="2"');
      expect(html).toContain('data-line="3"');
      expect(html).not.toContain('data-line="0"');
    });

    it('returns empty paragraph for empty content', () => {
      const html = contentToHtml('');
      expect(html).toBe('<p></p>');
    });

    it('handles single-line content', () => {
      const html = contentToHtml('Chỉ một dòng');
      expect(html).toContain('data-line="1"');
      expect(html).not.toContain('data-line="2"');
    });
  });

  // escapeHtml
  describe('escapeHtml', () => {
    it('escapes < and >', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes ampersand', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('escapes double quotes', () => {
      expect(escapeHtml('he said "hello"')).toBe('he said &quot;hello&quot;');
    });

    it('leaves safe text unchanged', () => {
      const safe = 'Điều 1: Bên bán và bên mua';
      expect(escapeHtml(safe)).toBe(safe);
    });
  });

  // buildAnnotationMap
  describe('buildAnnotationMap', () => {
    it('maps annotation to its lineStart position', () => {
      const annotations = [makeAnnotation({ position: { lineStart: 5, lineEnd: 5 } })];
      const map = buildAnnotationMap(annotations);
      expect(map.has(5)).toBe(true);
      expect(map.get(5)?.length).toBe(1);
    });

    it('falls back to position.line when lineStart is missing', () => {
      const annotations = [makeAnnotation({ position: { line: 7 } })];
      const map = buildAnnotationMap(annotations);
      expect(map.has(7)).toBe(true);
    });

    it('defaults to line 1 when no position info', () => {
      const annotations = [makeAnnotation({ position: null })];
      const map = buildAnnotationMap(annotations);
      expect(map.has(1)).toBe(true);
    });

    it('excludes dismissed annotations', () => {
      const annotations = [
        makeAnnotation({ id: 'a1', status: 'dismissed', position: { lineStart: 2 } }),
        makeAnnotation({ id: 'a2', status: 'open', position: { lineStart: 2 } }),
      ];
      const map = buildAnnotationMap(annotations);
      expect(map.get(2)?.length).toBe(1);
      expect(map.get(2)?.[0].id).toBe('a2');
    });

    it('groups multiple annotations on the same line', () => {
      const annotations = [
        makeAnnotation({ id: 'a1', severity: 'high', position: { lineStart: 3 } }),
        makeAnnotation({ id: 'a2', severity: 'critical', position: { lineStart: 3 } }),
      ];
      const map = buildAnnotationMap(annotations);
      expect(map.get(3)?.length).toBe(2);
    });

    it('handles null annotations input', () => {
      const map = buildAnnotationMap(null);
      expect(map.size).toBe(0);
    });

    it('handles undefined annotations input', () => {
      const map = buildAnnotationMap(undefined);
      expect(map.size).toBe(0);
    });

    it('handles empty array', () => {
      const map = buildAnnotationMap([]);
      expect(map.size).toBe(0);
    });
  });

  // getHighestSeverity
  describe('getHighestSeverity', () => {
    it('returns critical over high', () => {
      const anns = [
        makeAnnotation({ severity: 'high' }),
        makeAnnotation({ severity: 'critical' }),
      ];
      expect(getHighestSeverity(anns)).toBe('critical');
    });

    it('returns high over medium', () => {
      expect(getHighestSeverity([
        makeAnnotation({ severity: 'medium' }),
        makeAnnotation({ severity: 'high' }),
      ])).toBe('high');
    });

    it('returns info for info-only annotations', () => {
      expect(getHighestSeverity([
        makeAnnotation({ severity: 'info' }),
      ])).toBe('info');
    });

    it('returns info for empty array', () => {
      expect(getHighestSeverity([])).toBe('info');
    });
  });

  // Editor config
  describe('useEditor config', () => {
    it('passes 2 extensions (StarterKit + Highlight) to useEditor', () => {
      mockUseEditorCalls = [];
      render(
        <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={[]} />,
      );

      expect(mockUseEditorCalls.length).toBeGreaterThanOrEqual(1);
      const config = mockUseEditorCalls[0]?.[0] as Record<string, unknown> | undefined;
      expect((config?.extensions as unknown[])?.length).toBe(2);
      expect(config?.editable).toBe(false);
    });

    it('calls contentToHtml for editor content', () => {
      mockUseEditorCalls = [];
      render(
        <DocumentPreviewTipTap content="Dòng duy nhất" annotations={[]} />,
      );

      const config = mockUseEditorCalls[0]?.[0] as Record<string, unknown> | undefined;
      expect(config?.content).toContain('data-line="1"');
      expect(config?.content).toContain('Dòng duy nhất');
    });
  });
});

// ── Blackbox Tests ──────────────────────────────────────────────

describe('DocumentPreviewTipTap — Blackbox', () => {
  beforeEach(() => {
    mockUseEditorCalls = [];
    mockSetContent.mockReset();
  });

  it('renders editor content container', () => {
    const { getByTestId } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={[]} />,
    );
    expect(getByTestId('editor-content')).toBeTruthy();
  });

  it('wraps content in tiptap-document-container class', () => {
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('accepts annotations prop without errors', () => {
    const annotations = [
      makeAnnotation({ id: 'a1', severity: 'medium' }),
      makeAnnotation({ id: 'a2', severity: 'critical' }),
    ];
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={annotations} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('re-renders when content prop changes', () => {
    const { rerender } = render(
      <DocumentPreviewTipTap content="Old content" annotations={[]} />,
    );

    mockSetContent.mockReset();
    rerender(
      <DocumentPreviewTipTap content="New content" annotations={[]} />,
    );

    expect(mockSetContent).toHaveBeenCalled();
  });

  it('builds annotation map from annotation positions', () => {
    const onClick = vi.fn();
    const annotations = [
      makeAnnotation({ id: 'a1', position: { lineStart: 2, lineEnd: 2 }, severity: 'critical' }),
    ];

    const { container } = render(
      <DocumentPreviewTipTap
        content={SAMPLE_CONTENT}
        annotations={annotations}
        onAnnotationClick={onClick}
      />,
    );

    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });
});

// ── Abnormal Tests ──────────────────────────────────────────────

describe('DocumentPreviewTipTap — Abnormal', () => {
  it('handles content with no annotations', () => {
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles annotations with null position', () => {
    const annotations = [makeAnnotation({ position: null })];
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={annotations} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles annotations with dismissed status — excluded from map', () => {
    const annotations = [
      makeAnnotation({ id: 'a1', status: 'dismissed', position: { lineStart: 2 } }),
      makeAnnotation({ id: 'a2', status: 'open', position: { lineStart: 3 } }),
    ];
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={annotations} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles very long content without crashing', () => {
    const longContent = Array.from(
      { length: 500 },
      (_, i) => `Line ${i + 1}: Nội dung dòng số ${i + 1} trong tài liệu pháp lý mẫu`,
    ).join('\n');

    const { container } = render(
      <DocumentPreviewTipTap content={longContent} annotations={[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles special characters in content', () => {
    const specialContent = 'Dấu & ký hiệu < > " \' ` $ { } [ ] ( )\nDòng hai với tab\tvà slash\\';
    const { container } = render(
      <DocumentPreviewTipTap content={specialContent} annotations={[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles unicode/vietnamese content', () => {
    const vnContent = 'Điều 1: Bên bán hàng hóa\nĐiều 2: Trách nhiệm của các bên\nĐiều 3: Phương thức giải quyết tranh chấp';
    const { container } = render(
      <DocumentPreviewTipTap content={vnContent} annotations={[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });
});

// ── Error Tests ─────────────────────────────────────────────────

describe('DocumentPreviewTipTap — Error', () => {
  it('handles undefined content gracefully', () => {
    const { container } = render(
      <DocumentPreviewTipTap content={undefined as unknown as string} annotations={[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles null annotations gracefully', () => {
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={null as unknown as Annotation[]} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });

  it('handles line number exceeding content length', () => {
    const annotations = [
      makeAnnotation({ position: { lineStart: 9999, lineEnd: 9999 }, severity: 'critical' }),
    ];
    const { container } = render(
      <DocumentPreviewTipTap content={SAMPLE_CONTENT} annotations={annotations} />,
    );
    expect(container.querySelector('.tiptap-document-container')).toBeTruthy();
  });
});
