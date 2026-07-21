'use client';

/**
 * DocumentPreviewTipTap — Read-only document viewer with inline AI issue highlights.
 *
 * Uses TipTap with StarterKit to render document content line-by-line
 * with color-coded highlights at annotation positions.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';

import type { Annotation } from './DocumentAnnotationPanel';

// ── Props ──────────────────────────────────────────────────────

export interface DocumentPreviewTipTapProps {
  content: string;
  annotations: Annotation[];
  onAnnotationClick?: (annotation: Annotation, element: HTMLElement) => void;
  activeAnnotationId?: string | null;
}

// ── Severity color map ─────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.25)',
  high: 'rgba(245, 158, 11, 0.25)',
  medium: 'rgba(59, 130, 246, 0.2)',
  low: 'rgba(107, 114, 128, 0.15)',
  info: 'rgba(107, 114, 128, 0.15)',
  warning: 'rgba(245, 158, 11, 0.25)',
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.7)',
  high: 'rgba(245, 158, 11, 0.7)',
  medium: 'rgba(59, 130, 246, 0.6)',
  low: 'rgba(107, 114, 128, 0.4)',
  info: 'rgba(107, 114, 128, 0.4)',
  warning: 'rgba(245, 158, 11, 0.7)',
};

// ── Content → HTML ─────────────────────────────────────────────

export function contentToHtml(content: string): string {
  if (!content) return '<p></p>';
  const lines = content.split('\n');
  return lines
    .map((line, i) => `<p data-line="${i + 1}">${escapeHtml(line) || '&nbsp;'}</p>`)
    .join('');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Annotation Map Builder ─────────────────────────────────────

export function buildAnnotationMap(annotations: Annotation[] | null | undefined): Map<number, Annotation[]> {
  const map = new Map<number, Annotation[]>();
  if (!annotations) return map;
  for (const ann of annotations) {
    if (ann.status === 'dismissed') continue;
    const line = ann.position?.lineStart ?? ann.position?.line ?? 1;
    const existing = map.get(line) || [];
    existing.push(ann);
    map.set(line, existing);
  }
  return map;
}

export function getHighestSeverity(annotations: Annotation[]): string {
  const order = ['critical', 'high', 'medium', 'warning', 'low', 'info'];
  for (const s of order) {
    if (annotations.some((a) => a.severity === s)) return s;
  }
  return 'info';
}

// ── DOM Highlight Application ──────────────────────────────────

function applyLineHighlights(dom: HTMLElement, annMap: Map<number, Annotation[]>): void {
  const paragraphs = dom.querySelectorAll('[data-line]');
  paragraphs.forEach((p) => {
    const el = p as HTMLElement;
    const line = Number(el.getAttribute('data-line'));
    const lineAnn = annMap.get(line);

    // Reset
    el.style.backgroundColor = '';
    el.style.borderLeft = '';
    el.style.paddingLeft = '';
    el.style.cursor = '';
    el.style.borderRadius = '';
    delete el.dataset.highlighted;
    delete el.dataset.severity;
    delete el.dataset.annotationCount;

    if (lineAnn && lineAnn.length > 0) {
      const highestSev = getHighestSeverity(lineAnn);
      el.style.backgroundColor = SEVERITY_COLORS[highestSev] || SEVERITY_COLORS.info;
      el.style.borderLeft = `3px solid ${SEVERITY_BORDER[highestSev] || SEVERITY_BORDER.info}`;
      el.style.paddingLeft = '8px';
      el.style.cursor = 'pointer';
      el.style.borderRadius = '2px';
      el.dataset.highlighted = 'true';
      el.dataset.severity = highestSev;
      el.dataset.annotationCount = String(lineAnn.length);
    }
  });
}

// ── Component ──────────────────────────────────────────────────

export function DocumentPreviewTipTap({
  content,
  annotations,
  onAnnotationClick,
  activeAnnotationId,
}: DocumentPreviewTipTapProps) {
  const annMapRef = useRef<Map<number, Annotation[]>>(new Map());
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  // Build annotation map
  useEffect(() => {
    annMapRef.current = buildAnnotationMap(annotations);
  }, [annotations]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
      Highlight.configure({ multicolor: true }),
    ],
    content: contentToHtml(content),
    editable: false,
  });

  editorRef.current = editor;

  // Apply highlights after editor is ready and on annotation changes
  useEffect(() => {
    if (!editor) return;
    // Wait for DOM render
    const timer = setTimeout(() => {
      applyLineHighlights(editor.view.dom, annMapRef.current);
    }, 50);
    return () => clearTimeout(timer);
  }, [editor, annotations]);

  // Update content when content prop changes
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(contentToHtml(content));
      setTimeout(() => {
        applyLineHighlights(editor.view.dom, annMapRef.current);
      }, 50);
    }
  }, [content, editor]);

  // Handle clicks on highlighted lines
  useEffect(() => {
    if (!editor) return;
    const container = editor.view.dom;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const paragraph = target.closest?.('[data-line]') as HTMLElement | null;
      if (!paragraph || paragraph.dataset.highlighted !== 'true') return;

      const line = Number(paragraph.getAttribute('data-line'));
      const lineAnn = annMapRef.current.get(line);
      if (!lineAnn || lineAnn.length === 0) return;

      const sorted = [...lineAnn].sort((a, b) => {
        const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, warning: 2, low: 3, info: 4 };
        return (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5);
      });

      onAnnotationClick?.(sorted[0], paragraph);
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [editor, onAnnotationClick]);

  // Scroll to active annotation
  useEffect(() => {
    if (!activeAnnotationId || !editor) return;
    const activeAnn = annotations.find((a) => a.id === activeAnnotationId);
    if (!activeAnn) return;
    const line = activeAnn.position?.lineStart ?? activeAnn.position?.line ?? 1;
    const el = editor.view.dom.querySelector(`[data-line="${line}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeAnnotationId, annotations, editor]);

  // Expose the annotation map so external code can read it
  // (used by AiIssuePopup for line-at-click lookup)
  if (typeof window !== 'undefined') {
    (window as Record<string, unknown>).__tiptapAnnotationMap = annMapRef.current;
  }

  return (
    <div className="tiptap-document-container">
      <EditorContent editor={editor} />
    </div>
  );
}
