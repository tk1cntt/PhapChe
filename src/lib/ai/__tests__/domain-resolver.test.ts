/**
 * Tests for Domain Resolver — matterTypeKey → domain → skills mapping
 *
 * Kiểm thử 4 nhóm: Whitebox, Blackbox, Abnormal, Error
 *
 * Covers: suggestSkills, suggestReviewSkills, matterTypeToDomain, getPrimarySkill
 */

import { describe, it, expect } from 'vitest';
import {
  suggestSkills,
  suggestReviewSkills,
  REVIEW_SKILLS,
  DOMAIN_REVIEW_SKILL_MAP,
  matterTypeToDomain,
  getPrimarySkill,
} from '../domain-resolver';

describe('matterTypeToDomain', () => {
  describe('whitebox', () => {
    it('maps contract_review to commercial-legal', () => {
      expect(matterTypeToDomain('contract_review')).toBe('commercial-legal');
    });
    it('maps incorporation to corporate-legal', () => {
      expect(matterTypeToDomain('incorporation')).toBe('corporate-legal');
    });
    it('maps labor_contract to employment-legal', () => {
      expect(matterTypeToDomain('labor_contract')).toBe('employment-legal');
    });
    it('maps dsar to privacy-legal', () => {
      expect(matterTypeToDomain('dsar')).toBe('privacy-legal');
    });
    it('maps trademark to ip-legal', () => {
      expect(matterTypeToDomain('trademark')).toBe('ip-legal');
    });
    it('maps litigation to litigation-legal', () => {
      expect(matterTypeToDomain('litigation')).toBe('litigation-legal');
    });
    it('maps tos to product-legal', () => {
      expect(matterTypeToDomain('tos')).toBe('product-legal');
    });
    it('maps ai_governance to ai-governance-legal', () => {
      expect(matterTypeToDomain('ai_governance')).toBe('ai-governance-legal');
    });
    it('maps legal_memo to legal-clinic', () => {
      expect(matterTypeToDomain('legal_memo')).toBe('legal-clinic');
    });
  });

  describe('blackbox', () => {
    it('returns commercial-legal for unknown matter types', () => {
      expect(matterTypeToDomain('nonexistent_type')).toBe('commercial-legal');
    });
    it('returns commercial-legal for null', () => {
      expect(matterTypeToDomain(null)).toBe('commercial-legal');
    });
    it('returns commercial-legal for undefined', () => {
      expect(matterTypeToDomain(undefined)).toBe('commercial-legal');
    });
  });

  describe('abnormal', () => {
    it('handles empty string', () => {
      expect(matterTypeToDomain('')).toBe('commercial-legal');
    });
  });
});

