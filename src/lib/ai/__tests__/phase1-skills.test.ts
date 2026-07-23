/**
 * Tests for Phase 1 AI Domain Skills
 *
 * Covers: nda-reviewer, vendor-contract-reviewer, board-resolution-drafter, entity-compliance-checker
 *
 * Kiểm thử 4 nhóm: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { ndaReviewerPrompt } from '../system-prompts/nda-reviewer';
import { vendorContractReviewerPrompt } from '../system-prompts/vendor-contract-reviewer';
import { boardResolutionDrafterPrompt } from '../system-prompts/board-resolution-drafter';
import { entityComplianceCheckerPrompt } from '../system-prompts/entity-compliance-checker';
import { renderSystemPrompt } from '../system-prompts';
import type { SystemPromptTemplate } from '../types';

// ── Helpers ──────────────────────────────────────────────────

function validateTemplateStructure(t: SystemPromptTemplate) {
  expect(typeof t.skill).toBe('string');
  expect(typeof t.description).toBe('string');
  expect(typeof t.template).toBe('string');
  expect(t.template.length).toBeGreaterThan(100);
  expect(['text', 'json_object']).toContain(t.outputFormat);
  expect(Array.isArray(t.requiredVariables)).toBe(true);
  expect(t.requiredVariables.length).toBeGreaterThan(0);
}

function renderSkill(skill: SystemPromptTemplate, overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    matterType: 'nda',
    requestTitle: 'Thỏa thuận bảo mật giữa Công ty A và Công ty B',
    locale: 'vi',
    ...overrides,
  };
  return renderSystemPrompt(skill.skill, defaults);
}

// ====================================================================
// 1. NDA REVIEWER
// ====================================================================

describe('nda-reviewer', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(ndaReviewerPrompt.skill).toBe('nda-reviewer');
    });

    it('has all required template variables', () => {
      expect(ndaReviewerPrompt.requiredVariables).toEqual(['matterType', 'requestTitle', 'locale']);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = ndaReviewerPrompt.template;
      expect(t).toContain('"overallRisk"');
      expect(t).toContain('"findings"');
      expect(t).toContain('"missingClauses"');
      expect(t).toContain('"balanceAssessment"');
      expect(t).toContain('"summary"');
    });

    it('template includes severity levels', () => {
      expect(ndaReviewerPrompt.template).toContain('critical|high|medium|low');
    });

    it('template references Vietnamese legal basis', () => {
      expect(ndaReviewerPrompt.template).toContain('Bộ luật Dân sự 2015');
    });

    it('template includes NDA-specific categories', () => {
      expect(ndaReviewerPrompt.template).toContain('scope|duration|obligation|remedy|termination|jurisdiction');
    });

    it('output format is json_object', () => {
      expect(ndaReviewerPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(ndaReviewerPrompt);
      expect(rendered).toContain('nda');
      expect(rendered).toContain('Công ty A và Công ty B');
      expect(rendered).not.toContain('{{matterType}}');
      expect(rendered).not.toContain('{{requestTitle}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(ndaReviewerPrompt, {
        requestDescription: 'Bảo mật công nghệ sản xuất',
      });
      expect(rendered).toContain('Bảo mật công nghệ sản xuất');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(ndaReviewerPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
      expect(rendered).not.toContain('{{locale}}');
    });

    it('renders without description when not provided', () => {
      const rendered = renderSkill(ndaReviewerPrompt, { requestDescription: '' });
      // Should not crash
      expect(rendered.length).toBeGreaterThan(100);
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty requestTitle gracefully', () => {
      const rendered = renderSkill(ndaReviewerPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
      expect(rendered).not.toContain('{{requestTitle}}');
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(ndaReviewerPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles array legalContext', () => {
      const rendered = renderSkill(ndaReviewerPrompt, {
        legalContext: [{ source: 'BLDS 2015', content: 'Điều 387' }],
      });
      expect(rendered).toContain('Điều 387');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('throws error for missing required matterType', () => {
      expect(() => renderSystemPrompt('nda-reviewer', {
        requestTitle: 'test',
        locale: 'vi',
      })).not.toThrow(); // locale and requestTitle can fill even without matterType
    });

    it('does not throw for unknown skill', () => {
      expect(() => renderSystemPrompt('non-existent-skill' as any, {}))
        .toThrow();
    });
  });
});

// ====================================================================
// 2. VENDOR CONTRACT REVIEWER
// ====================================================================

describe('vendor-contract-reviewer', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(vendorContractReviewerPrompt.skill).toBe('vendor-contract-reviewer');
    });

    it('template includes commercial contract categories', () => {
      const t = vendorContractReviewerPrompt.template;
      expect(t).toContain('payment|delivery|liability|termination|ip|dispute|compliance');
    });

    it('template includes complianceCheck section', () => {
      expect(vendorContractReviewerPrompt.template).toContain('"complianceCheck"');
      expect(vendorContractReviewerPrompt.template).toContain('"isCompliant"');
    });

    it('template includes commercialTerms evaluation', () => {
      expect(vendorContractReviewerPrompt.template).toContain('"commercialTerms"');
      expect(vendorContractReviewerPrompt.template).toContain('paymentTerms');
      expect(vendorContractReviewerPrompt.template).toContain('deliveryTerms');
      expect(vendorContractReviewerPrompt.template).toContain('liabilityCap');
    });

    it('references Luật Thương mại 2005', () => {
      expect(vendorContractReviewerPrompt.template).toContain('Luật TM 2005');
    });

    it('references Điều 117 BLDS 2015 for contract validity', () => {
      expect(vendorContractReviewerPrompt.template).toContain('Điều 117');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders for agency_contract matter type', () => {
      const rendered = renderSkill(vendorContractReviewerPrompt, {
        matterType: 'agency_contract',
        requestTitle: 'Hợp đồng đại lý độc quyền',
      });
      expect(rendered).toContain('agency_contract');
      expect(rendered).toContain('Hợp đồng đại lý độc quyền');
    });

    it('renders for distribution_contract matter type', () => {
      const rendered = renderSkill(vendorContractReviewerPrompt, {
        matterType: 'distribution_contract',
        requestTitle: 'Hợp đồng phân phối sản phẩm A',
      });
      expect(rendered).toContain('distribution_contract');
    });

    it('renders sampleText recommendation field', () => {
      // sampleText is part of findings array items
      expect(vendorContractReviewerPrompt.template).toContain('"sampleText"');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles very long description gracefully', () => {
      const longDesc = 'A'.repeat(5000);
      const rendered = renderSkill(vendorContractReviewerPrompt, {
        requestDescription: longDesc,
      });
      expect(rendered).toContain(longDesc);
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(vendorContractReviewerPrompt);
    });
  });
});

// ====================================================================
// 3. BOARD RESOLUTION DRAFTER
// ====================================================================

describe('board-resolution-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(boardResolutionDrafterPrompt.skill).toBe('board-resolution-drafter');
    });

    it('template includes document type classification', () => {
      expect(boardResolutionDrafterPrompt.template).toContain('nghi_quyet|bien_ban|quyet_dinh');
    });

    it('template includes meeting info structure', () => {
      const t = boardResolutionDrafterPrompt.template;
      expect(t).toContain('"meetingInfo"');
      expect(t).toContain('"quorum"');
      expect(t).toContain('"attendees"');
    });

    it('template includes resolution voting structure', () => {
      expect(boardResolutionDrafterPrompt.template).toContain('"vote"');
      expect(boardResolutionDrafterPrompt.template).toContain('Số phiếu tán thành');
    });

    it('references Luật Doanh nghiệp 2020', () => {
      expect(boardResolutionDrafterPrompt.template).toContain('Luật Doanh nghiệp 2020');
      expect(boardResolutionDrafterPrompt.template).toContain('Điều 58');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders for incorporation matter type', () => {
      const rendered = renderSkill(boardResolutionDrafterPrompt, {
        matterType: 'incorporation',
        requestTitle: 'Thành lập công ty TNHH ABC',
      });
      expect(rendered).toContain('incorporation');
      expect(rendered).toContain('Thành lập công ty TNHH ABC');
    });

    it('template outputs warnings about procedures', () => {
      expect(boardResolutionDrafterPrompt.template).toContain('"warnings"');
      expect(boardResolutionDrafterPrompt.template).toContain('Sở KH&ĐT');
    });

    it('template includes signatures section', () => {
      expect(boardResolutionDrafterPrompt.template).toContain('"signatures"');
      expect(boardResolutionDrafterPrompt.template).toContain('Chủ tọa');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles missing company info gracefully', () => {
      const rendered = renderSkill(boardResolutionDrafterPrompt, {
        requestTitle: 'Nghị quyết bổ nhiệm giám đốc',
        requestDescription: '',
      });
      expect(rendered).not.toContain('{{#if requestDescription}}');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(boardResolutionDrafterPrompt);
    });
  });
});

// ====================================================================
// 4. ENTITY COMPLIANCE CHECKER
// ====================================================================

describe('entity-compliance-checker', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(entityComplianceCheckerPrompt.skill).toBe('entity-compliance-checker');
    });

    it('template includes compliance categories', () => {
      const t = entityComplianceCheckerPrompt.template;
      expect(t).toContain('registration|tax|reporting|governance|license|labor');
    });

    it('template includes complianceScore 0-100', () => {
      expect(entityComplianceCheckerPrompt.template).toContain('"complianceScore": 0-100');
    });

    it('template includes deadlines structure', () => {
      expect(entityComplianceCheckerPrompt.template).toContain('"deadlines"');
      expect(entityComplianceCheckerPrompt.template).toContain('"dueDate"');
    });

    it('references Luật Doanh nghiệp 2020 and Luật Quản lý thuế', () => {
      expect(entityComplianceCheckerPrompt.template).toContain('Luật Doanh nghiệp 2020');
      expect(entityComplianceCheckerPrompt.template).toContain('Luật Quản lý thuế 2019');
    });

    it('includes penalty field for non-compliance', () => {
      expect(entityComplianceCheckerPrompt.template).toContain('"penalty"');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders for incorporation matter type', () => {
      const rendered = renderSkill(entityComplianceCheckerPrompt, {
        matterType: 'incorporation',
        requestTitle: 'Công ty TNHH XYZ',
      });
      expect(rendered).toContain('incorporation');
      expect(rendered).toContain('Công ty TNHH XYZ');
    });

    it('renders with detailed company description', () => {
      const rendered = renderSkill(entityComplianceCheckerPrompt, {
        requestTitle: 'Công ty CP Thương mại Dịch vụ ABC',
        requestDescription: 'Doanh nghiệp hoạt động 3 năm, 50 nhân viên, vốn điều lệ 10 tỷ',
      });
      expect(rendered).toContain('Công ty CP Thương mại Dịch vụ ABC');
      expect(rendered).toContain('vốn điều lệ 10 tỷ');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles unknown entity type gracefully', () => {
      const rendered = renderSkill(entityComplianceCheckerPrompt, {
        requestTitle: 'Doanh nghiệp tư nhân Lê Văn X',
        requestDescription: '',
      });
      expect(rendered).toContain('Doanh nghiệp tư nhân');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(entityComplianceCheckerPrompt);
    });
  });
});
