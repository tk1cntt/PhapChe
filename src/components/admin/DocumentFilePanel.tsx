'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Upload, File, Loader2, AlertTriangle, Eye } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

export interface FileItem {
  id: string;
  type: 'vault_file' | 'document' | 'generated';
  title: string;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
  status: string | null;
  createdAt: string;
}

interface DocumentFilePanelProps {
  requestId: string;
  activeFileId: string | null;
  onSelectFile: (fileId: string | null, fileTitle: string | null) => void;
}

interface PreviewData {
  content: string;
  mimeType: string;
  title: string;
  isBinary: boolean;
  message?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function formatSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null, type: string): React.ReactNode {
  if (type === 'generated') return <FileText size={16} />;
  if (mimeType?.startsWith('image/')) return <Eye size={16} />;
  if (mimeType === 'application/pdf') return <FileText size={16} />;
  return <File size={16} />;
}

function getStatusLabel(status: string | null, t: ReturnType<typeof useTranslations<'ChatActivity'>>): string {
  switch (status) {
    case 'draft': return t('fileStatusDraft');
    case 'uploaded': return t('fileStatusUploaded');
    case 'published': return t('fileStatusPublished');
    default: return status ?? '';
  }
}

// ── Component ────────────────────────────────────────────────

export function DocumentFilePanel({ requestId, activeFileId, onSelectFile }: DocumentFilePanelProps) {
  const t = useTranslations('ChatActivity');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // ── Load file list ──

  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      const res = await fetch(`/api/admin/requests/${requestId}/files`);
      if (!res.ok) throw new Error('Failed to load files');
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFilesLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ── Load preview when activeFileId changes ──

  useEffect(() => {
    if (!activeFileId) {
      setPreview(null);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const res = await fetch(`/api/admin/requests/${requestId}/files/${activeFileId}/preview`);
        if (!res.ok) throw new Error('Failed to load preview');
        const data = await res.json();
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) setPreviewError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    loadPreview();
    return () => { cancelled = true; };
  }, [requestId, activeFileId]);

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="doc-file-panel">
      {/* File List */}
      <div className="doc-file-list-section">
        <div className="doc-file-list-header">
          <h3><FileText size={16} /> {t('documentTitle')}</h3>
          <button
            type="button"
            className="doc-file-refresh-btn"
            onClick={loadFiles}
            disabled={filesLoading}
            title={t('fileRefresh')}
          >
            <Loader2 size={14} className={filesLoading ? 'spinning' : ''} />
          </button>
        </div>

        {filesLoading ? (
          <div className="doc-file-list-loading">
            <Loader2 size={20} className="spinning" />
            {t('fileLoading')}
          </div>
        ) : filesError ? (
          <div className="doc-file-list-error">
            <AlertTriangle size={16} />
            {filesError}
          </div>
        ) : files.length === 0 ? (
          <div className="doc-file-list-empty">
            <Upload size={24} />
            <p>{t('fileNoFiles')}</p>
          </div>
        ) : (
          <div className="doc-file-list-items">
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                className={`doc-file-item${activeFileId === file.id ? ' active' : ''}`}
                onClick={() => onSelectFile(activeFileId === file.id ? null : file.id, file.title)}
              >
                <div className="doc-file-item-icon">
                  {getFileIcon(file.mimeType, file.type)}
                </div>
                <div className="doc-file-item-info">
                  <span className="doc-file-item-name">{file.title}</span>
                  <span className="doc-file-item-meta">
                    {file.mimeType}
                    {file.size != null && <> · {formatSize(file.size)}</>}
                    {file.status && <> · {getStatusLabel(file.status, t)}</>}
                  </span>
                </div>
                <div className={`doc-file-item-type-badge ${file.type}`}>
                  {file.type === 'generated' ? t('fileTypeGenerated') : t('fileTypeUploaded')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="doc-file-preview-section">
        {!activeFileId ? (
          <div className="doc-file-preview-empty">
            <Eye size={32} />
            <p>{t('fileSelectHint')}</p>
          </div>
        ) : previewLoading ? (
          <div className="doc-file-preview-loading">
            <Loader2 size={20} className="spinning" />
            {t('filePreviewLoading')}
          </div>
        ) : previewError ? (
          <div className="doc-file-preview-error">
            <AlertTriangle size={16} />
            {previewError}
          </div>
        ) : preview ? (
          <div className="doc-file-preview-content">
            <div className="doc-file-preview-header">
              <h4>{preview.title}</h4>
              <span className="doc-file-preview-mime">{preview.mimeType}</span>
            </div>
            {preview.isBinary ? (
              <div className="doc-file-preview-binary">
                <Eye size={32} />
                <p>{preview.message ?? t('fileBinaryHint')}</p>
              </div>
            ) : (
              <pre className="doc-file-preview-text">{preview.content}</pre>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
