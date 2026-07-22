'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, FileText, Send, Maximize2, Minimize2, Eye, Sparkles, Columns, MessageSquare, Clock } from 'lucide-react';
import { ChatActivityPanel } from '@/components/admin/ChatActivityPanel';
import { DocumentFilePanel, type FileItem } from '@/components/admin/DocumentFilePanel';
import { DocumentAnnotationPanel, type Annotation } from '@/components/admin/DocumentAnnotationPanel';
import { AiIssuePopup } from '@/components/admin/AiIssuePopup';
import { ReportDialog, type ReportData } from '@/components/admin/ReportDialog';
import { RequestTimeline } from '@/components/admin/RequestTimeline';
import '@/styles/pages/admin/chat-split.css';
import '@/styles/pages/admin/request-timeline.css';

type ChatMode = 'review' | 'ai-focus' | 'full-document';

interface RequestInfo {
  title: string;
  matterTypeKey: string | null;
  status: string;
}

const MODE_DEFS: { key: ChatMode; label: string; icon: typeof Eye; hint: string }[] = [
  { key: 'review', label: 'Review', icon: Eye, hint: 'Document 70% | AI 30%' },
  { key: 'ai-focus', label: 'AI Focus', icon: Sparkles, hint: 'Document 40% | AI 60%' },
  { key: 'full-document', label: 'Full Document', icon: Columns, hint: 'Document 100%' },
];

