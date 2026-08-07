'use client';

import { Sparkles, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface RequestCardStyle {
  bg: string;
  color: string;
}

export interface RequestCardStats {
  fileCount: number;
  annotationCount: number;
  annotationResolved: number;
}

export interface RequestCardBadgeInfo {
  label: string;
  style: RequestCardStyle;
}

export interface RequestCardAiConfig {
  onClick: () => void;
  tooltip?: string;
  show?: boolean;
}

export interface RequestCardProps {
  code: string;
  title: string;
  /** Extra line under title (reviewer/specialist name, description...) */
  subtitle?: string;
  /** Meta info lines (customer, workspace, matter type — pre-translated) */
  metaLines: string[];
  priority: RequestCardBadgeInfo;
  status: RequestCardBadgeInfo;
  /** Footer left: date or any string */
  date: string;
  /** Footer right: action button(s) slot */
  actionSlot: React.ReactNode;
  /** AI chat configuration */
  ai?: RequestCardAiConfig;
  testId?: string;
  /** Document & annotation stats */
  stats?: RequestCardStats;
}
  ai?: RequestCardAiConfig;
  testId?: string;
  /** Document & annotation stats */
  stats?: RequestCardStats;
}
  >
    {label}
  </span>
);

export default function RequestCard({
  code,
  title,
  subtitle,
  metaLines,
  priority,
  priorityStyle,
  statusLabel,
  statusStyle,
  date,
  actionSlot,
  onAiClick,
  aiTooltip,
  testId,
  stats,
  showAiButton = false,
}: RequestCardProps) {
  const fileCount = stats?.fileCount ?? 0;
  const annotationCount = stats?.annotationCount ?? 0;
  const annotationResolved = stats?.annotationResolved ?? 0;

  return (
    <div className="request-card" data-testid={testId ?? `request-card-${code}`}>
      {/* ── Header: code + badges ── */}
      <div className="request-card-header">
        <span className="request-card-code">{code}</span>
        <div className="request-card-badges">
          <Badge label={priority} style={priorityStyle} />
          <Badge label={statusLabel} style={statusStyle} />
        </div>
      </div>

      {/* ── Title ── */}
      <div className="request-card-title" title={title}>
        {title}
      </div>

      {/* ── Subtitle / description ── */}
      {subtitle && <div className="request-card-subtitle">{subtitle}</div>}

      {/* ── Meta ── */}
      {metaLines.length > 0 && (
        <div className="request-card-meta">
          {metaLines.map((line, i) => (
            <span key={i} className="request-card-meta-item">{line}</span>
          ))}
        </div>
      )}

      {/* ── Footer: stats + date | actions ── */}
      <div className="request-card-footer">
        <div className="request-card-footer-left">
          <div className="request-card-stats">
            <span className="request-card-stat" data-testid={testId ? `${testId}-file-count` : undefined}>
              <FileText size={12} />
              {fileCount}
            </span>
            {annotationCount > 0 && (
              <span className="request-card-stat">
                <AlertCircle size={12} />
                {annotationCount}
              </span>
            )}
            {annotationResolved > 0 && (
              <span className="request-card-stat resolved">
                <CheckCircle2 size={12} />
                {annotationResolved}
              </span>
            )}
          </div>
          <span className="request-card-date">{date}</span>
        </div>
        <div className="request-card-actions">
          {actionSlot}
          {showAiButton && (
            <button
              type="button"
              className="request-card-ai-btn"
              onClick={onAiClick}
              title={aiTooltip ?? 'AI Assistant'}
              data-testid={testId ? `${testId}-ai-btn` : `request-card-ai-${code}`}
            >
              <Sparkles size={13} />
              AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
