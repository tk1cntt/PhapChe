import { describe, it, expect } from 'vitest';
import {
  getSystemPrompt,
  getAllSkills,
  getSkillsForDomain,
  renderSystemPrompt,
} from '../system-prompts';
import { DOMAIN_SKILL_MAP } from '../types';

describe('System Prompts', () => {
  describe('getSystemPrompt', () => {
    describe('Whitebox', () => {
      it('should return a valid template for every skill', () => {
        const skills = getAllSkills();
        skills.forEach((skill) => {
          const tpl = getSystemPrompt(skill);
          expect(tpl.skill).toBe(skill);
          expect(tpl.template).toBeTruthy();
          expect(tpl.description).toBeTruthy();
          expect(tpl.outputFormat).toMatch(/^(text|json_object)$/);
          expect(Array.isArray(tpl.requiredVariables)).toBe(true);
          expect(tpl.requiredVariables.length).toBeGreaterThan(0);
        });
      });

      it('should have all 14 skills', () => {
        const skills = getAllSkills();
        expect(skills.length).toBe(14);
      });

      it('should have JSON output format for all structured skills', () => {
        const skills = getAllSkills();
        skills.forEach((skill) => {
          const tpl = getSystemPrompt(skill);
          expect(tpl.outputFormat).toBe('json_object');
        });
      });
    });

    describe('Error', () => {
      it('should throw for invalid skill name', () => {
        expect(() => getSystemPrompt('invalid-skill' as any)).toThrow();
      });
    });
  });

  describe('getAllSkills', () => {
    it('should return an array of 14 skills', () => {
      const skills = getAllSkills();
      expect(skills).toHaveLength(14);
      expect(Array.isArray(skills)).toBe(true);
    });

    it('should return unique skill names', () => {
      const skills = getAllSkills();
      const unique = new Set(skills);
      expect(unique.size).toBe(skills.length);
    });

    it('should include core skills', () => {
      const skills = getAllSkills();
      expect(skills).toContain('employment-contract-reviewer');
      expect(skills).toContain('corporate-doc-generator');
      expect(skills).toContain('commercial-contract-drafter');
      expect(skills).toContain('general-legal-researcher');
    });
  });

  describe('getSkillsForDomain', () => {
    it('should return skills for each of the 13 domains', () => {
      const domains = Object.keys(DOMAIN_SKILL_MAP);
      expect(domains.length).toBe(13);

      domains.forEach((domain) => {
        const skills = getSkillsForDomain(domain, DOMAIN_SKILL_MAP);
        expect(skills.length).toBeGreaterThanOrEqual(1);
        skills.forEach((skill) => {
          expect(typeof skill).toBe('string');
        });
      });
    });

    it('should fall back to general-legal-researcher for unknown domains', () => {
      const skills = getSkillsForDomain('unknown-domain', DOMAIN_SKILL_MAP);
      expect(skills).toEqual(['general-legal-researcher']);
    });

    it('should map employment-legal to contract reviewer + policy checker', () => {
      const skills = getSkillsForDomain('employment-legal', DOMAIN_SKILL_MAP);
      expect(skills).toContain('employment-contract-reviewer');
      expect(skills).toContain('employment-policy-checker');
    });
  });

  describe('renderSystemPrompt', () => {
    describe('Blackbox', () => {
      it('should replace simple variables', () => {
        const rendered = renderSystemPrompt('employment-contract-reviewer', {
          matterType: 'labor_contract',
          requestTitle: 'Kiểm tra HĐLĐ',
          locale: 'vi',
        });
        expect(rendered).toContain('labor_contract');
        expect(rendered).toContain('Kiểm tra HĐLĐ');
        expect(rendered).not.toContain('{{matterType}}');
      });

      it('should handle missing optional variables gracefully', () => {
        const rendered = renderSystemPrompt('employment-contract-reviewer', {
          matterType: 'labor_contract',
          requestTitle: 'Test',
        });
        // Should not have unresolved template variables
        expect(rendered).not.toContain('{{#if');
        expect(rendered).not.toContain('{{/if');
      });
    });

    describe('Whitebox', () => {
      it('should handle #if block when variable is truthy', () => {
        const rendered = renderSystemPrompt('employment-contract-reviewer', {
          matterType: 'labor_contract',
          requestTitle: 'Test',
          requestDescription: 'Mô tả chi tiết về yêu cầu',
        });
        expect(rendered).toContain('Mô tả chi tiết về yêu cầu');
      });

      it('should remove #if block when variable is empty', () => {
        const rendered = renderSystemPrompt('employment-contract-reviewer', {
          matterType: 'labor_contract',
          requestTitle: 'Test',
          requestDescription: '',
        });
        expect(rendered).not.toContain('- Mô tả chi tiết:');
      });

      it('should render legalContext from RAG results', () => {
        const rendered = renderSystemPrompt('employment-contract-reviewer', {
          matterType: 'labor_contract',
          requestTitle: 'Test',
          legalContext: [
            { source: 'BLLĐ 2019 Điều 15', content: 'Hợp đồng lao động phải được giao kết bằng văn bản.', score: '0.95' },
          ],
        });
        expect(rendered).toContain('BLLĐ 2019 Điều 15');
        expect(rendered).toContain('Hợp đồng lao động phải được giao kết bằng văn bản');
      });

      it('should show fallback when no RAG context', () => {
        const rendered = renderSystemPrompt('employment-contract-reviewer', {
          matterType: 'labor_contract',
          requestTitle: 'Test',
          legalContext: [],
        });
        expect(rendered).toContain('Không có bối cảnh pháp lý từ RAG');
      });
    });

    describe('Abnormal', () => {
      it('should handle all context fields being empty', () => {
        const rendered = renderSystemPrompt('general-legal-researcher', {
          requestTitle: '',
        });
        expect(typeof rendered).toBe('string');
        expect(rendered.length).toBeGreaterThan(0);
      });

      it('should not break on missing context keys', () => {
        const rendered = renderSystemPrompt('corporate-doc-generator', {
          matterType: 'unsupported',
          requestTitle: 'Test',
        });
        expect(typeof rendered).toBe('string');
      });
    });

    describe('Error', () => {
      it('should throw for invalid skill', () => {
        expect(() => renderSystemPrompt('invalid-skill' as any, {})).toThrow();
      });
    });
  });

  describe('DOMAIN_SKILL_MAP coverage', () => {
    it('should have exactly 13 domains', () => {
      expect(Object.keys(DOMAIN_SKILL_MAP)).toHaveLength(13);
    });

    it('should map every domain to at least 1 skill', () => {
      Object.values(DOMAIN_SKILL_MAP).forEach((skills) => {
        expect(skills.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should only reference valid AgentSkill values', () => {
      const allSkills = getAllSkills();
      Object.values(DOMAIN_SKILL_MAP).flat().forEach((skill) => {
        expect(allSkills).toContain(skill);
      });
    });
  });
});
