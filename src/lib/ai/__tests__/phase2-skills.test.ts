/**
 * Tests for Phase 2 AI Domain Skills
 *
 * Covers: labor-discipline-checker, internal-regulation-drafter, dsar-response-drafter
 *
 * Kiểm thử 4 nhóm: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { laborDisciplineCheckerPrompt } from '../system-prompts/labor-discipline-checker';
import { internalRegulationDrafterPrompt } from '../system-prompts/internal-regulation-drafter';
import { dsarResponseDrafterPrompt } from '../system-prompts/dsar-response-drafter';
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
    matterType: 'labor_discipline',
    requestTitle: 'Kỷ luật sa thải nhân viên Nguyễn Văn A',
    locale: 'vi',
    ...overrides,
  };
  return renderSystemPrompt(skill.skill, defaults);
}

// ====================================================================
// 1. LABOR DISCIPLINE CHECKER
// ====================================================================

describe('labor-discipline-checker', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(laborDisciplineCheckerPrompt.skill).toBe('labor-discipline-checker');
    });

    it('has all required template variables', () => {
      expect(laborDisciplineCheckerPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = laborDisciplineCheckerPrompt.template;
      expect(t).toContain('"complianceScore"');
      expect(t).toContain('"procedureCheck"');
      expect(t).toContain('"risks"');
      expect(t).toContain('"validityAssessment"');
      expect(t).toContain('"recommendedAction"');
      expect(t).toContain('"compensationEstimate"');
      expect(t).toContain('"summary"');
    });

    it('template includes procedure check steps', () => {
      const t = laborDisciplineCheckerPrompt.template;
      expect(t).toContain('"violationRecord"');
      expect(t).toContain('"investigationMeeting"');
      expect(t).toContain('"employeeDefense"');
      expect(t).toContain('"unionConsultation"');
      expect(t).toContain('"decisionDocument"');
      expect(t).toContain('"statuteOfLimitations"');
    });

    it('template includes case type classification', () => {
      expect(laborDisciplineCheckerPrompt.template).toContain('discipline|termination|layoff|other');
    });

    it('template includes severity levels for risks', () => {
      expect(laborDisciplineCheckerPrompt.template).toContain('critical|high|medium|low');
    });

    it('references BLLĐ 2019 specific articles', () => {
      const t = laborDisciplineCheckerPrompt.template;
      expect(t).toContain('Điều 125');
      expect(t).toContain('Điều 123');
      expect(t).toContain('Điều 127');
      expect(t).toContain('Điều 36');
    });

    it('references Nghị định 145/2020/NĐ-CP', () => {
      expect(laborDisciplineCheckerPrompt.template).toContain('145/2020/NĐ-CP');
    });

    it('output format is json_object', () => {
      expect(laborDisciplineCheckerPrompt.outputFormat).toBe('json_object');
    });

    it('template includes timeline structure', () => {
      expect(laborDisciplineCheckerPrompt.template).toContain('"timeline"');
      expect(laborDisciplineCheckerPrompt.template).toContain('"deadline"');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt);
      expect(rendered).toContain('labor_discipline');
      expect(rendered).toContain('Nguyễn Văn A');
      expect(rendered).not.toContain('{{matterType}}');
      expect(rendered).not.toContain('{{requestTitle}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt, {
        requestDescription: 'Nhân viên vi phạm nội quy nhiều lần',
      });
      expect(rendered).toContain('Nhân viên vi phạm nội quy nhiều lần');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
      expect(rendered).not.toContain('{{locale}}');
    });

    it('renders with legal context from RAG', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt, {
        legalContext: [{ source: 'BLLĐ 2019', content: 'Điều 125 — Áp dụng hình thức kỷ luật lao động' }],
      });
      expect(rendered).toContain('Điều 125');
      expect(rendered).toContain('BLLĐ 2019');
    });

    it('renders validity assessment fields', () => {
      expect(laborDisciplineCheckerPrompt.template).toContain('valid|questionable|invalid');
    });

    it('renders recommended action options', () => {
      expect(laborDisciplineCheckerPrompt.template).toContain('proceed|reconsider|withdraw|negotiate');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty requestTitle gracefully', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
      expect(rendered).not.toContain('{{requestTitle}}');
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles very long description', () => {
      const longDesc = 'B'.repeat(5000);
      const rendered = renderSkill(laborDisciplineCheckerPrompt, {
        requestDescription: longDesc,
      });
      expect(rendered).toContain(longDesc);
    });

    it('handles multiple legal context items', () => {
      const rendered = renderSkill(laborDisciplineCheckerPrompt, {
        legalContext: [
          { source: 'BLLĐ 2019', content: 'Điều 125' },
          { source: 'NĐ 145/2020', content: 'Điều 70' },
        ],
      });
      expect(rendered).toContain('Điều 125');
      expect(rendered).toContain('Điều 70');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(laborDisciplineCheckerPrompt);
    });

    it('throws for non-existent skill', () => {
      expect(() => renderSystemPrompt('non-existent-skill' as any, {}))
        .toThrow();
    });
  });
});

// ====================================================================
// 2. INTERNAL REGULATION DRAFTER
// ====================================================================

describe('internal-regulation-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(internalRegulationDrafterPrompt.skill).toBe('internal-regulation-drafter');
    });

    it('has all required template variables', () => {
      expect(internalRegulationDrafterPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = internalRegulationDrafterPrompt.template;
      expect(t).toContain('"regulationTitle"');
      expect(t).toContain('"companyInfo"');
      expect(t).toContain('"chapters"');
      expect(t).toContain('"mandatoryContents"');
      expect(t).toContain('"registrationGuide"');
      expect(t).toContain('"warnings"');
      expect(t).toContain('"summary"');
    });

    it('template includes all 9 mandatory content categories', () => {
      const t = internalRegulationDrafterPrompt.template;
      expect(t).toContain('"workingHours"');
      expect(t).toContain('"restBreaks"');
      expect(t).toContain('"holidays"');
      expect(t).toContain('"order"');
      expect(t).toContain('"safety"');
      expect(t).toContain('"sexualHarassment"');
      expect(t).toContain('"property"');
      expect(t).toContain('"discipline"');
      expect(t).toContain('"compensation"');
    });

    it('template includes chapter and article structures', () => {
      const t = internalRegulationDrafterPrompt.template;
      expect(t).toContain('"number"');
      expect(t).toContain('"title"');
      expect(t).toContain('"articles"');
      expect(t).toContain('"content"');
      expect(t).toContain('"legalBasis"');
    });

    it('references BLLĐ 2019 specific articles', () => {
      const t = internalRegulationDrafterPrompt.template;
      expect(t).toContain('Điều 118');
      expect(t).toContain('Điều 105');
      expect(t).toContain('Điều 107');
      expect(t).toContain('Điều 109');
      expect(t).toContain('Điều 124');
    });

    it('references Nghị định 145/2020/NĐ-CP for registration', () => {
      expect(internalRegulationDrafterPrompt.template).toContain('145/2020/NĐ-CP');
    });

    it('template includes registration authority info', () => {
      const t = internalRegulationDrafterPrompt.template;
      expect(t).toContain('Sở Lao động - Thương binh và Xã hội');
      expect(t).toContain('"requiredDocs"');
      expect(t).toContain('"timeline"');
    });

    it('template includes employee count requirement warning', () => {
      expect(internalRegulationDrafterPrompt.template).toContain('10 lao động trở lên');
    });

    it('output format is json_object', () => {
      expect(internalRegulationDrafterPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(internalRegulationDrafterPrompt, {
        matterType: 'internal_regulation',
        requestTitle: 'Công ty TNHH ABC',
      });
      expect(rendered).toContain('internal_regulation');
      expect(rendered).toContain('Công ty TNHH ABC');
      expect(rendered).not.toContain('{{matterType}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(internalRegulationDrafterPrompt, {
        requestDescription: 'Doanh nghiệp 50 nhân viên, ngành sản xuất',
      });
      expect(rendered).toContain('Doanh nghiệp 50 nhân viên');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(internalRegulationDrafterPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
      expect(rendered).not.toContain('{{locale}}');
    });

    it('template includes discipline form types', () => {
      expect(internalRegulationDrafterPrompt.template).toContain('khiển trách');
      expect(internalRegulationDrafterPrompt.template).toContain('sa thải');
    });

    it('template prohibits monetary fines as discipline', () => {
      expect(internalRegulationDrafterPrompt.template).toContain('phạt tiền');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty company name gracefully', () => {
      const rendered = renderSkill(internalRegulationDrafterPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(internalRegulationDrafterPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles multiple legal context items for RAG', () => {
      const rendered = renderSkill(internalRegulationDrafterPrompt, {
        legalContext: [
          { source: 'BLLĐ 2019', content: 'Điều 118 — Nội quy lao động' },
          { source: 'NĐ 145/2020', content: 'Điều 19 — Đăng ký nội quy' },
        ],
      });
      expect(rendered).toContain('Điều 118');
      expect(rendered).toContain('Điều 19');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(internalRegulationDrafterPrompt);
    });
  });
});

// ====================================================================
// 3. DSAR RESPONSE DRAFTER
// ====================================================================

describe('dsar-response-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(dsarResponseDrafterPrompt.skill).toBe('dsar-response-drafter');
    });

    it('has all required template variables', () => {
      expect(dsarResponseDrafterPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = dsarResponseDrafterPrompt.template;
      expect(t).toContain('"responseId"');
      expect(t).toContain('"requestType"');
      expect(t).toContain('"requesterInfo"');
      expect(t).toContain('"identityVerification"');
      expect(t).toContain('"response"');
      expect(t).toContain('"timeline"');
      expect(t).toContain('"risks"');
      expect(t).toContain('"regulatoryNotification"');
      expect(t).toContain('"attachments"');
      expect(t).toContain('"summary"');
    });

    it('template includes DSAR request types', () => {
      expect(dsarResponseDrafterPrompt.template).toContain(
        'access|rectification|erasure|restriction|portability|objection',
      );
    });

    it('template includes response status levels', () => {
      expect(dsarResponseDrafterPrompt.template).toContain('full|partial|denied|extended');
    });

    it('template includes data provision structure', () => {
      const t = dsarResponseDrafterPrompt.template;
      expect(t).toContain('"dataProvided"');
      expect(t).toContain('"category"');
      expect(t).toContain('"fields"');
      expect(t).toContain('"source"');
      expect(t).toContain('"purpose"');
      expect(t).toContain('"retentionPeriod"');
      expect(t).toContain('"sharedWith"');
    });

    it('template includes data denial structure', () => {
      const t = dsarResponseDrafterPrompt.template;
      expect(t).toContain('"dataNotProvided"');
      expect(t).toContain('"reason"');
    });

    it('template includes actions structure for rectification/erasure', () => {
      const t = dsarResponseDrafterPrompt.template;
      expect(t).toContain('"actions"');
      expect(t).toContain('rectify|erase|restrict|stop_processing');
    });

    it('references Nghị định 13/2023/NĐ-CP', () => {
      expect(dsarResponseDrafterPrompt.template).toContain('13/2023/NĐ-CP');
    });

    it('references GDPR Articles 15-22', () => {
      expect(dsarResponseDrafterPrompt.template).toContain('GDPR');
    });

    it('template includes identity verification methods', () => {
      const t = dsarResponseDrafterPrompt.template;
      expect(t).toContain('CMND/CCCD');
      expect(t).toContain('eKYC');
    });

    it('template mentions 72h regulatory notification deadline', () => {
      expect(dsarResponseDrafterPrompt.template).toContain('72h');
    });

    it('output format is json_object', () => {
      expect(dsarResponseDrafterPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, {
        matterType: 'dsar_access',
        requestTitle: 'Nguyễn Thị B — Yêu cầu truy cập dữ liệu',
      });
      expect(rendered).toContain('dsar_access');
      expect(rendered).toContain('Nguyễn Thị B');
      expect(rendered).not.toContain('{{matterType}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, {
        requestDescription: 'Khách hàng yêu cầu xem toàn bộ dữ liệu đã thu thập',
      });
      expect(rendered).toContain('Khách hàng yêu cầu xem toàn bộ dữ liệu');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
      expect(rendered).not.toContain('{{locale}}');
    });

    it('renders with legal context', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, {
        legalContext: [
          { source: 'NĐ 13/2023', content: 'Điều 9 — Quyền của chủ thể dữ liệu' },
        ],
      });
      expect(rendered).toContain('Điều 9');
      expect(rendered).toContain('NĐ 13/2023');
    });

    it('template includes Cục An toàn thông tin reference', () => {
      expect(dsarResponseDrafterPrompt.template).toContain('Cục An toàn thông tin');
    });

    it('template includes data portability format references', () => {
      expect(dsarResponseDrafterPrompt.template).toContain('JSON');
      expect(dsarResponseDrafterPrompt.template).toContain('CSV');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty requester name gracefully', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles very long requester details', () => {
      const longDesc = 'C'.repeat(5000);
      const rendered = renderSkill(dsarResponseDrafterPrompt, {
        requestDescription: longDesc,
      });
      expect(rendered).toContain(longDesc);
    });

    it('handles multiple legal context items', () => {
      const rendered = renderSkill(dsarResponseDrafterPrompt, {
        legalContext: [
          { source: 'NĐ 13/2023', content: 'Điều 9 — Quyền tiếp cận' },
          { source: 'GDPR Art.15', content: 'Right of access by the data subject' },
          { source: 'NĐ 13/2023', content: 'Điều 14 — Quyền xóa dữ liệu' },
        ],
      });
      expect(rendered).toContain('Điều 9');
      expect(rendered).toContain('GDPR Art.15');
      expect(rendered).toContain('Điều 14');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(dsarResponseDrafterPrompt);
    });

    it('throws for non-existent skill', () => {
      expect(() => renderSystemPrompt('non-existent-skill' as any, {}))
        .toThrow();
    });
  });
});
