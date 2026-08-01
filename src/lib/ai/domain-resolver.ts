/**
 * Domain Resolver — Auto-map matterTypeKey → LegalDomain → suggested skills
 *
 * Used by UI components to suggest relevant skills based on the request's
 * legal domain, and by API endpoints to auto-select the right skill.
 */

import type { AgentSkill, LegalDomain } from './types';
import { DOMAIN_SKILL_MAP } from './types';

// ── MatterType → Domain mapping ─────────────────────────────

const MATTER_DOMAIN_MAP: Record<string, LegalDomain> = {
  // Commercial
  contract_review: 'commercial-legal',
  contract_drafting: 'commercial-legal',
  nda: 'commercial-legal',
  distribution_contract: 'commercial-legal',
  agency_contract: 'commercial-legal',
  service_agreement: 'commercial-legal',
  mnd: 'commercial-legal', // intended: Mutual Non-Disclosure (mnd); not 'mou'

  // Corporate
  incorporation: 'corporate-legal',
  business_registration: 'corporate-legal',
  corporate_governance: 'corporate-legal',
  board_resolution: 'corporate-legal',
  shareholder_agreement: 'corporate-legal',
  mna: 'corporate-legal',
  entity_compliance: 'corporate-legal',

  // Employment
  labor_contract: 'employment-legal',
  labor_discipline: 'employment-legal',
  termination: 'employment-legal',
  internal_regulation: 'employment-legal',
  employment_policy: 'employment-legal',
  workplace_harassment: 'employment-legal',

  // Privacy
  privacy_compliance: 'privacy-legal',
  data_protection: 'privacy-legal',
  dsar: 'privacy-legal',
  dpia: 'privacy-legal',
  personal_data: 'privacy-legal',

  // IP
  trademark: 'ip-legal',
  copyright: 'ip-legal',
  patent: 'ip-legal',
  ip_enforcement: 'ip-legal',
  trademark_clearance: 'ip-legal',
  cease_desist: 'ip-legal',

  // Litigation
  litigation: 'litigation-legal',
  dispute: 'litigation-legal',
  demand_letter: 'litigation-legal',
  debt_collection: 'litigation-legal',
  court: 'litigation-legal',
  mediation: 'litigation-legal',

  // Product
  tos: 'product-legal',
  eula: 'product-legal',
  saas: 'product-legal',
  app_terms: 'product-legal',

  // Regulatory
  regulatory: 'regulatory-legal',
  compliance_gap: 'regulatory-legal',
  industry_compliance: 'regulatory-legal',
  fintech: 'regulatory-legal',

  // AI Governance
  ai_governance: 'ai-governance-legal',
  ai_impact: 'ai-governance-legal',
  ai_ethics: 'ai-governance-legal',

  // Legal Clinic
  legal_advice: 'legal-clinic',
  legal_memo: 'legal-clinic',
  client_letter: 'legal-clinic',
  general_research: 'legal-clinic',
};

// ── Fallback chain ──────────────────────────────────────────

const DEFAULT_DOMAIN: LegalDomain = 'commercial-legal';
const DEFAULT_SKILLS: AgentSkill[] = ['general-legal-researcher'];
const DEFAULT_PRIMARY_SKILL: AgentSkill = 'document-issue-analyzer';

/**
 * Skills suitable for document review — these return structured output arrays
 * (findings[], checks[], risks[], gaps[], gapAnalysis[], keyLegalIssues[]) with
 * severity + issue/requirement/gap/risk + recommendation/action/mitigation +
 * legalBasis that map to document annotations.
 *
 * Draft/generate/research skills are excluded — they produce free-form content,
 * not structured review findings.
 *
 * ⚠️ MUST stay in sync with system prompt output schemas.
 *
 * Category A — findings[] (inline annotation capable):
 *   document-issue-analyzer, nda-reviewer, vendor-contract-reviewer,
 *   commercial-contract-reviewer, employment-contract-reviewer
 *
 * Category B — checks[]/risks[]/gaps[]/gapAnalysis[] (non-inline but structured):
 *   entity-compliance-checker, corporate-compliance-checker, privacy-compliance-checker,
 *   labor-discipline-checker, employment-policy-checker, regulatory-gap-analyzer,
 *   compliance-gap-analyzer, ai-impact-assessment, litigation-strategist
 */
export const REVIEW_SKILLS: AgentSkill[] = [
  // Category A — findings[] (inline)
  'document-issue-analyzer',
  'nda-reviewer',
  'vendor-contract-reviewer',
  'commercial-contract-reviewer',
  'employment-contract-reviewer',
  // Category B — checks[]/risks[]/gaps[]/gapAnalysis[] (non-inline structured)
  'entity-compliance-checker',
  'corporate-compliance-checker',
  'privacy-compliance-checker',
  'labor-discipline-checker',
  'employment-policy-checker',
  'regulatory-gap-analyzer',
  'compliance-gap-analyzer',
  'ai-impact-assessment',
  'litigation-strategist',
];

