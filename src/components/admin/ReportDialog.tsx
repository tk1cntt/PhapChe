'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Copy, Download, FileText, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@/styles/pages/admin/report-dialog.css';

// ── Types ────────────────────────────────────────────────────

export interface ReportData {
  id: string;
  title: string;
  content: string;
  summary: {
    totalFiles: number;
    reviewedFiles: number;
    totalAnnotations: number;
    criticalIssues: number;
    warnings: number;
    suggestions: number;
    questions: number;
    openAnnotations: number;
  };
  createdAt: string;
}

interface ReportDialogProps {
  report: ReportData | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onSelectFile?: (fileKey: string, fileName: string) => void;
}

// ── Component ────────────────────────────────────────────────

export function ReportDialog({ report, loading, open, onClose, onSelectFile }: ReportDialogProps) {
  const t = useTranslations('ChatActivity');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!report?.content) return;
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = report.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [report]);

  const handleDownload = useCallback(() => {
    if (!report?.content) return;
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [report]);

  if (!open) return null;

  return (
    <div className="report-dialog-overlay" onClick={onClose}>
      <div className="report-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-dialog-header">
          <div className="report-dialog-header-left">
            <FileText size={18} />
            <h2 className="report-dialog-title">{report?.title ?? t('reportTitle')}</h2>
          </div>
          <div className="report-dialog-header-right">
            <button
              type="button"
              className="report-dialog-action"
              onClick={handleCopy}
              disabled={!report || loading}
              title={t('reportCopy')}
            >
              <Copy size={14} />
              {copied ? '✓' : t('reportCopy')}
            </button>
            <button
              type="button"
              className="report-dialog-action"
              onClick={handleDownload}
              disabled={!report || loading}
              title={t('reportDownload')}
            >
              <Download size={14} />
              {t('reportDownload')}
            </button>
            <button
              type="button"
              className="report-dialog-close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="report-dialog-loading">
            <Loader2 size={32} className="spinning" />
            <p>{t('reportGenerating')}</p>
          </div>
        )}

        {/* Summary Stats */}
        {report && !loading && (
          <div className="report-dialog-summary">
            <h3>{t('reportSummary')}</h3>
            <div className="report-summary-grid">
              <div className="report-summary-item">
                <span className="report-summary-value">{report.summary.totalFiles}</span>
                <span className="report-summary-label">{t('reportTotalFiles')}</span>
              </div>
              <div className="report-summary-item">
                <span className="report-summary-value reviewed">{report.summary.reviewedFiles}</span>
                <span className="report-summary-label">{t('reportReviewedFiles')}</span>
              </div>
              <div className="report-summary-item">
                <span className="report-summary-value">{report.summary.totalAnnotations}</span>
                <span className="report-summary-label">{t('reportTotalNotes')}</span>
              </div>
              <div className="report-summary-item">
                <span className="report-summary-value critical">{report.summary.criticalIssues}</span>
                <span className="report-summary-label">🔴 Critical</span>
              </div>
              <div className="report-summary-item">
                <span className="report-summary-value warning">{report.summary.warnings}</span>
                <span className="report-summary-label">🟡 Warning</span>
              </div>
              <div className="report-summary-item">
                <span className="report-summary-value info">{report.summary.suggestions}</span>
                <span className="report-summary-label">💡 Suggestions</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {report && !loading && (
          <div className="report-dialog-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