export default function ChatActivityPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('ChatActivity');
  const requestId = params.id as string;
  const locale = (params.locale as string) || 'vi';

  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  // Expand left panel (default mở rộng gấp 2)
  const [leftExpanded, setLeftExpanded] = useState(true);

  // Chat mode: controls document/AI split ratio
  const [chatMode, setChatMode] = useState<ChatMode>('review');

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // AI Review state
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiAnnotations, setAiAnnotations] = useState<Annotation[]>([]);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);
  const [annotationReloadKey, setAnnotationReloadKey] = useState(0);

  // Popup state
  const [popupAnnotation, setPopupAnnotation] = useState<Annotation | null>(null);
  const [popupRefElement, setPopupRefElement] = useState<HTMLElement | null>(null);

  // Left-bottom tab: "Chú thích" | "Lịch sử"
  const [leftBottomTab, setLeftBottomTab] = useState<'annotations' | 'timeline'>('annotations');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/requests/${requestId}`);

        if (!res.ok) {
          if (res.status === 404) throw new Error('Request not found');
          throw new Error('Failed to load request');
        }

        const data = await res.json();
        if (cancelled) return;

        const req = data.data ?? data;
        setRequestInfo({
          title: req.title ?? 'Request',
          matterTypeKey: req.matterTypeKey ?? req.intakeSubmission?.matterTypeKey ?? null,
          status: req.status ?? 'draft_intake',
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [requestId]);

  const handleBack = useCallback(() => {
    router.push(`/${locale}/admin/requests`);
  }, [router, locale]);

  const handleSelectFile = useCallback((fileId: string | null, fileTitle: string | null) => {
    setActiveFileId(fileId);
    setActiveFileName(fileTitle);
    // Reset AI annotations khi chuyển file
    if (fileId !== activeFileId) {
      setAiAnnotations([]);
      setAiReviewError(null);
      setPopupAnnotation(null);
      setPopupRefElement(null);
    }
  }, [activeFileId]);

  // ── Generate Report ──

  const handleGenerateReport = useCallback(async () => {
    setReportOpen(true);
    setReportLoading(true);
    setReport(null);

    try {
      const res = await fetch(`/api/admin/requests/${requestId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeResolved: false }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setReport(data.report);
    } catch {
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, [requestId]);

  // ── Submit for Review ──

  const handleSubmitForReview = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_review' }),
      });
      if (res.ok) {
        setRequestInfo((prev) => prev ? { ...prev, status: 'pending_review' } : prev);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }, [requestId]);

  const canSubmit = requestInfo?.status === 'in_progress';

  // ── AI Review ──

  const handleAiReview = useCallback(async () => {
    if (!activeFileId) return;
    setAiReviewLoading(true);
    setAiReviewError(null);
    setAiAnnotations([]);

    try {
      const res = await fetch(`/api/admin/requests/${requestId}/files/${activeFileId}/ai-review`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'UNKNOWN' }));
        throw new Error(err.error || 'AI review failed');
      }

      // Reload annotations từ GET API để có đủ fields (aiGenerated, aiConfidence, position...)
      const annRes = await fetch(`/api/admin/requests/${requestId}/files/annotations?fileKey=${activeFileId}`);
      if (annRes.ok) {
        const annData = await annRes.json();
        setAiAnnotations(annData.annotations ?? []);
      }
      // Trigger DocumentAnnotationPanel reload
      setAnnotationReloadKey((k) => k + 1);
    } catch (err) {
      setAiReviewError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAiReviewLoading(false);
    }
  }, [requestId, activeFileId]);

  const handleAnnotationClick = useCallback((annotation: Annotation, element: HTMLElement) => {
    setPopupAnnotation(annotation);
    setPopupRefElement(element);
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupAnnotation(null);
    setPopupRefElement(null);
  }, []);

  const handleAcceptAnnotation = useCallback(async (annotation: Annotation) => {
    try {
      await fetch(`/api/admin/requests/${requestId}/files/annotations/${annotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      setAiAnnotations((prev) =>
        prev.map((a) => (a.id === annotation.id ? { ...a, status: 'resolved' as const } : a)),
      );
      setAnnotationReloadKey((k) => k + 1);
    } catch {
      // silent
    }
  }, [requestId]);

  const handleDismissAnnotation = useCallback(async (annotation: Annotation) => {
    try {
      await fetch(`/api/admin/requests/${requestId}/files/annotations/${annotation.id}`, {
        method: 'DELETE',
      });
      setAiAnnotations((prev) => prev.filter((a) => a.id !== annotation.id));
      setAnnotationReloadKey((k) => k + 1);
    } catch {
      // silent
    }
  }, [requestId]);

  if (loading) {
    return (
      <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-height))' }}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading...</div>
      </div>
    );
  }

  if (error || !requestInfo) {
    return (
      <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--topbar-height))', gap: 'var(--space-md)' }}>
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>Error</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{error || 'Request not found'}</div>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Back to requests
        </button>
      </div>
    );
  }

  return (
    <div className="chat-split-page">
      {/* Header */}
      <div className="chat-split-header">
        <div className="chat-split-header-left">
          <button
            type="button"
            className="chat-split-back-btn"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <span className="chat-split-header-title">{requestInfo.title}</span>
          {activeFileName && (
            <span className="chat-split-header-file">
              · {activeFileName}
            </span>
          )}
        </div>

        {/* Mode Selector */}
        <div className="chat-split-mode-group" role="radiogroup" aria-label="View mode">
          {MODE_DEFS.map((mode) => {
            const Icon = mode.icon;
            const isActive = chatMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                className={`chat-split-mode-btn${isActive ? ' active' : ''}`}
                onClick={() => setChatMode(mode.key)}
                title={mode.hint}
                role="radio"
                aria-checked={isActive}
              >
                <Icon size={14} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="chat-split-header-right">
          {/* Request status badge */}
          <span className={`chat-split-status-badge status-${requestInfo.status}`}>
            {t('requestStatus')}: {requestInfo.status}
          </span>
          {/* Generate Report */}
          <button
            type="button"
            className="chat-split-header-action"
            onClick={handleGenerateReport}
            title={t('reportGenerate')}
          >
            <FileText size={14} />
            {t('reportGenerate')}
          </button>
          {/* Submit for Review */}
          {canSubmit && (
            <button
              type="button"
              className="chat-split-header-action primary"
              onClick={handleSubmitForReview}
              disabled={submitting}
            >
              <Send size={14} />
              {submitting ? '...' : t('submitForReview')}
            </button>
          )}
        </div>
      </div>

      {/* Split Layout */}
      <div className={`chat-split-body mode-${chatMode}${leftExpanded ? ' expanded' : ''}`}>
        {/* Left: Document Panel + Annotations */}
        <div className="chat-split-left">
          <div className="chat-split-left-top">
            <DocumentFilePanel
              requestId={requestId}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              expanded={leftExpanded}
              onToggleExpand={() => setLeftExpanded((v) => !v)}
              annotations={aiAnnotations}
              onAiReview={handleAiReview}
              aiReviewLoading={aiReviewLoading}
              onAnnotationClick={handleAnnotationClick}
            />
          </div>
          <div className="chat-split-left-bottom">
            {/* Tab bar */}
            <div className="chat-split-subtabs">
              <button
                type="button"
                className={`chat-split-subtab${leftBottomTab === 'annotations' ? ' active' : ''}`}
                onClick={() => setLeftBottomTab('annotations')}
              >
                <MessageSquare size={14} />
                {t('annotations') ?? 'Chú thích'}
              </button>
              <button
                type="button"
                className={`chat-split-subtab${leftBottomTab === 'timeline' ? ' active' : ''}`}
                onClick={() => setLeftBottomTab('timeline')}
              >
                <Clock size={14} />
                {t('timelineTab') ?? 'Lịch sử'}
              </button>
            </div>

            {leftBottomTab === 'annotations' ? (
              <DocumentAnnotationPanel
                requestId={requestId}
                fileKey={activeFileId}
                fileName={activeFileName}
                reloadKey={annotationReloadKey}
              />
            ) : (
              <div className="chat-split-timeline-wrap">
                <RequestTimeline
                  requestId={requestId}
                  labels={{
                    title: t('timelineTitle') ?? 'Lịch sử hoạt động',
                    empty: t('timelineEmpty') ?? 'Chưa có hoạt động nào',
                    loading: t('timelineLoading') ?? 'Đang tải...',
                    error: t('timelineError') ?? 'Không thể tải lịch sử',
                    retry: t('timelineRetry') ?? 'Thử lại',
                    specialist: t('timelineSpecialist') ?? 'Chuyên viên',
                    reviewer: t('timelineReviewer') ?? 'Người kiểm duyệt',
                    unassigned: t('timelineUnassigned') ?? 'Chưa phân công',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat Panel */}
        <div className="chat-split-right">
          <ChatActivityPanel
            requestId={requestId}
            requestTitle={requestInfo.title}
            matterTypeKey={requestInfo.matterTypeKey}
            activeFileId={activeFileId}
            activeFileName={activeFileName}
          />
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        report={report}
        loading={reportLoading}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      {/* AI Issue Popup */}
      <AiIssuePopup
        annotation={popupAnnotation}
        referenceElement={popupRefElement}
        onAccept={handleAcceptAnnotation}
        onDismiss={handleDismissAnnotation}
        onClose={handleClosePopup}
      />

      {/* AI Review Error Toast */}
      {aiReviewError && (
        <div className="ai-review-error-toast">
          <span>{aiReviewError}</span>
          <button type="button" onClick={() => setAiReviewError(null)}>×</button>
        </div>
      )}

      {/* AI Review Full-Screen Loading Overlay */}
      {aiReviewLoading && (
        <div className="ai-review-overlay">
          <div className="ai-review-overlay-card">
            <div className="ai-review-overlay-spinner" />
            <p className="ai-review-overlay-title">{t('aiReviewInProgress') ?? 'AI Review đang xử lý'}</p>
            <p className="ai-review-overlay-hint">{t('aiReviewWait') ?? 'Vui lòng không rời khỏi trang này...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
