'use client';

import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Info, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import type { SkillResult, AgentSkill } from '@/lib/ai/types';

// ── Types ────────────────────────────────────────────────────

export interface AiResultCardProps {
  result: SkillResult;
  skill: AgentSkill;
  skillLabel?: string;
  /** Callback when user clicks "apply" to use AI output */
  onApply?: (result: SkillResult) => void;
  loading?: boolean;
  error?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────

function getRiskClass(level: string): string {
  switch (level) {
    case 'critical':
    case 'high':
      return 'ai-risk-critical';
    case 'medium':
    case 'moderate':
      return 'ai-risk-medium';
    case 'low':
    case 'minor':
      return 'ai-risk-low';
    default:
      return '';
  }
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'high-score';
  if (score >= 50) return 'mid-score';
  return 'low-score';
}

function getConfidenceLabel(confidence: number): { label: string; cssClass: string } {
  if (confidence >= 0.8) return { label: 'Cao', cssClass: 'high' };
  if (confidence >= 0.5) return { label: 'Trung bình', cssClass: 'medium' };
  return { label: 'Thấp', cssClass: 'low' };
}

// ── Sub-components ───────────────────────────────────────────

function ContractSection({ output }: { output: Record<string, unknown> }) {
  const clauses = Array.isArray(output.clauses) ? output.clauses : [];
  const parties = Array.isArray(output.parties) ? output.parties : [];
  const warnings = Array.isArray(output.warnings) ? output.warnings : [];

  return (
    <div className="ai-result-section-sm">
      {(output.contractTitle as string) && (
        <h4 className="ai-contract-title">
          {output.contractTitle as string}
        </h4>
      )}

      {parties.length > 0 && (
        <div>
          <p className="ai-sub-title">Các bên:</p>
          {parties.map((p: Record<string, unknown>, i: number) => (
            <div key={i} className="ai-party-row">
              <span className="ai-party-role">{p.role as string}:</span> {p.name as string}
            </div>
          ))}
        </div>
      )}

      {clauses.length > 0 && (
        <div>
          <p className="ai-sub-title">
            Điều khoản ({clauses.length}):
          </p>
          {clauses.slice(0, 5).map((c: Record<string, unknown>, i: number) => (
            <div key={i} className="ai-detail-item">
              <p className="ai-detail-title">
                Điều {c.articleNumber as number}: {c.title as string}
              </p>
              {(c.legalBasis as string) && (
                <p className="ai-detail-sub">
                  📜 {c.legalBasis as string}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="ai-warning-box">
          <p className="ai-warning-title">⚠ Cảnh báo:</p>
          {warnings.map((w: string, i: number) => (
            <p key={i} className="ai-warning-item">• {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewSection({ output }: { output: Record<string, unknown> }) {
  const findings = Array.isArray(output.findings) ? output.findings : [];
  const risk = output.overallRisk as string ?? 'unknown';
  const score = typeof output.complianceScore === 'number' ? output.complianceScore : null;

  return (
    <div className="ai-result-section-sm">
      <div className="ai-result-meta">
        <span className={`ai-risk-badge ${getRiskClass(risk)}`}>
          Rủi ro: {risk}
        </span>
        {score !== null && (
          <span className={`ai-score ${getScoreClass(score)}`}>
            Tuân thủ: {score}/100
          </span>
        )}
      </div>

      {findings.length > 0 && (
        <div>
          <p className="ai-sub-title">
            Phát hiện ({findings.length}):
          </p>
          {findings.map((f: Record<string, unknown>, i: number) => (
            <div key={i} className="ai-detail-item">
              <div className="ai-result-meta">
                <span className={`ai-risk-badge ${getRiskClass(f.severity as string)}`}>
                  {f.severity as string}
                </span>
                <span className="ai-detail-title">{f.issue as string}</span>
              </div>
              {(f.recommendation as string) && (
                <p className="ai-detail-sub">
                  → {f.recommendation as string}
                </p>
              )}
              {(f.legalBasis as string) && (
                <p className="ai-legal-basis">📜 {f.legalBasis as string}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplianceSection({ output }: { output: Record<string, unknown> }) {
  const gaps = Array.isArray(output.gaps) ? output.gaps : [];
  const checks = Array.isArray(output.checks) ? output.checks : [];
  const items = gaps.length > 0 ? gaps : checks;
  const score = typeof output.complianceScore === 'number' ? output.complianceScore : null;

  return (
    <div className="ai-result-section-sm">
      {score !== null && (
        <p className={`ai-score ${getScoreClass(score)}`} style={{ fontSize: 'var(--text-lg)' }}>
          Điểm tuân thủ: {score}/100
        </p>
      )}

      {items.length > 0 && (
        <div>
          {items.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="ai-detail-item">
              <div className="ai-result-meta" style={{ justifyContent: 'space-between' }}>
                <span className="ai-detail-title" style={{ fontSize: 'var(--text-xs)' }}>
                  {item.category as string ?? item.area as string}
                </span>
                {(item.status as string) && (
                  <span className={`ai-status-pill ${
                    item.status === 'compliant' ? 'compliant' :
                    item.status === 'non_compliant' ? 'non-compliant' :
                    'partial'
                  }`}>
                    {item.status as string}
                  </span>
                )}
                {(item.severity as string) && (
                  <span className={`ai-risk-badge ${getRiskClass(item.severity as string)}`}>
                    {item.severity as string}
                  </span>
                )}
              </div>
              {(item.action as string) && (
                <p className="ai-detail-sub">{item.action as string}</p>
              )}
              {(item.legalBasis as string) && (
                <p className="ai-legal-basis">📜 {item.legalBasis as string}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneralSection({ output }: { output: Record<string, unknown> }) {
  const answer = output.answer as string;
  const legalBasis = Array.isArray(output.legalBasis) ? output.legalBasis : [];
  const nextSteps = Array.isArray(output.nextSteps) ? output.nextSteps : [];

  return (
    <div className="ai-result-section-sm">
      {Boolean(answer) && (
        <p className="ai-summary-text">{answer}</p>
      )}

      {legalBasis.length > 0 && (
        <div>
          <p className="ai-sub-title">Căn cứ pháp lý:</p>
          {legalBasis.map((lb: Record<string, unknown>, i: number) => (
            <div key={i} className="ai-legal-basis">
              📜 {lb.law as string}{(lb.article as string) ? ` — ${lb.article as string}` : ''}
              {(lb.content as string) && <p className="ai-legal-basis-sub">{lb.content as string}</p>}
            </div>
          ))}
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="ai-next-steps">
          <p className="ai-next-steps-title">Các bước tiếp theo:</p>
          {nextSteps.map((s: string, i: number) => (
            <p key={i} className="ai-next-steps-item">• {s}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export function AiResultCard({
  result,
  skill,
  skillLabel,
  onApply,
  loading = false,
  error = null,
}: AiResultCardProps) {
  const [expandedResult, setExpandedResult] = React.useState(true);
  const isContractSkill = skill.includes('contract') || skill.includes('drafter');
  const isReviewSkill = skill.includes('reviewer') || skill.includes('risk-scorer') || skill.includes('litigation');
  const isComplianceSkill = skill.includes('compliance') || skill.includes('policy') || skill.includes('dpia') || skill.includes('regulatory') || skill.includes('assessor');
  const isGeneralSkill = skill.includes('researcher') || skill.includes('search') || skill.includes('analyzer');

  if (loading) {
    return (
      <div className="ai-result-loading" data-testid="ai-result-loading">
        <div className="ai-result-loading-header">
          <div className="ai-skeleton-circle" />
          <div className="ai-skeleton-line w-1-3" />
        </div>
        <div className="ai-skeleton-body">
          <div className="ai-skeleton-text w-full" />
          <div className="ai-skeleton-text w-5-6" />
          <div className="ai-skeleton-text w-2-3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-result-error" data-testid="ai-result-error">
        <AlertTriangle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  const output = result.output ?? {};
  const confidenceInfo = getConfidenceLabel(result.confidence);

  return (
    <div className="ai-result-card" data-testid="ai-result-card">
      {/* Header */}
      <div className="ai-result-header">
        <button
          type="button"
          onClick={() => setExpandedResult(!expandedResult)}
          className="ai-result-header-left"
          data-testid="ai-result-toggle"
        >
          {expandedResult ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Sparkles size={14} />
          <span>{skillLabel ?? skill}</span>
        </button>
        <div className="ai-result-header-right">
          <span className={`ai-confidence ${confidenceInfo.cssClass}`} data-testid="ai-result-confidence">
            Độ tin cậy: {confidenceInfo.label} ({(result.confidence * 100).toFixed(0)}%)
          </span>
          {result.citations.length > 0 && (
            <span className="ai-citation-count" title={`${result.citations.length} trích dẫn`}>
              📜{result.citations.length}
            </span>
          )}
        </div>
      </div>

      {expandedResult && (
        <div className="ai-result-body" data-testid="ai-result-body">
          {/* Summary */}
          {Boolean(result.summary) && (
            <div className="ai-summary-row">
              <Info size={14} />
              <p className="ai-summary-text">{result.summary as string}</p>
            </div>
          )}

          {/* Skill-specific output */}
          {isContractSkill && <ContractSection output={output} />}
          {isReviewSkill && <ReviewSection output={output} />}
          {isComplianceSkill && <ComplianceSection output={output} />}
          {isGeneralSkill && <GeneralSection output={output} />}

          {/* Citations */}
          {result.citations.length > 0 && (
            <div className="ai-citations">
              <p className="ai-citations-label">
                Tài liệu tham khảo ({result.citations.length}):
              </p>
              <div className="ai-citations-list">
                {result.citations.map((c, i) => (
                  <span key={i} className="ai-citation-tag">
                    📜 {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {onApply && (
            <div className="ai-apply-wrap">
              <button
                type="button"
                onClick={() => onApply(result)}
                className="ai-apply-btn"
                data-testid="ai-result-apply"
              >
                Áp dụng kết quả này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
