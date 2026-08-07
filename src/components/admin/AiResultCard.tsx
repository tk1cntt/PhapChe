'use client';

import React from 'react';
import { Sparkles, AlertTriangle, Info, ChevronDown, ChevronRight } from 'lucide-react';
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

const RISK_CLASS_MAP: Record<string, string> = {
  critical: 'ai-risk-critical',
  high: 'ai-risk-critical',
  medium: 'ai-risk-medium',
  moderate: 'ai-risk-medium',
  low: 'ai-risk-low',
  minor: 'ai-risk-low',
};

function getRiskClass(level: string): string {
  return RISK_CLASS_MAP[level] ?? '';
}

const SCORE_HIGH_THRESHOLD = 80;
const SCORE_MID_THRESHOLD = 50;
const CONFIDENCE_HIGH_THRESHOLD = 0.8;
const CONFIDENCE_MID_THRESHOLD = 0.5;

function getScoreClass(score: number): string {
  if (score >= SCORE_HIGH_THRESHOLD) return 'high-score';
  if (score >= SCORE_MID_THRESHOLD) return 'mid-score';
  return 'low-score';
}

function getConfidenceLabel(confidence: number): { label: string; cssClass: string } {
  if (confidence >= CONFIDENCE_HIGH_THRESHOLD) return { label: 'Cao', cssClass: 'high' };
  if (confidence >= CONFIDENCE_MID_THRESHOLD) return { label: 'Trung bình', cssClass: 'medium' };
  return { label: 'Thấp', cssClass: 'low' };
}
function getConfidenceLabel(confidence: number): { label: string; cssClass: string } {
  if (confidence >= CONFIDENCE_HIGH_THRESHOLD) return { label: 'Cao', cssClass: 'high' };
  if (confidence >= CONFIDENCE_MID_THRESHOLD) return { label: 'Trung bình', cssClass: 'medium' };
  return { label: 'Thấp', cssClass: 'low' };
}
  parties?: Array<{ role: string; name: string }>;
  clauses?: Array<{ articleNumber: number; title: string; legalBasis?: string }>;
  warnings?: string[];
}

function parseContractOutput(output: Record<string, unknown>): ContractOutput {
  return {
    contractTitle: typeof output.contractTitle === 'string' ? output.contractTitle : undefined,
    parties: Array.isArray(output.parties) ? output.parties as ContractOutput['parties'] : [],
    clauses: Array.isArray(output.clauses) ? output.clauses as ContractOutput['clauses'] : [],
    warnings: Array.isArray(output.warnings) ? output.warnings as string[] : [],
  };
}

function ContractSection({ output }: { output: Record<string, unknown> }) {
  const { contractTitle, parties, clauses, warnings } = parseContractOutput(output);
  warnings?: string[];
}

function parseContractOutput(output: Record<string, unknown>): ContractOutput {
  return {
    contractTitle: typeof output.contractTitle === 'string' ? output.contractTitle : undefined,
    parties: Array.isArray(output.parties) ? output.parties as ContractOutput['parties'] : [],
    clauses: Array.isArray(output.clauses) ? output.clauses as ContractOutput['clauses'] : [],
    warnings: Array.isArray(output.warnings) ? output.warnings as string[] : [],
  };
}

function ContractSection({ output }: { output: Record<string, unknown> }) {
  const { contractTitle, parties, clauses, warnings } = parseContractOutput(output);
}) {
  if (items.length === 0) return null;
  const displayed = maxItems ? items.slice(0, maxItems) : items;
  const countSuffix = maxItems && items.length > maxItems
    ? ` (${maxItems}/${items.length})`
    : ` (${items.length})`;

  return (
    <div>
      <p className="ai-sub-title">{title}{countSuffix}:</p>
      {displayed.map((item, i) => (
        <React.Fragment key={i}>{children(item, i)}</React.Fragment>
      ))}
    </div>
  );
}

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
type SkillCategory = 'contract' | 'review' | 'compliance' | 'general' | 'unknown';

const SKILL_CATEGORY_MAP: Record<string, SkillCategory> = {
  'commercial-contract-drafter': 'contract',
  'commercial-contract-reviewer': 'review',
  'nda-reviewer': 'review',
  'vendor-contract-reviewer': 'review',
  'corporate-doc-generator': 'contract',
  'corporate-compliance-checker': 'compliance',
  'board-resolution-drafter': 'contract',
  'entity-compliance-checker': 'compliance',
  'employment-contract-reviewer': 'review',
  'employment-policy-checker': 'compliance',
  'labor-discipline-checker': 'compliance',
  'internal-regulation-drafter': 'contract',
  'privacy-compliance-checker': 'compliance',
  'privacy-dpia-generator': 'compliance',
  'dsar-response-drafter': 'contract',
  'ip-trademark-search': 'general',
  'ip-patent-analyzer': 'general',
  'trademark-clearance': 'general',
  'cease-desist-drafter': 'contract',
  'litigation-risk-scorer': 'review',
  'demand-letter-drafter': 'contract',
  'litigation-strategist': 'review',
  'tos-generator': 'contract',
  'regulatory-gap-analyzer': 'compliance',
  'compliance-gap-analyzer': 'compliance',
  'ai-governance-assessor': 'compliance',
  'ai-impact-assessment': 'compliance',
  'client-letter-drafter': 'contract',
  'legal-memo-drafter': 'contract',
  'general-legal-researcher': 'general',
  'document-issue-analyzer': 'general',
};

function getSkillCategory(skill: AgentSkill): SkillCategory {
  return SKILL_CATEGORY_MAP[skill] ?? 'unknown';
}
  'commercial-contract-reviewer': 'review',
  'nda-reviewer': 'review',
  'vendor-contract-reviewer': 'review',
  'corporate-doc-generator': 'contract',
  'corporate-compliance-checker': 'compliance',
  'board-resolution-drafter': 'contract',
  'entity-compliance-checker': 'compliance',
  'employment-contract-reviewer': 'review',
  'employment-policy-checker': 'compliance',
  'labor-discipline-checker': 'compliance',
  'internal-regulation-drafter': 'contract',
  'privacy-compliance-checker': 'compliance',
  'privacy-dpia-generator': 'compliance',
  'dsar-response-drafter': 'contract',
  'ip-trademark-search': 'general',
  'ip-patent-analyzer': 'general',
  'trademark-clearance': 'general',
  'cease-desist-drafter': 'contract',
  'litigation-risk-scorer': 'review',
  'demand-letter-drafter': 'contract',
  'litigation-strategist': 'review',
  'tos-generator': 'contract',
  'regulatory-gap-analyzer': 'compliance',
  'compliance-gap-analyzer': 'compliance',
  'ai-governance-assessor': 'compliance',
  'ai-impact-assessment': 'compliance',
  'client-letter-drafter': 'contract',
  'legal-memo-drafter': 'contract',
  'general-legal-researcher': 'general',
  'document-issue-analyzer': 'general',
};

function getSkillCategory(skill: AgentSkill): SkillCategory {
  return SKILL_CATEGORY_MAP[skill] ?? 'unknown';
}
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

          {/* Skill-specific output — only one category renders */}
          {skillCategory === 'contract' && <ContractSection output={output} />}
          {skillCategory === 'review' && <ReviewSection output={output} />}
          {skillCategory === 'compliance' && <ComplianceSection output={output} />}
          {skillCategory === 'general' && <GeneralSection output={output} />}

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
