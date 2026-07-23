/**
 * Tests for Domain Resolver — matterTypeKey → domain → skills mapping
 *
 * Kiểm thử 4 nhóm: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { suggestSkills, matterTypeToDomain, getPrimarySkill } from '../domain-resolver';

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
