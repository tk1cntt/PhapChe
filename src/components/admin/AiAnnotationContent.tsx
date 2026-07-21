'use client';

/**
 * AiAnnotationContent — Shared component hiển thị structured AI review content.
 *
 * Dùng chung cho AiIssuePopup (popup) và DocumentAnnotationPanel (sidebar).
 * Parse content thành các section: Vấn đề → Đề xuất → Căn cứ pháp lý.
 * Label hiển thị inline như prefix của dòng text.
 */

import React from 'react';
import { AlertCircle, Lightbulb, Scale } from 'lucide-react';
import { parseAiAnnotationContent } from '@/lib/document/annotation-parser';
import '@/styles/shared/ai-annotation-content.css';

export interface AiAnnotationContentProps {
  content: string;
  /** Compact mode cho panel sidebar (mặc định false = popup mode) */
  compact?: boolean;
}

const SECTION_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'Vấn đề': AlertCircle,
  'Issue': AlertCircle,
  'Đề xuất': Lightbulb,
  'Recommendation': Lightbulb,
  'Căn cứ pháp lý': Scale,
  'Legal Basis': Scale,
};

const SECTION_CLASSES: Record<string, string> = {
  'Vấn đề': 'ai-section--issue',
  'Issue': 'ai-section--issue',
  'Đề xuất': 'ai-section--recommendation',
  'Recommendation': 'ai-section--recommendation',
  'Căn cứ pháp lý': 'ai-section--legal',
  'Legal Basis': 'ai-section--legal',
};

export function AiAnnotationContent({ content, compact = false }: AiAnnotationContentProps) {
  const parsed = parseAiAnnotationContent(content);

  // No sections → raw text fallback
  if (parsed.sections.length === 0) {
    return (
      <span className={`ai-raw-content${compact ? ' ai-raw-content--compact' : ''}`}>
        {parsed.raw}
      </span>
    );
  }

  return (
    <div className={`ai-annotation-content${compact ? ' ai-annotation-content--compact' : ''}`}>
      {parsed.sections.map((section) => {
        const Icon = SECTION_ICONS[section.label] || AlertCircle;
        const sectionClass = SECTION_CLASSES[section.label] || '';
        const iconSize = compact ? 10 : 12;

        return (
          <p key={section.key} className={`ai-section ${sectionClass}`}>
            <span className="ai-section-label">
              <Icon size={iconSize} className="ai-section-icon" />
              <strong>{section.label}</strong>
            </span>
            {section.content}
          </p>
        );
      })}
    </div>
  );
}
