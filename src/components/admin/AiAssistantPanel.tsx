'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Loader2, Bot } from 'lucide-react';
import type { AgentSkill, LegalDomain, SkillResult } from '@/lib/ai/types';
import { AiSkillSelector } from './AiSkillSelector';
import { AiResultCard } from './AiResultCard';

export interface AiAssistantPanelProps {
  /** Request ID để gửi lên API */
  requestId: string;
  /** Request title để đưa vào context */
  requestTitle: string;
  /** Matter type để chọn domain mặc định */
  matterTypeKey?: string | null;
  /** Callback khi AI có kết quả đã được user apply */
  onApplyResult?: (result: SkillResult) => void;
  /** CSS class */
  className?: string;
}

export function AiAssistantPanel({
  requestId,
  requestTitle,
  matterTypeKey,
  onApplyResult,
  className = '',
}: AiAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [executing, setExecuting] = useState<AgentSkill | null>(null);
  const [results, setResults] = useState<Array<{ skill: AgentSkill; result: SkillResult }>>([]);
  const [error, setError] = useState<string | null>(null);

  const defaultDomain = mapMatterTypeToDomain(matterTypeKey);

  const handleSelectSkill = useCallback(async (skill: AgentSkill, domain: LegalDomain) => {
    setExecuting(skill);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, skill }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'UNKNOWN' }));
        throw new Error(err.error === 'AI_NOT_CONFIGURED'
          ? 'AI chưa được cấu hình. Cần API key LLM.'
          : err.detail ?? `Lỗi ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.detail ?? 'AI thực thi thất bại');

      setResults((prev) => [...prev, { skill, result: data.data as SkillResult }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setExecuting(null);
    }
  }, [requestId]);

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 ${className}`} data-testid="ai-assistant-panel">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium
          text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
        data-testid="ai-assistant-toggle"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          AI Assistant
          {executing && <Loader2 size={14} className="animate-spin text-purple-500" />}
        </span>
        {isOpen ? <X size={16} /> : <Bot size={16} className="text-purple-400" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3" data-testid="ai-assistant-body">
          {/* Error */}
          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
              text-sm text-red-700 dark:text-red-400 flex items-center gap-2" data-testid="ai-assistant-error">
              <X size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Skill Selector */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Chọn kỹ năng AI:</p>
            <AiSkillSelector
              defaultDomain={defaultDomain}
              onSelect={handleSelectSkill}
              disabled={executing !== null}
              executingSkill={executing}
            />
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Kết quả ({results.length}):
              </p>
              {results.map(({ skill, result }, idx) => (
                <AiResultCard
                  key={`${skill}-${idx}`}
                  result={result}
                  skill={skill}
                  onApply={() => onApplyResult?.(result)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {results.length === 0 && !executing && !error && (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500" data-testid="ai-assistant-empty">
              <Bot size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chọn một kỹ năng AI để bắt đầu phân tích</p>
              <p className="text-xs mt-1">AI sẽ tra cứu luật và đưa ra đề xuất</p>
            </div>
          )}

          {/* Executing indicator */}
          {executing && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-purple-600 dark:text-purple-400" data-testid="ai-assistant-executing">
              <Loader2 size={16} className="animate-spin" />
              <span>Đang phân tích...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function mapMatterTypeToDomain(matterTypeKey?: string | null): LegalDomain | undefined {
  if (!matterTypeKey) return undefined;

  const mapping: Record<string, LegalDomain> = {
    // Commercial
    commercial_review: 'commercial-legal',
    distribution_contract: 'commercial-legal',
    agency_contract: 'commercial-legal',
    nda: 'commercial-legal',
    template_engine: 'commercial-legal',
    // Corporate
    incorporation: 'corporate-legal',
    shareholder_agreement: 'corporate-legal',
    m_and_a: 'corporate-legal',
    business_license: 'corporate-legal',
    compliance_report: 'corporate-legal',
    // Employment
    labor_contract: 'employment-legal',
    labor_dispute: 'employment-legal',
    internal_regulations: 'employment-legal',
    // IP
    trademark_registration: 'ip-legal',
    copyright: 'ip-legal',
    patent: 'ip-legal',
    // Privacy
    privacy_policy: 'privacy-legal',
    dpia: 'privacy-legal',
    data_processing_agreement: 'privacy-legal',
    // Product
    terms_of_service: 'product-legal',
    return_policy: 'product-legal',
    product_liability: 'product-legal',
    // AI
    ai_policy: 'ai-governance-legal',
    algorithm_audit: 'ai-governance-legal',
    // Litigation
    lawsuit_filing: 'litigation-legal',
    settlement_agreement: 'litigation-legal',
    litigation_consultation: 'litigation-legal',
    // Legal builder
    legal_research: 'legal-builder-hub',
    workflow_builder: 'legal-builder-hub',
    cocounsel: 'legal-builder-hub',
    legal_research_tools: 'legal-builder-hub',
    // Other → legal-clinic
    internal_consultation: 'legal-clinic',
    legal_training: 'legal-clinic',
    case_study: 'legal-clinic',
    unsupported: 'legal-clinic',
  };

  return mapping[matterTypeKey];
}
