'use client';

/**
 * AiIssuePopup — Floating UI popup for AI-detected issues.
 *
 * Displays annotation details (severity, confidence, issue, recommendation,
 * legal basis) at the clicked highlight position using @floating-ui/react.
 */

import React, { useCallback } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
  FloatingPortal,
} from '@floating-ui/react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

import type { Annotation } from './DocumentAnnotationPanel';
import { AiAnnotationContent } from './AiAnnotationContent';
import '@/styles/pages/admin/ai-issue-popup.css';

// ── Props ──────────────────────────────────────────────────────

export interface AiIssuePopupProps {
  annotation: Annotation | null;
  referenceElement: HTMLElement | null;
  onAccept?: (annotation: Annotation) => void;
  onDismiss?: (annotation: Annotation) => void;
  onClose: () => void;
}

// ── Severity config ────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { icon: React.FC<{ size?: number; className?: string }>; label: string; color: string }> = {
  critical: { icon: AlertCircle, label: 'Nghiêm trọng', color: '#ef4444' },
  high: { icon: AlertTriangle, label: 'Cao', color: '#f59e0b' },
  medium: { icon: Info, label: 'Trung bình', color: '#3b82f6' },
  low: { icon: Info, label: 'Thấp', color: '#6b7280' },
  info: { icon: Info, label: 'Thông tin', color: '#6b7280' },
  warning: { icon: AlertTriangle, label: 'Cảnh báo', color: '#f59e0b' },
};

// ── Component ──────────────────────────────────────────────────

export function AiIssuePopup({
  annotation,
  referenceElement,
  onAccept,
  onDismiss,
  onClose,
}: AiIssuePopupProps) {
  const arrowRef = React.useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    elements: { reference: referenceElement },
    placement: 'right-start',
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const handleAccept = useCallback(() => {
    if (annotation) onAccept?.(annotation);
    onClose();
  }, [annotation, onAccept, onClose]);

  const handleDismiss = useCallback(() => {
    if (annotation) onDismiss?.(annotation);
    onClose();
  }, [annotation, onDismiss, onClose]);

  if (!annotation || !referenceElement) return null;

  const sevConfig = SEVERITY_CONFIG[annotation.severity] || SEVERITY_CONFIG.info;
  const SevIcon = sevConfig.icon;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="ai-issue-popup"
      >
        {/* Header */}
        <div className="ai-issue-popup-header">
          <div className="ai-issue-popup-severity" style={{ color: sevConfig.color }}>
            <SevIcon size={16} />
            <span>{sevConfig.label}</span>
          </div>
          {annotation.aiGenerated && (
            <div className="ai-issue-popup-ai-badge">
              <Sparkles size={12} />
              <span>AI</span>
            </div>
          )}
          {annotation.aiConfidence !== undefined && (
            <div className="ai-issue-popup-confidence">
              {(annotation.aiConfidence * 100).toFixed(0)}% tin cậy
            </div>
          )}
          <button
            type="button"
            className="ai-issue-popup-close"
            onClick={onClose}
            title="Đóng"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="ai-issue-popup-body">
          <AiAnnotationContent content={annotation.content} />
        </div>

        {/* Actions */}
        {annotation.aiGenerated && annotation.status === 'open' && (
          <div className="ai-issue-popup-actions">
            <button
              type="button"
              className="ai-issue-popup-btn accept"
              onClick={handleAccept}
            >
              <Check size={14} />
              Chấp nhận
            </button>
            <button
              type="button"
              className="ai-issue-popup-btn dismiss"
              onClick={handleDismiss}
            >
              <X size={14} />
              Bỏ qua
            </button>
          </div>
        )}

        <FloatingArrow ref={arrowRef} context={context} className="ai-issue-popup-arrow" />
      </div>
    </FloatingPortal>
  );
}
