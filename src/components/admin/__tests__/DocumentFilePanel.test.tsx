/**
 * DocumentFilePanel Tests — Skill Selector Integration
 *
 * Covers: AI Review skill selector dropdown, dynamic skills from domain-resolver,
 * skill selection state, file list/preview, review status toggle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── JSDOM polyfills ──────────────────────────────────────────

Element.prototype.scrollIntoView = vi.fn();

// ── Mocks ────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      documentTitle: 'Tài liệu',
      fileLoading: 'Đang tải...',
      fileNoFiles: 'Chưa có tài liệu',
      fileExpand: 'Mở rộng',
      fileCollapse: 'Thu gọn',
      fileRefresh: 'Tải lại',
      fileSelectHint: 'Chọn tài liệu để xem',
      filePreviewLoading: 'Đang tải xem trước...',
      filePreviewDocx: 'DOCX',
      filePreviewXlsx: 'XLSX',
      fileBinaryHint: 'Không thể xem trước',
      fileStatusDraft: 'Nháp',
      fileStatusUploaded: 'Đã upload',
      fileStatusPublished: 'Đã xuất bản',
      fileStatusReviewed: 'Đã rà soát',
      fileStatusHasIssues: 'Có vấn đề',
      fileStatusPending: 'Chưa rà soát',
      fileTypeGenerated: 'Tạo tự động',
      fileTypeUploaded: 'Upload',
    };
    return map[key] ?? key;
  },
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) =>
    React.createElement('div', { 'data-testid': 'markdown' }, children),
}));

vi.mock('remark-gfm', () => ({ default: vi.fn() }));

vi.mock('./DocumentPreviewTipTap', () => ({
  DocumentPreviewTipTap: () => React.createElement('div', { 'data-testid': 'tiptap-preview' }, 'TipTap Preview'),
}));

// Mock domain-resolver
vi.mock('@/lib/ai/domain-resolver', () => ({
  suggestReviewSkills: (matterTypeKey: string | null) => {
    if (!matterTypeKey) return ['document-issue-analyzer', 'nda-reviewer', 'vendor-contract-reviewer'];
    if (matterTypeKey === 'nda') return ['nda-reviewer', 'vendor-contract-reviewer', 'commercial-contract-reviewer'];
    if (matterTypeKey === 'labor_discipline') return ['document-issue-analyzer', 'employment-contract-reviewer', 'labor-discipline-checker'];
    if (matterTypeKey === 'trademark') return ['document-issue-analyzer', 'entity-compliance-checker'];
    return ['document-issue-analyzer', 'nda-reviewer', 'vendor-contract-reviewer'];
  },
  getPrimaryReviewSkill: (matterTypeKey: string | null) => {
    if (!matterTypeKey) return 'document-issue-analyzer';
    if (matterTypeKey === 'nda') return 'nda-reviewer';
    if (matterTypeKey === 'trademark') return 'document-issue-analyzer';
    if (matterTypeKey === 'labor_discipline') return 'document-issue-analyzer';
    return 'document-issue-analyzer';
  },
  matterTypeToDomain: () => 'commercial-legal',
}));

import { DocumentFilePanel, type FileItem } from '../DocumentFilePanel';

// ── Helpers ────────────────────────────────────────────────

const MOCK_FILES: FileItem[] = [
  {
    id: 'vf_f1', type: 'vault_file', title: 'hop-dong-thuong-mai.docx',
    filename: 'hop-dong-thuong-mai.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 102400, status: 'uploaded', createdAt: new Date().toISOString(),
  },
  {
    id: 'gen_g1', type: 'generated', title: 'NDA Template',
    filename: null, mimeType: null, size: null, status: 'published',
    createdAt: new Date().toISOString(),
  },
];

/** Setup fetch mocks for files + review status + optional preview */
function mockFetchChain({
  files = MOCK_FILES,
  preview,
  withPreview = false,
}: {
  files?: FileItem[];
  preview?: Record<string, unknown>;
  withPreview?: boolean;
} = {}) {
  (global.fetch as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files }) })   // load files
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ statuses: {} }) }); // review status

  if (withPreview) {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          preview ?? {
            content: '# Test Markdown',
            mimeType: 'text/markdown',
            title: 'Test doc',
            isBinary: false,
          },
        ),
    });
  }
}

