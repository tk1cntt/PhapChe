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

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical':
    case 'high':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'medium':
    case 'moderate':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'low':
    case 'minor':
      return 'text-green-700 bg-green-50 border-green-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.8) return { label: 'Cao', color: 'text-green-600' };
  if (confidence >= 0.5) return { label: 'Trung bình', color: 'text-orange-600' };
  return { label: 'Thấp', color: 'text-red-600' };
}

// ── Sub-components ───────────────────────────────────────────

function ContractSection({ output }: { output: Record<string, unknown> }) {
  const clauses = Array.isArray(output.clauses) ? output.clauses : [];
  const parties = Array.isArray(output.parties) ? output.parties : [];
  const warnings = Array.isArray(output.warnings) ? output.warnings : [];

  return (
    <div className="space-y-3 text-sm">
      {output.contractTitle && (
        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base">
          {output.contractTitle as string}
        </h4>
      )}

      {parties.length > 0 && (
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Các bên:</p>
          {parties.map((p: Record<string, unknown>, i: number) => (
            <div key={i} className="text-gray-700 dark:text-gray-300 ml-2">
              <span className="font-medium">{p.role as string}:</span> {p.name as string}
            </div>
          ))}
        </div>
      )}

      {clauses.length > 0 && (
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">
            Điều khoản ({clauses.length}):
          </p>
          {clauses.slice(0, 5).map((c: Record<string, unknown>, i: number) => (
            <div key={i} className="ml-2 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <p className="font-medium text-gray-800 dark:text-gray-200">
                Điều {c.articleNumber as number}: {c.title as string}
              </p>
              {c.legalBasis && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  📜 {c.legalBasis as string}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-2 rounded border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <p className="font-medium text-orange-700 dark:text-orange-400 text-xs mb-1">⚠ Cảnh báo:</p>
          {warnings.map((w: string, i: number) => (
            <p key={i} className="text-xs text-orange-600 dark:text-orange-400">• {w}</p>
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
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(risk)}`}>
          Rủi ro: {risk}
        </span>
        {score !== null && (
          <span className={`font-bold ${getScoreColor(score)}`}>
            Tuân thủ: {score}/100
          </span>
        )}
      </div>

      {findings.length > 0 && (
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">
            Phát hiện ({findings.length}):
          </p>
          {findings.map((f: Record<string, unknown>, i: number) => (
            <div key={i} className="ml-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getRiskColor(f.severity as string)}`}>
                  {f.severity as string}
                </span>
                <span className="text-gray-800 dark:text-gray-200">{f.issue as string}</span>
              </div>
              {f.recommendation && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  → {f.recommendation as string}
                </p>
              )}
              {f.legalBasis && (
                <p className="text-xs text-blue-500 mt-0.5">📜 {f.legalBasis as string}</p>
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
    <div className="space-y-3 text-sm">
      {score !== null && (
        <p className={`font-bold text-lg ${getScoreColor(score)}`}>
          Điểm tuân thủ: {score}/100
        </p>
      )}

      {items.length > 0 && (
        <div>
          {items.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                  {item.category as string ?? item.area as string}
                </span>
                {item.status && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    item.status === 'compliant' ? 'bg-green-100 text-green-700' :
                    item.status === 'non_compliant' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status as string}
                  </span>
                )}
                {item.severity && (
                  <span className={`px-1.5 py-0.5 rounded text-xs border ${getRiskColor(item.severity as string)}`}>
                    {item.severity as string}
                  </span>
                )}
              </div>
              {item.action && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.action as string}</p>
              )}
              {item.legalBasis && (
                <p className="text-xs text-blue-500 mt-0.5">📜 {item.legalBasis as string}</p>
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
    <div className="space-y-3 text-sm">
      {answer && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{answer}</p>
        </div>
      )}

      {legalBasis.length > 0 && (
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Căn cứ pháp lý:</p>
          {legalBasis.map((lb: Record<string, unknown>, i: number) => (
            <div key={i} className="ml-2 text-xs text-blue-600 dark:text-blue-400 py-0.5">
              📜 {lb.law as string}{lb.article ? ` — ${lb.article as string}` : ''}
              {lb.content && <p className="text-gray-500 dark:text-gray-400 ml-4 mt-0.5">{lb.content as string}</p>}
            </div>
          ))}
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-700 dark:text-blue-400 text-xs mb-1">Các bước tiếp theo:</p>
          {nextSteps.map((s: string, i: number) => (
            <p key={i} className="text-xs text-blue-600 dark:text-blue-400">• {s}</p>
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
      <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 p-4" data-testid="ai-result-loading">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full bg-purple-200 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4" data-testid="ai-result-error">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle size={16} />
          <span className="font-medium text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const output = result.output ?? {};
  const confidenceInfo = getConfidenceLabel(result.confidence);

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 overflow-hidden" data-testid="ai-result-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
        <button
          type="button"
          onClick={() => setExpandedResult(!expandedResult)}
          className="flex items-center gap-2 text-sm font-medium text-purple-800 dark:text-purple-300"
          data-testid="ai-result-toggle"
        >
          {expandedResult ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Sparkles size={14} />
          <span>{skillLabel ?? skill}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${confidenceInfo.color}`} data-testid="ai-result-confidence">
            Độ tin cậy: {confidenceInfo.label} ({(result.confidence * 100).toFixed(0)}%)
          </span>
          {result.citations.length > 0 && (
            <span className="text-xs text-gray-400" title={`${result.citations.length} trích dẫn`}>
              📜{result.citations.length}
            </span>
          )}
        </div>
      </div>

      {expandedResult && (
        <div className="p-4 space-y-3" data-testid="ai-result-body">
          {/* Summary */}
          {result.summary && (
            <div className="flex gap-2">
              <Info size={14} className="text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Skill-specific output */}
          {isContractSkill && <ContractSection output={output} />}
          {isReviewSkill && <ReviewSection output={output} />}
          {isComplianceSkill && <ComplianceSection output={output} />}
          {isGeneralSkill && <GeneralSection output={output} />}

          {/* Citations */}
          {result.citations.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tài liệu tham khảo ({result.citations.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {result.citations.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    📜 {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {onApply && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => onApply(result)}
                className="w-full px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
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