describe('suggestSkills', () => {
  describe('whitebox', () => {
    it('returns up to 3 skills for nda matter type', () => {
      const skills = suggestSkills('nda');
      expect(skills.length).toBeLessThanOrEqual(3);
      expect(skills.length).toBeGreaterThan(0);
      // First skill should be the new Phase skill (nda-reviewer)
      expect(skills[0]).toBe('nda-reviewer');
    });

    it('returns skills for incorporation', () => {
      const skills = suggestSkills('incorporation');
      expect(skills).toContain('board-resolution-drafter');
    });

    it('returns skills for labor_discipline', () => {
      const skills = suggestSkills('labor_discipline');
      expect(skills).toContain('labor-discipline-checker');
    });

    it('returns skills for dsar', () => {
      const skills = suggestSkills('dsar');
      expect(skills[0]).toBe('dsar-response-drafter');
    });

    it('returns skills for trademark', () => {
      const skills = suggestSkills('trademark');
      expect(skills[0]).toBe('trademark-clearance');
    });
  });

  describe('blackbox', () => {
    it('returns general-legal-researcher for null matterType', () => {
      const skills = suggestSkills(null);
      expect(skills).toEqual(['general-legal-researcher']);
    });

    it('returns general-legal-researcher for undefined matterType', () => {
      const skills = suggestSkills(undefined);
      expect(skills).toEqual(['general-legal-researcher']);
    });
  });

  describe('abnormal', () => {
    it('handles empty string gracefully', () => {
      const skills = suggestSkills('');
      expect(skills).toEqual(['general-legal-researcher']);
    });

    it('all returned skills are valid strings', () => {
      const skills = suggestSkills('contract_review');
      for (const s of skills) {
        expect(typeof s).toBe('string');
        expect(s.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('suggestReviewSkills', () => {
  describe('whitebox', () => {
    it('returns review skills for commercial-legal (contract_review)', () => {
      const skills = suggestReviewSkills('contract_review');
      expect(skills.length).toBeLessThanOrEqual(3);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills).toContain('document-issue-analyzer');
      expect(skills).toContain('nda-reviewer');
    });

    it('returns review skills for corporate-legal (incorporation)', () => {
      const skills = suggestReviewSkills('incorporation');
      expect(skills).toContain('entity-compliance-checker');
      expect(skills).toContain('corporate-compliance-checker');
    });

    it('returns review skills for employment-legal (labor_discipline)', () => {
      const skills = suggestReviewSkills('labor_discipline');
      expect(skills).toContain('labor-discipline-checker');
      expect(skills).toContain('employment-contract-reviewer');
    });

    it('returns review skills for privacy-legal (dsar)', () => {
      const skills = suggestReviewSkills('dsar');
      expect(skills).toContain('privacy-compliance-checker');
      expect(skills).toContain('document-issue-analyzer');
    });

    it('returns review skills for ip-legal (trademark)', () => {
      const skills = suggestReviewSkills('trademark');
      expect(skills).toContain('document-issue-analyzer');
      expect(skills).toContain('entity-compliance-checker');
    });

    it('returns review skills for litigation-legal (litigation)', () => {
      const skills = suggestReviewSkills('litigation');
      expect(skills).toContain('litigation-strategist');
      expect(skills).toContain('document-issue-analyzer');
    });

    it('returns review skills for regulatory-legal (compliance_gap)', () => {
      const skills = suggestReviewSkills('compliance_gap');
      expect(skills).toContain('compliance-gap-analyzer');
      expect(skills).toContain('regulatory-gap-analyzer');
    });

    it('returns review skills for ai-governance-legal (ai_impact)', () => {
      const skills = suggestReviewSkills('ai_impact');
      expect(skills).toContain('ai-impact-assessment');
    });

    it('returns review skills for product-legal (tos)', () => {
      const skills = suggestReviewSkills('tos');
      expect(skills).toContain('commercial-contract-reviewer');
      expect(skills).toContain('regulatory-gap-analyzer');
    });

    it('all returned skills are in REVIEW_SKILLS set', () => {
      // Verify every domain returns only review-valid skills
      const domains = [
        'nda', 'incorporation', 'labor_contract', 'dsar', 'trademark',
        'litigation', 'tos', 'compliance_gap', 'ai_impact', 'legal_memo',
      ];
      for (const mt of domains) {
        const skills = suggestReviewSkills(mt);
        for (const s of skills) {
          expect(REVIEW_SKILLS).toContain(s);
        }
      }
    });

    it('REVIEW_SKILLS has been expanded to 14 skills covering all 13 domains', () => {
      expect(REVIEW_SKILLS.length).toBe(14);
      // Category A — findings[] inline skills
      expect(REVIEW_SKILLS).toContain('document-issue-analyzer');
      expect(REVIEW_SKILLS).toContain('nda-reviewer');
      expect(REVIEW_SKILLS).toContain('vendor-contract-reviewer');
      expect(REVIEW_SKILLS).toContain('commercial-contract-reviewer');
      expect(REVIEW_SKILLS).toContain('employment-contract-reviewer');
      // Category B — checks[]/risks[]/gaps[]/gapAnalysis[]
      expect(REVIEW_SKILLS).toContain('entity-compliance-checker');
      expect(REVIEW_SKILLS).toContain('corporate-compliance-checker');
      expect(REVIEW_SKILLS).toContain('privacy-compliance-checker');
      expect(REVIEW_SKILLS).toContain('labor-discipline-checker');
      expect(REVIEW_SKILLS).toContain('employment-policy-checker');
      expect(REVIEW_SKILLS).toContain('regulatory-gap-analyzer');
      expect(REVIEW_SKILLS).toContain('compliance-gap-analyzer');
      expect(REVIEW_SKILLS).toContain('ai-impact-assessment');
      expect(REVIEW_SKILLS).toContain('litigation-strategist');
    });

    it('DOMAIN_REVIEW_SKILL_MAP has all 13 legal domains', () => {
      const expected = [
        'commercial-legal', 'corporate-legal', 'employment-legal',
        'privacy-legal', 'product-legal', 'regulatory-legal',
        'ai-governance-legal', 'ip-legal', 'litigation-legal',
        'legal-clinic', 'law-student', 'legal-builder-hub', 'external-plugins',
      ];
      for (const d of expected) {
        expect(DOMAIN_REVIEW_SKILL_MAP).toHaveProperty(d);
        const skills = DOMAIN_REVIEW_SKILL_MAP[d as keyof typeof DOMAIN_REVIEW_SKILL_MAP]!;
        expect(skills.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every domain has at least 1 specialized review skill (not just document-issue-analyzer)', () => {
      // Check that domains don't rely solely on document-issue-analyzer
      const domainsWithOnlyGeneric: string[] = [];
      for (const [domain, skills] of Object.entries(DOMAIN_REVIEW_SKILL_MAP)) {
        const specialized = skills.filter(s => s !== 'document-issue-analyzer');
        if (specialized.length === 0) {
          domainsWithOnlyGeneric.push(domain);
        }
      }
      // Only legal-clinic, law-student, external-plugins are expected to have just the generic
      expect(domainsWithOnlyGeneric).toEqual(['legal-clinic', 'law-student', 'external-plugins']);
    });

    it('nda domain has 4 review skills (most reviewed domain)', () => {
      const skills = suggestReviewSkills('nda');
      expect(skills.length).toBe(3); // sliced to 3
      expect(skills).toContain('nda-reviewer');
    });

    it('commercial-legal domain has 4 review skills available', () => {
      const skills = DOMAIN_REVIEW_SKILL_MAP['commercial-legal']!;
      expect(skills).toEqual([
        'document-issue-analyzer',
        'nda-reviewer',
        'vendor-contract-reviewer',
        'commercial-contract-reviewer',
      ]);
    });
  });

  describe('blackbox', () => {
    it('returns only document-issue-analyzer for null matterTypeKey', () => {
      const skills = suggestReviewSkills(null);
      expect(skills).toEqual(['document-issue-analyzer']);
    });

    it('returns only document-issue-analyzer for undefined matterTypeKey', () => {
      const skills = suggestReviewSkills(undefined);
      expect(skills).toEqual(['document-issue-analyzer']);
    });

    it('slices to max 3 skills per domain', () => {
      // commercial-legal có 4 skills nhưng suggestReviewSkills chỉ trả về 3
      const skills = suggestReviewSkills('nda');
      expect(skills.length).toBe(3);
    });
  });

  describe('abnormal', () => {
    it('returns document-issue-analyzer for empty string', () => {
      const skills = suggestReviewSkills('');
      expect(skills).toEqual(['document-issue-analyzer']);
    });

    it('returns commercial-legal review skills for unknown matterTypeKey', () => {
      const skills = suggestReviewSkills('completely_unknown_xyz123');
      // Falls back to DEFAULT_DOMAIN (commercial-legal) which has 3 skills
      expect(skills.length).toBe(3);
      expect(skills[0]).toBe('document-issue-analyzer');
    });

    it('no skill returned is outside REVIEW_SKILLS', () => {
      const allMatterTypes = [
        'nda', 'incorporation', 'labor_contract', 'trademark', 'litigation',
        'tos', 'compliance_gap', 'ai_impact', 'legal_advice', null, undefined, '',
      ];
      for (const mt of allMatterTypes) {
        const skills = suggestReviewSkills(mt);
        for (const s of skills) {
          expect(REVIEW_SKILLS.includes(s)).toBe(true);
        }
      }
    });
  });
});

describe('getPrimarySkill', () => {
  describe('whitebox', () => {
    it('returns document-issue-analyzer for null', () => {
      expect(getPrimarySkill(null)).toBe('document-issue-analyzer');
    });

    it('returns document-issue-analyzer for undefined', () => {
      expect(getPrimarySkill(undefined)).toBe('document-issue-analyzer');
    });

    it('returns a review/analyzer skill when available', () => {
      const skill = getPrimarySkill('contract_review');
      // Should prefer review/analyzer/check skills
      const hasReviewInName = skill.includes('review') || skill.includes('analyzer') || skill.includes('check');
      expect(hasReviewInName).toBe(true);
    });

    it('returns a valid skill for known matterType', () => {
      const skill = getPrimarySkill('nda');
      expect(typeof skill).toBe('string');
      // From commercial-legal domain: nda-reviewer has 'review' in name
      expect(skill).toContain('review');
    });
  });

  describe('error', () => {
    it('falls back to commercial-legal review skill for unknown matterType', () => {
      const skill = getPrimarySkill('completely_unknown_xyz');
      // Falls back to commercial-legal domain → first review skill
      expect(skill).toBe('nda-reviewer');
    });
  });
});
