/**
 * Tests for Phase 3 AI Domain Skills
 *
 * Covers: trademark-clearance, cease-desist-drafter, demand-letter-drafter, litigation-strategist
 *
 * Kiểm thử 4 nhóm: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { trademarkClearancePrompt } from '../system-prompts/trademark-clearance';
import { ceaseDesistDrafterPrompt } from '../system-prompts/cease-desist-drafter';
import { demandLetterDrafterPrompt } from '../system-prompts/demand-letter-drafter';
import { litigationStrategistPrompt } from '../system-prompts/litigation-strategist';
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
    matterType: 'trademark',
    requestTitle: 'Nhãn hiệu "PhapChe Pro" cho dịch vụ pháp lý',
    locale: 'vi',
    ...overrides,
  };
  return renderSystemPrompt(skill.skill, defaults);
}

// ====================================================================
// 1. TRADEMARK CLEARANCE
// ====================================================================

describe('trademark-clearance', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(trademarkClearancePrompt.skill).toBe('trademark-clearance');
    });

    it('has all required template variables', () => {
      expect(trademarkClearancePrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = trademarkClearancePrompt.template;
      expect(t).toContain('"mark"');
      expect(t).toContain('"niceClasses"');
      expect(t).toContain('"clearanceScore"');
      expect(t).toContain('"distinctiveness"');
      expect(t).toContain('"absoluteGrounds"');
      expect(t).toContain('"relativeGrounds"');
      expect(t).toContain('"priorArt"');
      expect(t).toContain('"recommendation"');
      expect(t).toContain('"costEstimate"');
      expect(t).toContain('"summary"');
    });

    it('template includes mark types', () => {
      expect(trademarkClearancePrompt.template).toContain('word|figurative|combined|3d|sound|other');
    });

    it('template includes distinctiveness assessment levels', () => {
      expect(trademarkClearancePrompt.template).toContain('inherently_distinctive|acquired_distinctiveness|descriptive|generic');
    });

    it('references Luật SHTT 2005 specific articles', () => {
      const t = trademarkClearancePrompt.template;
      expect(t).toContain('Điều 73');
      expect(t).toContain('Điều 74');
    });

    it('template includes first-to-file principle', () => {
      expect(trademarkClearancePrompt.template).toContain('FIRST-TO-FILE');
    });

    it('template includes 10-year protection term', () => {
      expect(trademarkClearancePrompt.template).toContain('10 năm');
    });

    it('template includes Nice classification reference', () => {
      expect(trademarkClearancePrompt.template).toContain('Nice');
    });

    it('output format is json_object', () => {
      expect(trademarkClearancePrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(trademarkClearancePrompt);
      expect(rendered).toContain('trademark');
      expect(rendered).toContain('PhapChe Pro');
      expect(rendered).not.toContain('{{matterType}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(trademarkClearancePrompt, {
        requestDescription: 'Dịch vụ tư vấn pháp lý online',
      });
      expect(rendered).toContain('Dịch vụ tư vấn pháp lý online');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(trademarkClearancePrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes filing strategy options', () => {
      expect(trademarkClearancePrompt.template).toContain('Madrid Protocol');
    });

    it('template references official fee regulation', () => {
      expect(trademarkClearancePrompt.template).toContain('Thông tư 263/2016/TT-BTC');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty mark name gracefully', () => {
      const rendered = renderSkill(trademarkClearancePrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(trademarkClearancePrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles multiple legal context items', () => {
      const rendered = renderSkill(trademarkClearancePrompt, {
        legalContext: [
          { source: 'Luật SHTT 2005', content: 'Điều 73 — Dấu hiệu không được bảo hộ' },
          { source: 'Luật SHTT 2005', content: 'Điều 74 — Khả năng phân biệt' },
        ],
      });
      expect(rendered).toContain('Điều 73');
      expect(rendered).toContain('Điều 74');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(trademarkClearancePrompt);
    });
  });
});

// ====================================================================
// 2. CEASE & DESIST DRAFTER
// ====================================================================

describe('cease-desist-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(ceaseDesistDrafterPrompt.skill).toBe('cease-desist-drafter');
    });

    it('has all required template variables', () => {
      expect(ceaseDesistDrafterPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = ceaseDesistDrafterPrompt.template;
      expect(t).toContain('"letterReference"');
      expect(t).toContain('"parties"');
      expect(t).toContain('"ipRight"');
      expect(t).toContain('"infringement"');
      expect(t).toContain('"demands"');
      expect(t).toContain('"legalRemedies"');
      expect(t).toContain('"settlementOffer"');
      expect(t).toContain('"letterContent"');
      expect(t).toContain('"summary"');
    });

    it('template includes IP right types', () => {
      expect(ceaseDesistDrafterPrompt.template).toContain(
        'trademark|copyright|patent|industrial_design|trade_secret|domain_name|other',
      );
    });

    it('template includes remedy categories', () => {
      const t = ceaseDesistDrafterPrompt.template;
      expect(t).toContain('"administrative"');
      expect(t).toContain('"civil"');
      expect(t).toContain('"criminal"');
    });

    it('references Vietnamese IP and civil procedure laws', () => {
      const t = ceaseDesistDrafterPrompt.template;
      expect(t).toContain('Luật SHTT');
      expect(t).toContain('BLTTDS 2015');
    });

    it('template includes enforcement authorities', () => {
      const t = ceaseDesistDrafterPrompt.template;
      expect(t).toContain('Thanh tra');
      expect(t).toContain('Quản lý thị trường');
    });

    it('template advises professional tone — not threatening', () => {
      expect(ceaseDesistDrafterPrompt.template).toContain('KHÔNG ĐE DỌA');
    });

    it('output format is json_object', () => {
      expect(ceaseDesistDrafterPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(ceaseDesistDrafterPrompt, {
        matterType: 'trademark_infringement',
        requestTitle: 'Công ty A — Chủ sở hữu nhãn hiệu ABC',
      });
      expect(rendered).toContain('trademark_infringement');
      expect(rendered).toContain('Công ty A');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(ceaseDesistDrafterPrompt, {
        requestDescription: 'Bên vi phạm sử dụng nhãn hiệu tương tự trên website',
      });
      expect(rendered).toContain('Bên vi phạm sử dụng nhãn hiệu tương tự');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(ceaseDesistDrafterPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes preliminary injunction reference', () => {
      expect(ceaseDesistDrafterPrompt.template).toContain('BPCKTT');
    });

    it('template includes standard 7-15 day response window', () => {
      expect(ceaseDesistDrafterPrompt.template).toContain('7-15');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty party name gracefully', () => {
      const rendered = renderSkill(ceaseDesistDrafterPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(ceaseDesistDrafterPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(ceaseDesistDrafterPrompt);
    });
  });
});

// ====================================================================
// 3. DEMAND LETTER DRAFTER
// ====================================================================

describe('demand-letter-drafter', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(demandLetterDrafterPrompt.skill).toBe('demand-letter-drafter');
    });

    it('has all required template variables', () => {
      expect(demandLetterDrafterPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = demandLetterDrafterPrompt.template;
      expect(t).toContain('"letterReference"');
      expect(t).toContain('"parties"');
      expect(t).toContain('"obligation"');
      expect(t).toContain('"amountDue"');
      expect(t).toContain('"breachTimeline"');
      expect(t).toContain('"previousCommunications"');
      expect(t).toContain('"evidence"');
      expect(t).toContain('"demands"');
      expect(t).toContain('"legalConsequences"');
      expect(t).toContain('"settlementOption"');
      expect(t).toContain('"letterContent"');
      expect(t).toContain('"summary"');
    });

    it('template includes obligation types', () => {
      expect(demandLetterDrafterPrompt.template).toContain(
        'payment|delivery|performance|warranty|indemnity|other',
      );
    });

    it('template references BLDS 2015 articles for interest calculation', () => {
      const t = demandLetterDrafterPrompt.template;
      expect(t).toContain('Điều 357');
      expect(t).toContain('Điều 468');
    });

    it('template references Luật Thương mại 2005 for penalties', () => {
      const t = demandLetterDrafterPrompt.template;
      expect(t).toContain('Điều 300');
      expect(t).toContain('Điều 301');
    });

    it('template includes 8% penalty cap for commercial contracts', () => {
      expect(demandLetterDrafterPrompt.template).toContain('8%');
    });

    it('template includes statute of limitations', () => {
      const t = demandLetterDrafterPrompt.template;
      expect(t).toContain('3 năm');
      expect(t).toContain('Điều 319');
    });

    it('template includes amount calculation breakdown', () => {
      const t = demandLetterDrafterPrompt.template;
      expect(t).toContain('"principal"');
      expect(t).toContain('"interest"');
      expect(t).toContain('"penalty"');
      expect(t).toContain('"totalDue"');
    });

    it('output format is json_object', () => {
      expect(demandLetterDrafterPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(demandLetterDrafterPrompt, {
        matterType: 'payment_dispute',
        requestTitle: 'Đòi nợ Công ty XYZ — Hợp đồng mua bán số 123',
      });
      expect(rendered).toContain('payment_dispute');
      expect(rendered).toContain('Công ty XYZ');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(demandLetterDrafterPrompt, {
        requestDescription: 'Đã quá hạn thanh toán 90 ngày',
      });
      expect(rendered).toContain('quá hạn thanh toán 90 ngày');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(demandLetterDrafterPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes mediation option', () => {
      expect(demandLetterDrafterPrompt.template).toContain('Hòa giải thương mại');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty creditor name gracefully', () => {
      const rendered = renderSkill(demandLetterDrafterPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(demandLetterDrafterPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });

    it('handles very long description', () => {
      const longDesc = 'D'.repeat(5000);
      const rendered = renderSkill(demandLetterDrafterPrompt, { requestDescription: longDesc });
      expect(rendered).toContain(longDesc);
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(demandLetterDrafterPrompt);
    });
  });
});

// ====================================================================
// 4. LITIGATION STRATEGIST
// ====================================================================

describe('litigation-strategist', () => {
  // ── Whitebox ──
  describe('whitebox', () => {
    it('has correct skill identifier', () => {
      expect(litigationStrategistPrompt.skill).toBe('litigation-strategist');
    });

    it('has all required template variables', () => {
      expect(litigationStrategistPrompt.requiredVariables).toEqual([
        'matterType', 'requestTitle', 'locale',
      ]);
    });

    it('template includes JSON output schema with key fields', () => {
      const t = litigationStrategistPrompt.template;
      expect(t).toContain('"caseSummary"');
      expect(t).toContain('"swotAnalysis"');
      expect(t).toContain('"legalAnalysis"');
      expect(t).toContain('"evidenceAssessment"');
      expect(t).toContain('"riskAssessment"');
      expect(t).toContain('"financialAnalysis"');
      expect(t).toContain('"strategyRecommendations"');
      expect(t).toContain('"proceduralSteps"');
      expect(t).toContain('"settlementStrategy"');
      expect(t).toContain('"summary"');
    });

    it('template includes SWOT analysis structure', () => {
      const t = litigationStrategistPrompt.template;
      expect(t).toContain('"strengths"');
      expect(t).toContain('"weaknesses"');
      expect(t).toContain('"opportunities"');
      expect(t).toContain('"threats"');
    });

    it('template includes evidence admissibility assessment', () => {
      expect(litigationStrategistPrompt.template).toContain('admissible|questionable|likely_inadmissible');
    });

    it('template includes 3-scenario risk projection', () => {
      const t = litigationStrategistPrompt.template;
      expect(t).toContain('"worstCase"');
      expect(t).toContain('"bestCase"');
      expect(t).toContain('"mostLikely"');
    });

    it('template includes dispute resolution methods', () => {
      expect(litigationStrategistPrompt.template).toContain('litigation|settlement|mediation|arbitration|negotiation');
    });

    it('template includes financial cost-benefit analysis', () => {
      const t = litigationStrategistPrompt.template;
      expect(t).toContain('"costBenefitAnalysis"');
      expect(t).toContain('"settlementRange"');
      expect(t).toContain('"courtFees"');
      expect(t).toContain('"attorneyFees"');
    });

    it('template references Vietnamese procedural law', () => {
      const t = litigationStrategistPrompt.template;
      expect(t).toContain('BLTTDS');
      expect(t).toContain('Tòa án');
    });

    it('template includes statute of limitations check', () => {
      expect(litigationStrategistPrompt.template).toContain('"statuteOfLimitations"');
      expect(litigationStrategistPrompt.template).toContain('"expiryDate"');
    });

    it('output format is json_object', () => {
      expect(litigationStrategistPrompt.outputFormat).toBe('json_object');
    });
  });

  // ── Blackbox ──
  describe('blackbox', () => {
    it('renders correctly with all required variables', () => {
      const rendered = renderSkill(litigationStrategistPrompt, {
        matterType: 'commercial_dispute',
        requestTitle: 'Tranh chấp hợp đồng xây dựng — Công ty X vs Công ty Y',
      });
      expect(rendered).toContain('commercial_dispute');
      expect(rendered).toContain('Công ty X');
      expect(rendered).not.toContain('{{matterType}}');
    });

    it('renders with optional description', () => {
      const rendered = renderSkill(litigationStrategistPrompt, {
        requestDescription: 'Tranh chấp về chất lượng công trình, giá trị 5 tỷ đồng',
      });
      expect(rendered).toContain('5 tỷ đồng');
    });

    it('renders in English locale', () => {
      const rendered = renderSkill(litigationStrategistPrompt, { locale: 'en' });
      expect(rendered).toContain('en');
    });

    it('template includes burden of proof analysis', () => {
      expect(litigationStrategistPrompt.template).toContain('"burdenOfProof"');
    });

    it('template emphasizes evidence as critical', () => {
      expect(litigationStrategistPrompt.template).toContain('CHỨNG CỨ LÀ VUA');
    });
  });

  // ── Abnormal ──
  describe('abnormal', () => {
    it('handles empty case name gracefully', () => {
      const rendered = renderSkill(litigationStrategistPrompt, { requestTitle: '' });
      expect(rendered.length).toBeGreaterThan(100);
    });

    it('handles missing optional fields', () => {
      const rendered = renderSkill(litigationStrategistPrompt, {
        requestDescription: undefined,
        legalContext: undefined,
      });
      expect(typeof rendered).toBe('string');
    });

    it('handles very long case description', () => {
      const longDesc = 'E'.repeat(5000);
      const rendered = renderSkill(litigationStrategistPrompt, { requestDescription: longDesc });
      expect(rendered).toContain(longDesc);
    });

    it('handles multiple legal context items', () => {
      const rendered = renderSkill(litigationStrategistPrompt, {
        legalContext: [
          { source: 'BLDS 2015', content: 'Điều 351 — Trách nhiệm dân sự do vi phạm nghĩa vụ' },
          { source: 'BLTTDS 2015', content: 'Điều 186 — Quyền khởi kiện' },
        ],
      });
      expect(rendered).toContain('Điều 351');
      expect(rendered).toContain('Điều 186');
    });
  });

  // ── Error ──
  describe('error', () => {
    it('template structure is valid', () => {
      validateTemplateStructure(litigationStrategistPrompt);
    });
  });
});
