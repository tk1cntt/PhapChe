'use client';

/**
 * AiAnnotationContent — Shared component hiển thị structured AI review content.
 *
 * Parse content thành các section, tất cả nội dung (icon + label + text)
 * nằm trên cùng 1 dòng, chỉ border-left làm điểm nhấn.
 */

import React from 'react';
import { AlertCircle, Lightbulb, Scale } from 'lucide-react';
import { parseAiAnnotationContent } from '@/lib/document/annotation-parser';
import '@/styles/shared/ai-annotation-content.css';

export interface AiAnnotationContentProps {
  content: string;
  compact?: boolean;
}

const SECTION_META: Record<string, { icon: React.FC<{ size?: number; className?: string }>; cssClass: string }> = {
  'Vấn đề':          { icon: AlertCircle, cssClass: 'ai-section--issue' },
  'Issue':           { icon: AlertCircle, cssClass: 'ai-section--issue' },
  'Đề xuất':          { icon: Lightbulb,   cssClass: 'ai-section--recommendation' },
  'Recommendation':   { icon: Lightbulb,   cssClass: 'ai-section--recommendation' },
  'Căn cứ pháp lý':    { icon: Scale,       cssClass: 'ai-section--legal' },
  'Legal Basis':      { icon: Scale,       cssClass: 'ai-section--legal' },
};

export function AiAnnotationContent({ content, compact = false }: AiAnnotationContentProps) {
  const parsed = parseAiAnnotationContent(content);

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
        const meta = SECTION_META[section.label]
          ?? { icon: AlertCircle, cssClass: '' };
        const Icon = meta.icon;
        const iconSize = compact ? 10 : 12;

        return (
          <div key={section.key} className={`ai-section ${meta.cssClass}`}>
            <Icon size={iconSize} className="ai-section-icon" />
            <strong className="ai-section-label">{section.label}</strong>
            <span className="ai-section-text">{section.content}</span>
          </div>
        );
      })}
    </div>
  );
}
