'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import type { AgentSkill, LegalDomain } from '@/lib/ai/types';

// ── Types ────────────────────────────────────────────────────

export interface AiSkillSelectorProps {
  /** Pre-selected domain based on matter type */
  defaultDomain?: LegalDomain;
  /** Callback when skill is selected */
  onSelect: (skill: AgentSkill, domain: LegalDomain) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Currently executing skill */
  executingSkill?: AgentSkill | null;
}

interface SkillGroup {
  domain: LegalDomain;
  label: string;
  skills: Array<{ skill: AgentSkill; label: string; description: string }>;
}

const DOMAIN_LABELS: Record<LegalDomain, string> = {
  'commercial-legal': 'Thương mại',
  'corporate-legal': 'Doanh nghiệp',
  'employment-legal': 'Lao động',
  'privacy-legal': 'Quyền riêng tư',
  'product-legal': 'Sản phẩm',
  'regulatory-legal': 'Quy định',
  'ai-governance-legal': 'Quản trị AI',
  'ip-legal': 'Sở hữu trí tuệ',
  'litigation-legal': 'Tranh tụng',
  'legal-clinic': 'Phòng khám PL',
  'law-student': 'Sinh viên Luật',
  'legal-builder-hub': 'Xây dựng PL',
  'external-plugins': 'Plugin ngoài',
};

const SKILL_LABELS: Record<AgentSkill, { label: string; desc: string; domain: LegalDomain }> = {
  'commercial-contract-drafter': {
    label: 'Soạn hợp đồng thương mại',
    desc: 'Tạo hợp đồng thương mại từ yêu cầu',
    domain: 'commercial-legal',
  },
  'commercial-contract-reviewer': {
    label: 'Rà soát hợp đồng',
    desc: 'Phát hiện rủi ro trong hợp đồng',
    domain: 'commercial-legal',
  },
  'employment-contract-reviewer': {
    label: 'Rà soát HĐ lao động',
    desc: 'Kiểm tra tuân thủ BLLĐ 2019',
    domain: 'employment-legal',
  },
  'employment-policy-checker': {
    label: 'Kiểm tra chính sách LĐ',
    desc: 'Đối chiếu nội quy với luật lao động',
    domain: 'employment-legal',
  },
  'corporate-doc-generator': {
    label: 'Tạo hồ sơ doanh nghiệp',
    desc: 'Hồ sơ thành lập, thay đổi, giải thể',
    domain: 'corporate-legal',
  },
  'corporate-compliance-checker': {
    label: 'Kiểm tra tuân thủ DN',
    desc: 'Báo cáo, công bố thông tin, thuế',
    domain: 'corporate-legal',
  },
  'ip-trademark-search': {
    label: 'Tra cứu nhãn hiệu',
    desc: 'Đánh giá khả năng đăng ký',
    domain: 'ip-legal',
  },
  'ip-patent-analyzer': {
    label: 'Phân tích sáng chế',
    desc: 'Đánh giá khả năng bảo hộ',
    domain: 'ip-legal',
  },
  'privacy-compliance-checker': {
    label: 'Tuân thủ bảo mật',
    desc: 'Kiểm tra NĐ 13/2023/NĐ-CP',
    domain: 'privacy-legal',
  },
  'privacy-dpia-generator': {
    label: 'Tạo DPIA',
    desc: 'Đánh giá tác động bảo vệ dữ liệu',
    domain: 'privacy-legal',
  },
  'regulatory-gap-analyzer': {
    label: 'Phân tích khoảng trống',
    desc: 'Khoảng cách tuân thủ quy định',
    domain: 'regulatory-legal',
  },
  'ai-governance-assessor': {
    label: 'Quản trị AI',
    desc: 'Đánh giá AI có trách nhiệm',
    domain: 'ai-governance-legal',
  },
  'litigation-risk-scorer': {
    label: 'Đánh giá rủi ro',
    desc: 'Phân tích rủi ro tranh chấp',
    domain: 'litigation-legal',
  },
  'general-legal-researcher': {
    label: 'Nghiên cứu pháp lý',
    desc: 'Tìm quy định, án lệ, phân tích',
    domain: 'legal-clinic',
  },
};

// ── Component ────────────────────────────────────────────────

export function AiSkillSelector({
  defaultDomain,
  onSelect,
  disabled = false,
  executingSkill,
}: AiSkillSelectorProps) {
  const [expandedDomain, setExpandedDomain] = useState<LegalDomain | null>(defaultDomain ?? null);

  // Group skills by domain
  const grouped = buildSkillGroups(defaultDomain);

  const handleToggle = useCallback((domain: LegalDomain) => {
    setExpandedDomain((prev) => (prev === domain ? null : domain));
  }, []);

  return (
    <div className="ai-skill-selector" data-testid="ai-skill-selector">
      {grouped.map((group) => (
        <div key={group.domain} className="ai-skill-group">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(group.domain)}
            className="ai-skill-domain-btn"
            data-testid={`skill-domain-${group.domain}`}
          >
            <span>{group.label}</span>
            {expandedDomain === group.domain ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          {expandedDomain === group.domain && (
            <div className="ai-skill-list" data-testid={`skill-list-${group.domain}`}>
              {group.skills.map(({ skill, label, description }) => (
                <button
                  key={skill}
                  type="button"
                  disabled={disabled || executingSkill === skill}
                  onClick={() => onSelect(skill, group.domain)}
                  className={`ai-skill-item${executingSkill === skill ? ' executing' : ''}`}
                  data-testid={`skill-item-${skill}`}
                >
                  <div className="ai-skill-item-header">
                    {executingSkill === skill ? (
                      <Loader2 size={14} className="skill-spinner" />
                    ) : (
                      <Sparkles size={14} className="skill-icon" />
                    )}
                    <span className="ai-skill-item-label">
                      {label}
                    </span>
                  </div>
                  <p className="ai-skill-item-desc">
                    {description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function buildSkillGroups(defaultDomain?: LegalDomain): SkillGroup[] {
  const domainMap = new Map<LegalDomain, SkillGroup>();
  const entries = Object.entries(SKILL_LABELS) as [AgentSkill, { label: string; desc: string; domain: LegalDomain }][];

  for (const [skill, info] of entries) {
    const existing = domainMap.get(info.domain);
    if (existing) {
      existing.skills.push({ skill, label: info.label, description: info.desc });
    } else {
      domainMap.set(info.domain, {
        domain: info.domain,
        label: DOMAIN_LABELS[info.domain] ?? info.domain,
        skills: [{ skill, label: info.label, description: info.desc }],
      });
    }
  }

  // Sort: put defaultDomain first if provided
  const groups = Array.from(domainMap.values());
  if (defaultDomain) {
    groups.sort((a, b) => {
      if (a.domain === defaultDomain) return -1;
      if (b.domain === defaultDomain) return 1;
      return 0;
    });
  }
  return groups;
}
