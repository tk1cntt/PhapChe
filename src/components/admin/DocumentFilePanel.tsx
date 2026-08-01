'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Upload, File, Loader2, AlertTriangle, Eye, CheckCircle2, AlertCircle, Clock, Maximize2, Minimize2, Sparkles, ChevronDown } from 'lucide-react';
import { DocumentPreviewTipTap } from './DocumentPreviewTipTap';
import { suggestReviewSkills, getPrimaryReviewSkill } from '@/lib/ai/domain-resolver';
import type { AgentSkill } from '@/lib/ai/types';
import type { Annotation } from './DocumentAnnotationPanel';

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
  expanded?: boolean;
  onToggleExpand?: () => void;
  // AI Review
  annotations?: Annotation[];
  onAiReview?: (skill: AgentSkill) => void;
  aiReviewLoading?: boolean;
  onAnnotationClick?: (annotation: Annotation, element: HTMLElement) => void;
  matterTypeKey?: string | null;
}

interface PreviewData {
  content: string;
  mimeType: string;
  title: string;
  isBinary: boolean;
  message?: string;
  officeFileType?: 'docx' | 'xlsx';
  previewFormat?: 'markdown' | 'text';
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
  if (mimeType?.includes('wordprocessingml')) return <FileText size={16} />;
  if (mimeType?.includes('spreadsheetml')) return <FileText size={16} />;
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

function getReviewStatusIcon(reviewStatus: string): React.ReactNode {
  switch (reviewStatus) {
    case 'reviewed': return <CheckCircle2 size={14} className="file-review-icon reviewed" />;
    case 'has_issues': return <AlertCircle size={14} className="file-review-icon has-issues" />;
    default: return <Clock size={14} className="file-review-icon pending" />;
  }
}

// ── Component ────────────────────────────────────────────────

export function DocumentFilePanel({ requestId, activeFileId, onSelectFile, expanded = true, onToggleExpand, annotations = [], onAiReview, aiReviewLoading = false, onAnnotationClick, matterTypeKey }: DocumentFilePanelProps) {
  const t = useTranslations('ChatActivity');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [reviewStatuses, setReviewStatuses] = useState<Record<string, string>>({});

  // ── Skill selector ──
  const reviewSkills = useMemo<AgentSkill[]>(() => suggestReviewSkills(matterTypeKey ?? null), [matterTypeKey]);
  const defaultSkill = useMemo<AgentSkill>(() => getPrimaryReviewSkill(matterTypeKey ?? null), [matterTypeKey]);
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill>(defaultSkill);

  // Cập nhật default skill khi matterTypeKey thay đổi
  useEffect(() => {
    setSelectedSkill(getPrimaryReviewSkill(matterTypeKey ?? null));
  }, [matterTypeKey]);

  // i18n key mapping — same names as ChatActivityPanel for consistency
  const SKILL_I18N_KEY_MAP: Record<string, string> = {
    'document-issue-analyzer': 'skillDocIssueAnalyzer',
    'nda-reviewer': 'skillNdaReview',
    'vendor-contract-reviewer': 'skillVendorContractReview',
    'commercial-contract-drafter': 'skillContractDraft',
    'commercial-contract-reviewer': 'skillContractReview',
    'board-resolution-drafter': 'skillBoardResolution',
    'entity-compliance-checker': 'skillEntityCompliance',
    'corporate-doc-generator': 'skillCorporateDocGen',
    'corporate-compliance-checker': 'skillComplianceCheck',
    'labor-discipline-checker': 'skillLaborDiscipline',
    'internal-regulation-drafter': 'skillInternalRegulation',
    'employment-contract-reviewer': 'skillEmploymentReview',
    'employment-policy-checker': 'skillEmploymentPolicy',
    'dsar-response-drafter': 'skillDsarResponse',
    'privacy-compliance-checker': 'skillPrivacyCompliance',
    'privacy-dpia-generator': 'skillDpiaGenerator',
    'tos-generator': 'skillTosGenerator',
    'regulatory-gap-analyzer': 'skillRegulatoryGap',
    'compliance-gap-analyzer': 'skillComplianceGap',
    'ai-impact-assessment': 'skillAiImpact',
    'ai-governance-assessor': 'skillAiGovernance',
    'trademark-clearance': 'skillTrademarkClearance',
    'cease-desist-drafter': 'skillCeaseDesist',
    'ip-trademark-search': 'skillIpSearch',
    'ip-patent-analyzer': 'skillPatentAnalyzer',
    'demand-letter-drafter': 'skillDemandLetter',
    'litigation-strategist': 'skillLitigationStrategy',
    'litigation-risk-scorer': 'skillLitigationRisk',
    'client-letter-drafter': 'skillClientLetter',
    'legal-memo-drafter': 'skillLegalMemo',
    'general-legal-researcher': 'skillGeneralResearch',
  } as const;

  const getSkillLabel = useCallback((skill: string): string => {
    const key = SKILL_I18N_KEY_MAP[skill];
    return key ? t(key as Parameters<typeof t>[0]) : skill;
  }, [t]);

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

  // ── Load review statuses ──

  const loadReviewStatuses = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/files/review-status`);
      if (!res.ok) return;
      const data = await res.json();
      setReviewStatuses(data.statuses ?? {});
    } catch {
      // silent
    }
  }, [requestId]);

  useEffect(() => {
    loadFiles();
    loadReviewStatuses();
  }, [loadFiles, loadReviewStatuses]);

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

  // ── Toggle review status ──

  const toggleReviewStatus = useCallback(async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't select the file
    const currentStatus = reviewStatuses[fileId] ?? 'pending';
    const nextStatus = currentStatus === 'reviewed' ? 'pending' : 'reviewed';

    // Optimistic update
    setReviewStatuses((prev) => ({ ...prev, [fileId]: nextStatus }));

    try {
      const res = await fetch(`/api/admin/requests/${requestId}/files/review-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey: fileId, status: nextStatus }),
      });
      if (!res.ok) {
        // Rollback
        setReviewStatuses((prev) => ({ ...prev, [fileId]: currentStatus }));
      }
    } catch {
      setReviewStatuses((prev) => ({ ...prev, [fileId]: currentStatus }));
    }
  }, [requestId, reviewStatuses]);

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="doc-file-panel">
      {/* File List */}
      <div className="doc-file-list-section">
        <div className="doc-file-list-header">
          <h3><FileText size={16} /> {t('documentTitle')}</h3>
          <div className="doc-file-list-header-actions">
            {onToggleExpand && (
              <button
                type="button"
                className="doc-file-expand-btn"
                onClick={onToggleExpand}
                title={expanded ? t('fileCollapse') : t('fileExpand')}
              >
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}
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
            {files.map((file) => {
              const reviewStatus = reviewStatuses[file.id] ?? 'pending';
              return (
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
                <div
                  className="doc-file-review-toggle"
                  onClick={(e) => toggleReviewStatus(file.id, e)}
                  title={reviewStatus === 'reviewed' ? t('fileStatusReviewed') : reviewStatus === 'has_issues' ? t('fileStatusHasIssues') : t('fileStatusPending')}
                >
                  {getReviewStatusIcon(reviewStatus)}
                </div>
              </button>
            )})}
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
              {onAiReview && (
                <div className="doc-file-ai-review-group" data-testid="doc-file-ai-review-group">
                  <button
                    type="button"
                    className="doc-file-ai-review-btn"
                    onClick={() => onAiReview(selectedSkill)}
                    disabled={aiReviewLoading || preview.isBinary}
                    title={getSkillLabel(selectedSkill)}
                  >
                    {aiReviewLoading ? (
                      <Loader2 size={14} className="spinning" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    AI Review
                  </button>
                  <div className="doc-file-skill-selector" data-testid="doc-file-skill-selector">
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value as AgentSkill)}
                      disabled={aiReviewLoading}
                      className="doc-file-skill-select"
                    >
                      {reviewSkills.map((sk) => (
                        <option key={sk} value={sk}>
                          {getSkillLabel(sk)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="doc-file-skill-chevron" />
                  </div>
                </div>
              )}
            </div>
            {annotations.length > 0 && !preview.isBinary ? (
              <div className="doc-file-preview-tiptap">
                <DocumentPreviewTipTap
                  content={preview.content}
                  annotations={annotations}
                  onAnnotationClick={onAnnotationClick}
                />
              </div>
            ) : preview.isBinary ? (
              <div className="doc-file-preview-binary">
                <Eye size={32} />
                <p>{preview.message ?? t('fileBinaryHint')}</p>
              </div>
            ) : preview.officeFileType ? (
              <div className="doc-file-preview-office">
                <div className="doc-file-preview-office-header">
                  <span className="doc-file-preview-office-badge">
                    {preview.officeFileType === 'docx' ? t('filePreviewDocx') : t('filePreviewXlsx')}
                  </span>
                </div>
                <div className="doc-file-preview-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {preview.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : preview.previewFormat === 'markdown' ? (
              <div className="doc-file-preview-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {preview.content}
                </ReactMarkdown>
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