/**
 * Domain → review-skill mapping.
 *
 * Mỗi domain có ít nhất 1 review skill chuyên dụng, lý tưởng 2-4 để phủ nhiều
 * góc nhìn review khác nhau. Skill đầu tiên trong mỗi array là primary/default.
 *
 * Design rationale:
 * - commercial-legal (4): hợp đồng, NDA, vendor, general issues
 * - corporate-legal (4): entity compliance, corporate checks, contracts, general
 * - employment-legal (4): contracts, discipline, policy gaps, general
 * - privacy-legal (2): privacy compliance, general
 * - product-legal (3): contracts, regulatory gaps, general
 * - regulatory-legal (3): compliance gaps, regulatory gaps, general
 * - ai-governance-legal (2): AI impact, general
 * - ip-legal (2): entity compliance (IP rights), general
 * - litigation-legal (3): strategy, entity compliance, general
 * - legal-clinic (1): general only
 * - law-student (1): general only
 * - legal-builder-hub (2): contracts, general
 * - external-plugins (1): general only
 */
export const DOMAIN_REVIEW_SKILL_MAP: Partial<Record<LegalDomain, AgentSkill[]>> = {
  'commercial-legal': [
    'document-issue-analyzer',
    'nda-reviewer',
    'vendor-contract-reviewer',
    'commercial-contract-reviewer',
  ],
  'corporate-legal': [
    'document-issue-analyzer',
    'entity-compliance-checker',
    'corporate-compliance-checker',
    'commercial-contract-reviewer',
  ],
  'employment-legal': [
    'document-issue-analyzer',
    'employment-contract-reviewer',
    'labor-discipline-checker',
    'employment-policy-checker',
  ],
  'privacy-legal': [
    'document-issue-analyzer',
    'privacy-compliance-checker',
  ],
  'product-legal': [
    'document-issue-analyzer',
    'commercial-contract-reviewer',
    'regulatory-gap-analyzer',
  ],
  'regulatory-legal': [
    'document-issue-analyzer',
    'compliance-gap-analyzer',
    'regulatory-gap-analyzer',
  ],
  'ai-governance-legal': [
    'document-issue-analyzer',
    'ai-impact-assessment',
  ],
  'ip-legal': [
    'document-issue-analyzer',
    'entity-compliance-checker',
  ],
  'litigation-legal': [
    'document-issue-analyzer',
    'litigation-strategist',
    'entity-compliance-checker',
  ],
  'legal-clinic': [
    'document-issue-analyzer',
  ],
  'law-student': [
    'document-issue-analyzer',
  ],
  'legal-builder-hub': [
    'document-issue-analyzer',
    'commercial-contract-reviewer',
  ],
  'external-plugins': [
    'document-issue-analyzer',
  ],
};

/** Suggest up to 3 most relevant skills for a matter type */
export function suggestSkills(matterTypeKey: string | null | undefined): AgentSkill[] {
  if (!matterTypeKey) return DEFAULT_SKILLS;

  const domain = MATTER_DOMAIN_MAP[matterTypeKey] ?? DEFAULT_DOMAIN;
  const domainSkills = DOMAIN_SKILL_MAP[domain] ?? DEFAULT_SKILLS;

  // Return up to 3 skills — new Phase skills first (they're domain-specific)
  return domainSkills.slice(0, 3);
}

/** Suggest review-type skills for document review — up to 3 matching the domain */
export function suggestReviewSkills(matterTypeKey: string | null | undefined): AgentSkill[] {
  // When no matterTypeKey, fall back to DEFAULT_DOMAIN (commercial-legal) so users
  // still get a meaningful choice of review skills instead of just one.
  if (!matterTypeKey) {
    return (DOMAIN_REVIEW_SKILL_MAP[DEFAULT_DOMAIN] ?? ['document-issue-analyzer']).slice(0, 3);
  }

  const domain = MATTER_DOMAIN_MAP[matterTypeKey] ?? DEFAULT_DOMAIN;
  const domainReviewSkills = DOMAIN_REVIEW_SKILL_MAP[domain] ?? ['document-issue-analyzer'];

  return domainReviewSkills.slice(0, 3);
}

/** Map a matterTypeKey to its legal domain */
export function matterTypeToDomain(matterTypeKey: string | null | undefined): LegalDomain {
  if (!matterTypeKey) return DEFAULT_DOMAIN;
  return MATTER_DOMAIN_MAP[matterTypeKey] ?? DEFAULT_DOMAIN;
}

/** Get the primary suggested skill for a matter type (used as default) */
export function getPrimarySkill(matterTypeKey: string | null | undefined): AgentSkill {
  if (!matterTypeKey) return DEFAULT_PRIMARY_SKILL;

  const domain = matterTypeToDomain(matterTypeKey);
  const skills = DOMAIN_SKILL_MAP[domain];
  if (!skills || skills.length === 0) return DEFAULT_PRIMARY_SKILL;

  // Prefer the first skill in the domain's skill list (ordered by relevance)
  return skills[0] ?? DEFAULT_PRIMARY_SKILL;
}

/** Get the primary review skill for a matter type (used as default in review dropdown) */
export function getPrimaryReviewSkill(matterTypeKey: string | null | undefined): AgentSkill {
  if (!matterTypeKey) {
    return (DOMAIN_REVIEW_SKILL_MAP[DEFAULT_DOMAIN] ?? [DEFAULT_PRIMARY_SKILL])[0];
  }

  const domain = MATTER_DOMAIN_MAP[matterTypeKey] ?? DEFAULT_DOMAIN;
  const reviewSkills = DOMAIN_REVIEW_SKILL_MAP[domain];
  if (!reviewSkills || reviewSkills.length === 0) return DEFAULT_PRIMARY_SKILL;

  return reviewSkills[0];
}
