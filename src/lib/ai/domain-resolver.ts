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
  mnd: 'commercial-legal',

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

/** Suggest up to 3 most relevant skills for a matter type */
export function suggestSkills(matterTypeKey: string | null | undefined): AgentSkill[] {
  if (!matterTypeKey) return ['general-legal-researcher'];

  const domain = MATTER_DOMAIN_MAP[matterTypeKey] ?? 'commercial-legal';
  const domainSkills = DOMAIN_SKILL_MAP[domain] ?? ['general-legal-researcher'];

  // Return up to 3 skills — new Phase skills first (they're domain-specific)
  return domainSkills.slice(0, 3);
}

/** Map a matterTypeKey to its legal domain */
export function matterTypeToDomain(matterTypeKey: string | null | undefined): LegalDomain {
  if (!matterTypeKey) return 'commercial-legal';
  return MATTER_DOMAIN_MAP[matterTypeKey] ?? 'commercial-legal';
}

/** Get the primary suggested skill for a matter type (used as default) */
export function getPrimarySkill(matterTypeKey: string | null | undefined): AgentSkill {
  if (!matterTypeKey) return 'document-issue-analyzer';

  const domain = matterTypeToDomain(matterTypeKey);
  const skills = DOMAIN_SKILL_MAP[domain];
  if (!skills || skills.length === 0) return 'document-issue-analyzer';

  // For document review, prefer skill names that suggest review/analysis
  const reviewSkills = skills.filter((s) =>
    s.includes('review') || s.includes('analyzer') || s.includes('check'),
  );
  return reviewSkills[0] ?? skills[0] ?? 'document-issue-analyzer';
}