// ── Tests ──────────────────────────────────────────────────

describe('DocumentFilePanel — Skill Selector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Whitebox ────────────────────────────────────────

  describe('Whitebox', () => {
    it('renders skill selector dropdown with AI Review button', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy();
      });
      expect(screen.getByTestId('doc-file-skill-selector')).toBeTruthy();
    });

    it('defaults selectedSkill to getPrimarySkill for matterTypeKey', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());

      const select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      expect(select.value).toBe('nda-reviewer');
    });

    it('renders review skills from suggestReviewSkills for matterTypeKey', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());

      const select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toEqual(['nda-reviewer', 'vendor-contract-reviewer', 'commercial-contract-reviewer']);
    });

    it('calls onAiReview with selected skill on button click', async () => {
      const onAiReview = vi.fn();
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={onAiReview} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());

      const select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      fireEvent.change(select, { target: { value: 'vendor-contract-reviewer' } });
      const aiBtn = screen.getByTestId('doc-file-ai-review-group').querySelector('button')!;
      fireEvent.click(aiBtn);

      expect(onAiReview).toHaveBeenCalledWith('vendor-contract-reviewer');
    });
  });

  // ── Blackbox ────────────────────────────────────────

  describe('Blackbox', () => {
    it('does NOT render skill selector when onAiReview not provided', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByText('hop-dong-thuong-mai.docx')).toBeTruthy());
      expect(screen.queryByTestId('doc-file-ai-review-group')).toBeNull();
    });

    it('falls back to document-issue-analyzer with no matterTypeKey', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()}
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());
      const select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      expect(select.value).toBe('document-issue-analyzer');
    });

    it('disables select while AI review loading', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} aiReviewLoading={true} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());
      const select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      expect(select.disabled).toBe(true);
    });

    it('switches skill options when matterTypeKey changes', async () => {
      mockFetchChain({ withPreview: true });

      const { rerender } = render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="trademark"
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());
      let select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      expect(select.value).toBe('document-issue-analyzer');

      rerender(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => {
        select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
        expect(select.value).toBe('nda-reviewer');
      });
    });
  });

  // ── Abnormal ────────────────────────────────────────

  describe('Abnormal / Edge Cases', () => {
    it('handles null matterTypeKey with default skill', async () => {
      mockFetchChain({ withPreview: true });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey={null}
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());
      const select = screen.getByTestId('doc-file-ai-review-group').querySelector('select')!;
      expect(select.value).toBe('document-issue-analyzer');
    });

    it('disables AI review button for binary file', async () => {
      const binaryFiles: FileItem[] = [{
        id: 'vf_img1', type: 'vault_file', title: 'scan.png',
        filename: 'scan.png', mimeType: 'image/png', size: 500000,
        status: 'uploaded', createdAt: new Date().toISOString(),
      }];
      mockFetchChain({
        files: binaryFiles,
        preview: { content: '', mimeType: 'image/png', title: 'scan.png', isBinary: true, message: 'binary' },
        withPreview: true,
      });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_img1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByTestId('doc-file-ai-review-group')).toBeTruthy());
      const aiBtn = screen.getByTestId('doc-file-ai-review-group').querySelector('button')!;
      expect(aiBtn.disabled).toBe(true);
    });
  });

  // ── Error ──────────────────────────────────────────

  describe('Error', () => {
    it('shows error message when file list fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId={null} onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByText('Network error')).toBeTruthy());
    });

    it('shows error when preview fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: MOCK_FILES }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ statuses: {} }) })
        .mockRejectedValueOnce(new Error('Preview failed'));

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId="vf_f1" onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByText('Preview failed')).toBeTruthy());
    });

    it('handles 500 error from file list API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal error' }),
      });

      render(
        <DocumentFilePanel
          requestId="req-1" activeFileId={null} onSelectFile={vi.fn()}
          onAiReview={vi.fn()} matterTypeKey="nda"
        />,
      );

      await waitFor(() => expect(screen.getByText('Failed to load files')).toBeTruthy());
    });
  });
});
