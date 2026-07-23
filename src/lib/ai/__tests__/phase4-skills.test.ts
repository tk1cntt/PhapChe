/**
 * Tests for Phase 4 AI Domain Skills
 *
 * Covers: tos-generator, compliance-gap-analyzer, ai-impact-assessment,
 *         client-letter-drafter, legal-memo-drafter
 *
 * Kiểm thử 4 nhóm: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { tosGeneratorPrompt } from '../system-prompts/tos-generator';
import { complianceGapAnalyzerPrompt } from '../system-prompts/compliance-gap-analyzer';
import { aiImpactAssessmentPrompt } from '../system-prompts/ai-impact-assessment';
import { clientLetterDrafterPrompt } from '../system-prompts/client-letter-drafter';
import { legalMemoDrafterPrompt } from '../system-prompts/legal-memo-drafter';
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
    matterType: 'saas_product',
    requestTitle: 'Nền tảng SaaS "CloudPlat" — Điều khoản dịch vụ',
    locale: 'vi',
    ...overrides,
  };
  return renderSystemPrompt(skill.skill, defaults);
}

// ====================================================================
// 1. TOS GENERATOR
// ====================================================================

describe('tos-generator', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(tosGeneratorPrompt.skill).toBe('tos-generator');
    });

    it('has all required template variables', () => {
      expect(tosGeneratorPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = tosGeneratorPrompt.template;
      expect(t).toContain('"productInfo"');
      expect(t).toContain('"sections"');
      expect(t).toContain('"mandatoryClauses"');
      expect(t).toContain('"consumerProtection"');
      expect(t).toContain('"ecommerceCompliance"');
      expect(t).toContain('"dataPrivacy"');
      expect(t).toContain('"risks"');
      expect(t).toContain('"summary"');
    });

    it('template includes all 12 mandatory TOS clauses', () => {
      const t = tosGeneratorPrompt.template;
      expect(t).toContain('"acceptance"');
      expect(t).toContain('"accountRegistration"');
      expect(t).toContain('"serviceDescription"');
      expect(t).toContain('"paymentAndFees"');
      expect(t).toContain('"userObligations"');
      expect(t).toContain('"intellectualProperty"');
      expect(t).toContain('"privacyAndData"');
      expect(t).toContain('"limitationOfLiability"');
      expect(t).toContain('"termination"');
      expect(t).toContain('"disputeResolution"');
      expect(t).toContain('"modification"');
      expect(t).toContain('"governingLaw"');
    });

    it('references Luật BVQLNTD 2023', () => {
      expect(tosGeneratorPrompt.template).toContain('BVQLNTD 2023');
    });

    it('references Nghị định 13/2023/NĐ-CP for data privacy', () => {
      expect(tosGeneratorPrompt.template).toContain('13/2023/NĐ-CP');
    });

    it('references e-commerce regulations', () => {
      const t = tosGeneratorPrompt.template;
      expect(t).toContain('Nghị định 52/2013');
      expect(t).toContain('Luật TMĐT');
    });

    it('template includes consumer refund policy', () => {
      expect(tosGeneratorPrompt.template).toContain('"refundPolicy"');
      expect(tosGeneratorPrompt.template).toContain('"cancellationRights"');
    });

    it('output format is json_object', () => {
      expect(tosGeneratorPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(tosGeneratorPrompt, {
        matterType: 'saas',
        requestTitle: 'CloudPlat — Nền tảng SaaS',
      });
      expect(rendered).toContain('saas');
      expect(rendered).toContain('CloudPlat');
      expect(rendered).not.toContain('{{matterType}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(tosGeneratorPrompt, {
        requestDescription: 'Nền tảng quản lý doanh nghiệp SMEs',
      });
      expect(rendered).toContain('Nền tảng quản lý doanh nghiệp');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(tosGeneratorPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes data subject rights', () => {
      expect(tosGeneratorPrompt.template).toContain('Quyền truy cập');
      expect(tosGeneratorPrompt.template).toContain('Quyền xóa');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty product name gracefully', () => {
      const rendered = renderSkill(tosGeneratorPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(tosGeneratorPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(tosGeneratorPrompt);
    });
  });
});

// ====================================================================
// 2. COMPLIANCE GAP ANALYZER
// ====================================================================

describe('compliance-gap-analyzer', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(complianceGapAnalyzerPrompt.skill).toBe('compliance-gap-analyzer');
    });

    it('has all required template variables', () => {
      expect(complianceGapAnalyzerPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = complianceGapAnalyzerPrompt.template;
      expect(t).toContain('"organization"');
      expect(t).toContain('"regulatoryLandscape"');
      expect(t).toContain('"gapAnalysis"');
      expect(t).toContain('"riskHeatmap"');
      expect(t).toContain('"remediationPlan"');
      expect(t).toContain('"complianceProgram"');
      expect(t).toContain('"summary"');
    });

    it('template includes compliance maturity model', () => {
      expect(complianceGapAnalyzerPrompt.template).toContain(
        'initial|developing|defined|managed|optimizing',
      );
    });

    it('template includes gap categories', () => {
      expect(complianceGapAnalyzerPrompt.template).toContain(
        'governance|operations|reporting|financial|technical|hr|data|environmental|other',
      );
    });

    it('template includes 3-phase remediation plan', () => {
      const t = complianceGapAnalyzerPrompt.template;
      expect(t).toContain('"immediate"');
      expect(t).toContain('"shortTerm"');
      expect(t).toContain('"longTerm"');
    });

    it('template includes penalty assessment', () => {
      expect(complianceGapAnalyzerPrompt.template).toContain('"penalty"');
      expect(complianceGapAnalyzerPrompt.template).toContain('"penaltyBasis"');
    });

    it('template includes regulatory update tracking', () => {
      expect(complianceGapAnalyzerPrompt.template).toContain('"regulatoryUpdates"');
      expect(complianceGapAnalyzerPrompt.template).toContain('draft|enacted|effective|amended');
    });

    it('output format is json_object', () => {
      expect(complianceGapAnalyzerPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(complianceGapAnalyzerPrompt, {
        matterType: 'fintech',
        requestTitle: 'Công ty FinTech PayGo',
      });
      expect(rendered).toContain('fintech');
      expect(rendered).toContain('PayGo');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(complianceGapAnalyzerPrompt, {
        requestDescription: 'Startup 2 năm, chưa có bộ phận compliance',
      });
      expect(rendered).toContain('Startup 2 năm');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(complianceGapAnalyzerPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes training needs', () => {
      expect(complianceGapAnalyzerPrompt.template).toContain('"trainingNeeds"');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty company name gracefully', () => {
      const rendered = renderSkill(complianceGapAnalyzerPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(complianceGapAnalyzerPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(complianceGapAnalyzerPrompt);
    });
  });
});

// ====================================================================
// 3. AI IMPACT ASSESSMENT
// ====================================================================

describe('ai-impact-assessment', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(aiImpactAssessmentPrompt.skill).toBe('ai-impact-assessment');
    });

    it('has all required template variables', () => {
      expect(aiImpactAssessmentPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = aiImpactAssessmentPrompt.template;
      expect(t).toContain('"systemProfile"');
      expect(t).toContain('"riskClassification"');
      expect(t).toContain('"impactAssessment"');
      expect(t).toContain('"ethicalAssessment"');
      expect(t).toContain('"technicalSafeguards"');
      expect(t).toContain('"dataGovernance"');
      expect(t).toContain('"complianceChecklist"');
      expect(t).toContain('"risks"');
      expect(t).toContain('"recommendations"');
      expect(t).toContain('"summary"');
    });

    it('template includes EU AI Act risk classification', () => {
      expect(aiImpactAssessmentPrompt.template).toContain(
        'unacceptable|high|limited|minimal',
      );
    });

    it('template includes fundamental rights assessment', () => {
      const t = aiImpactAssessmentPrompt.template;
      expect(t).toContain('"privacy"');
      expect(t).toContain('"nonDiscrimination"');
      expect(t).toContain('"freedomOfExpression"');
      expect(t).toContain('"dueProcess"');
      expect(t).toContain('"laborRights"');
    });

    it('template includes ethical principles', () => {
      expect(aiImpactAssessmentPrompt.template).toContain(
        'transparency|fairness|accountability|privacy|safety|human_oversight|explainability',
      );
    });

    it('template includes bias analysis', () => {
      expect(aiImpactAssessmentPrompt.template).toContain('"biasAnalysis"');
      expect(aiImpactAssessmentPrompt.template).toContain('"biasTypes"');
    });

    it('references EU AI Act and NĐ 13/2023', () => {
      const t = aiImpactAssessmentPrompt.template;
      expect(t).toContain('EU AI Act');
      expect(t).toContain('13/2023/NĐ-CP');
    });

    it('references ISO 42001', () => {
      expect(aiImpactAssessmentPrompt.template).toContain('ISO 42001');
    });

    it('template includes environmental impact', () => {
      expect(aiImpactAssessmentPrompt.template).toContain('"environmentalImpact"');
      expect(aiImpactAssessmentPrompt.template).toContain('"carbonFootprint"');
    });

    it('output format is json_object', () => {
      expect(aiImpactAssessmentPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(aiImpactAssessmentPrompt, {
        matterType: 'llm_chatbot',
        requestTitle: 'AI Chatbot tư vấn khách hàng tự động',
      });
      expect(rendered).toContain('llm_chatbot');
      expect(rendered).toContain('AI Chatbot');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(aiImpactAssessmentPrompt, {
        requestDescription: 'Sử dụng GPT để trả lời câu hỏi khách hàng 24/7',
      });
      expect(rendered).toContain('GPT');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(aiImpactAssessmentPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes human-in-the-loop levels', () => {
      expect(aiImpactAssessmentPrompt.template).toContain(
        'full|partial|minimal|none',
      );
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty system name gracefully', () => {
      const rendered = renderSkill(aiImpactAssessmentPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(aiImpactAssessmentPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(aiImpactAssessmentPrompt);
    });
  });
});

// ====================================================================
// 4. CLIENT LETTER DRAFTER
// ====================================================================

describe('client-letter-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(clientLetterDrafterPrompt.skill).toBe('client-letter-drafter');
    });

    it('has all required template variables', () => {
      expect(clientLetterDrafterPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = clientLetterDrafterPrompt.template;
      expect(t).toContain('"letterReference"');
      expect(t).toContain('"client"');
      expect(t).toContain('"executiveSummary"');
      expect(t).toContain('"legalAnalysis"');
      expect(t).toContain('"options"');
      expect(t).toContain('"recommendation"');
      expect(t).toContain('"risksAndCaveats"');
      expect(t).toContain('"costEstimate"');
      expect(t).toContain('"letterContent"');
      expect(t).toContain('"summary"');
    });

    it('template includes executive summary with short answer', () => {
      const t = clientLetterDrafterPrompt.template;
      expect(t).toContain('"shortAnswer"');
      expect(t).toContain('"overallRecommendation"');
    });

    it('template includes multiple options for client choice', () => {
      expect(clientLetterDrafterPrompt.template).toContain('"options"');
      expect(clientLetterDrafterPrompt.template).toContain('"pros"');
      expect(clientLetterDrafterPrompt.template).toContain('"cons"');
    });

    it('template includes standard legal disclaimer', () => {
      expect(clientLetterDrafterPrompt.template).toContain('MIỄN TRỪ TRÁCH NHIỆM');
    });

    it('template includes attorney-client privilege mention', () => {
      expect(clientLetterDrafterPrompt.template).toContain('privilege');
    });

    it('template includes cost estimate', () => {
      expect(clientLetterDrafterPrompt.template).toContain('"professionalFees"');
      expect(clientLetterDrafterPrompt.template).toContain('"disbursements"');
    });

    it('output format is json_object', () => {
      expect(clientLetterDrafterPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(clientLetterDrafterPrompt, {
        matterType: 'contract_dispute',
        requestTitle: 'Công ty TNHH ABC — Tranh chấp hợp đồng',
      });
      expect(rendered).toContain('contract_dispute');
      expect(rendered).toContain('Công ty TNHH ABC');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(clientLetterDrafterPrompt, {
        requestDescription: 'Khách hàng muốn biết có nên khởi kiện không',
      });
      expect(rendered).toContain('khởi kiện');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(clientLetterDrafterPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes next steps with deadlines', () => {
      expect(clientLetterDrafterPrompt.template).toContain('"nextSteps"');
      expect(clientLetterDrafterPrompt.template).toContain('"deadline"');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty client name gracefully', () => {
      const rendered = renderSkill(clientLetterDrafterPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(clientLetterDrafterPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(clientLetterDrafterPrompt);
    });
  });
});

// ====================================================================
// 5. LEGAL MEMO DRAFTER
// ====================================================================

describe('legal-memo-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(legalMemoDrafterPrompt.skill).toBe('legal-memo-drafter');
    });

    it('has all required template variables', () => {
      expect(legalMemoDrafterPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = legalMemoDrafterPrompt.template;
      expect(t).toContain('"memoHeader"');
      expect(t).toContain('"questionPresented"');
      expect(t).toContain('"shortAnswer"');
      expect(t).toContain('"statementOfFacts"');
      expect(t).toContain('"discussion"');
      expect(t).toContain('"legalResearch"');
      expect(t).toContain('"conclusion"');
      expect(t).toContain('"openIssues"');
      expect(t).toContain('"recommendations"');
      expect(t).toContain('"references"');
      expect(t).toContain('"summary"');
    });

    it('template follows IRAC structure', () => {
      expect(legalMemoDrafterPrompt.template).toContain('IRAC');
      expect(legalMemoDrafterPrompt.template).toContain('Issue-Rule-Application-Conclusion');
    });

    it('template includes legal research with multiple source types', () => {
      const t = legalMemoDrafterPrompt.template;
      expect(t).toContain('"statutes"');
      expect(t).toContain('"caseLaw"');
      expect(t).toContain('"secondarySources"');
    });

    it('template includes counterarguments and rebuttals', () => {
      const t = legalMemoDrafterPrompt.template;
      expect(t).toContain('"counterarguments"');
      expect(t).toContain('"rebuttals"');
    });

    it('template marks as PRIVILEGED AND CONFIDENTIAL', () => {
      expect(legalMemoDrafterPrompt.template).toContain('PRIVILEGED AND CONFIDENTIAL');
    });

    it('template includes open issues tracking', () => {
      expect(legalMemoDrafterPrompt.template).toContain('"openIssues"');
      expect(legalMemoDrafterPrompt.template).toContain('"howToResolve"');
    });

    it('template includes full citation references', () => {
      expect(legalMemoDrafterPrompt.template).toContain('"references"');
      expect(legalMemoDrafterPrompt.template).toContain('"fullCitation"');
      expect(legalMemoDrafterPrompt.template).toContain('"pinpoint"');
    });

    it('output format is json_object', () => {
      expect(legalMemoDrafterPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(legalMemoDrafterPrompt, {
        matterType: 'force_majeure',
        requestTitle: 'Phân tích điều khoản bất khả kháng trong hợp đồng thương mại',
      });
      expect(rendered).toContain('force_majeure');
      expect(rendered).toContain('bất khả kháng');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(legalMemoDrafterPrompt, {
        requestDescription: 'Khách hàng bị ảnh hưởng bởi thiên tai, không thể giao hàng',
      });
      expect(rendered).toContain('thiên tai');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(legalMemoDrafterPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes attorney-client privilege', () => {
      expect(legalMemoDrafterPrompt.template).toContain('ATTORNEY-CLIENT');
    });

    it('template includes case distinguishability analysis', () => {
      expect(legalMemoDrafterPrompt.template).toContain('"distinguishability"');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty memo subject gracefully', () => {
      const rendered = renderSkill(legalMemoDrafterPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(legalMemoDrafterPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });

    it('handles very long fact description', () => {
      const longDesc = 'F'.repeat(5000);
      const rendered = renderSkill(legalMemoDrafterPrompt, { requestDescription: longDesc });
      expect(rendered).toContain(longDesc);
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(legalMemoDrafterPrompt);
    });
  });
});
