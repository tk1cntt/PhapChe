'use client';

import { Sparkles } from 'lucide-react';

export interface RequestCardStyle {
  bg: string;
  color: string;
}

export interface RequestCardProps {
  code: string;
  title: string;
  /** Extra line under title (reviewer/specialist name, description...) */
  subtitle?: string;
  /** Meta info lines (customer, workspace, matter type — pre-translated) */
  metaLines: string[];
  priority: string;
  priorityStyle: RequestCardStyle;
  statusLabel: string;
  statusStyle: RequestCardStyle;
  /** Footer left: date or any string */
  date: string;
  /** Footer right: action button(s) slot */
  actionSlot: React.ReactNode;
  /** AI chat callback */
  onAiClick: () => void;
  /** AI button tooltip */
  aiTooltip?: string;
  testId?: string;
}

const Badge: React.FC<{ label: string; style: RequestCardStyle }> = ({ label, style }) => (
  <span
    className="request-card-badge"
    style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}20` }}
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
}: RequestCardProps) {
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

      {/* ── Footer: date + actions ── */}
      <div className="request-card-footer">
        <span className="request-card-date">{date}</span>
        <div className="request-card-actions">
          {actionSlot}
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
        </div>
      </div>
    </div>
  );
}
