/**
 * Document Issue Analyzer Tests — AI System Prompt
 *
 * Test categories: Whitebox, Blackbox, Abnormal, Error
 */

import { describe, it, expect } from 'vitest';
import { renderSystemPrompt, getSystemPrompt } from '../system-prompts';
import type { AgentSkill } from '../types';

const SKILL: AgentSkill = 'document-issue-analyzer';

const SAMPLE_DOCUMENT = `1| Điều 1: NỘI DUNG CÔNG VIỆC
2| Bên A giao cho Bên B thực hiện thiết kế website.
3|
4| Điều 2: THANH TOÁN
5| Bên A thanh toán 60 ngày sau khi nhận hóa đơn.
6|
7| Điều 3: BẢO HÀNH
8| Thời gian bảo hành 6 tháng kể từ ngày nghiệm thu.`;

// ── Whitebox Tests ─────────────────────────────────────────────

describe('Document Issue Analyzer — Whitebox', () => {
  it('renders prompt with line-numbered document content', () => {
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: SAMPLE_DOCUMENT,
      locale: 'vi',
    });

    // Verify the line-numbered content appears in the rendered prompt
    expect(rendered).toContain('Điều 1: NỘI DUNG CÔNG VIỆC');
    expect(rendered).toContain('1| Điều 1');
    expect(rendered).toContain('5| Bên A thanh toán');
  });

  it('has required variables documentContent and locale', () => {
    const tpl = getSystemPrompt(SKILL);
    expect(tpl.requiredVariables).toContain('documentContent');
    expect(tpl.requiredVariables).toContain('locale');
  });

  it('requires JSON output format', () => {
    const tpl = getSystemPrompt(SKILL);
    expect(tpl.outputFormat).toBe('json_object');
  });

  it('includes expected output JSON structure in prompt', () => {
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: SAMPLE_DOCUMENT,
      locale: 'vi',
    });

    // Verify JSON structure instructions
    expect(rendered).toContain('overallRisk');
    expect(rendered).toContain('findings');
    expect(rendered).toContain('lineStart');
    expect(rendered).toContain('lineEnd');
    expect(rendered).toContain('matchedText');
    expect(rendered).toContain('severity');
    expect(rendered).toContain('issue');
    expect(rendered).toContain('recommendation');
    expect(rendered).toContain('legalBasis');
  });

  it('includes instructions for strict JSON-only output', () => {
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: SAMPLE_DOCUMENT,
      locale: 'vi',
    });

    expect(rendered).toContain('TRẢ VỀ DUY NHẤT JSON');
  });
});

// ── Blackbox Tests ─────────────────────────────────────────────

describe('Document Issue Analyzer — Blackbox', () => {
  it('renders fully with a realistic 50-line contract document', () => {
    const bigDoc = Array.from({ length: 50 }, (_, i) => `${i + 1}| Dòng nội dung số ${i + 1} của hợp đồng.`).join('\n');

    const rendered = renderSystemPrompt(SKILL, {
      documentContent: bigDoc,
      locale: 'vi',
    });

    expect(rendered.length).toBeGreaterThan(3000);
    expect(rendered).toContain('Dòng nội dung số 50');
    expect(rendered).toContain('1| Dòng nội dung số 1');
  });

  it('uses locale in prompt for output language', () => {
    const renderedVi = renderSystemPrompt(SKILL, {
      documentContent: SAMPLE_DOCUMENT,
      locale: 'vi',
    });
    const renderedEn = renderSystemPrompt(SKILL, {
      documentContent: SAMPLE_DOCUMENT,
      locale: 'en',
    });

    expect(renderedVi).toContain('vi');
    expect(renderedEn).toContain('en');
  });

  it('generates distinct prompts for different locales', () => {
    const vi = renderSystemPrompt(SKILL, { documentContent: '1| test', locale: 'vi' });
    const en = renderSystemPrompt(SKILL, { documentContent: '1| test', locale: 'en' });

    // Both should be valid different prompts
    expect(vi).not.toBe(en);
    expect(vi.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
  });
});

// ── Abnormal Tests ─────────────────────────────────────────────

describe('Document Issue Analyzer — Abnormal', () => {
  it('handles empty documentContent gracefully', () => {
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: '',
      locale: 'vi',
    });

    // Should still render (prompt template exists)
    expect(rendered.length).toBeGreaterThan(0);
    // But should have no document content
    expect(rendered).not.toContain('1|');
  });

  it('handles very long single-line document', () => {
    const longLine = '1| ' + 'Điều khoản dài. '.repeat(500);
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: longLine,
      locale: 'vi',
    });

    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered).toContain('Điều khoản dài');
  });

  it('handles document with only whitespace lines', () => {
    const whitespaceDoc = '1| \n2|   \n3| \t \n4| ';
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: whitespaceDoc,
      locale: 'vi',
    });

    expect(rendered.length).toBeGreaterThan(0);
  });
});

// ── Error Tests ────────────────────────────────────────────────

describe('Document Issue Analyzer — Error', () => {
  it('throws when skill is not found for invalid skill key', () => {
    expect(() => getSystemPrompt('nonexistent-skill' as AgentSkill)).toThrow();
  });

  it('prompt is defined for document-issue-analyzer skill', () => {
    const tpl = getSystemPrompt(SKILL);
    expect(tpl).toBeDefined();
    expect(tpl.skill).toBe(SKILL);
    expect(tpl.template.length).toBeGreaterThan(100);
  });

  it('renders without legalContext (RAG disabled path)', () => {
    // When RAG is disabled or empty, the prompt should still render
    const rendered = renderSystemPrompt(SKILL, {
      documentContent: SAMPLE_DOCUMENT,
      locale: 'vi',
      legalContext: undefined,
    });

    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered).toContain('TÀI LIỆU CẦN RÀ SOÁT');
  });
});
