import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Mocks ────────────────────────────────────────────────────

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      // These are the actual i18n keys we reference
    };
    return map[key] ?? key;
  },
}));

// Skip these tests if next-intl context is missing (render will use the mock)
// We test unit-level behavior

// ── AiSkillSelector ─────────────────────────────────────────

import { AiSkillSelector } from '../AiSkillSelector';

describe('AiSkillSelector', () => {
  describe('Whitebox', () => {
    it('should render domain groups', () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error - render in test context
        <AiSkillSelector onSelect={onSelect} />,
      );

      // Should show domain buttons
      const commercialBtn = screen.getByTestId('skill-domain-commercial-legal');
      expect(commercialBtn).toBeTruthy();
    });

    it('should expand domain on click', async () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} />,
      );

      const btn = screen.getByTestId('skill-domain-commercial-legal');
      fireEvent.click(btn);

      // Skills list should appear
      await waitFor(() => {
        expect(screen.getByTestId('skill-list-commercial-legal')).toBeTruthy();
      });
    });

    it('should collapse domain on second click', async () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} />,
      );

      const btn = screen.getByTestId('skill-domain-commercial-legal');
      fireEvent.click(btn); // open
      fireEvent.click(btn); // close

      await waitFor(() => {
        expect(screen.queryByTestId('skill-list-commercial-legal')).toBeNull();
      });
    });

    it('should call onSelect with skill and domain when skill clicked', async () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} defaultDomain="commercial-legal" />,
      );

      // Domain should be auto-expanded
      const skillBtn = screen.getByTestId('skill-item-commercial-contract-drafter');
      fireEvent.click(skillBtn);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('commercial-contract-drafter', 'commercial-legal');
    });

    it('should auto-expand defaultDomain', () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} defaultDomain="employment-legal" />,
      );

      expect(screen.getByTestId('skill-list-employment-legal')).toBeTruthy();
    });

    it('should disable all buttons when disabled', () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} disabled />,
      );

      const btns = document.querySelectorAll('button[disabled]');
      // At least some buttons should be disabled
      expect(btns.length).toBeGreaterThan(0);
    });

    it('should show loading spinner for executingSkill', async () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector
          onSelect={onSelect}
          defaultDomain="commercial-legal"
          executingSkill="commercial-contract-drafter"
        />,
      );

      const skillItem = screen.getByTestId('skill-item-commercial-contract-drafter');
      expect(skillItem.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Blackbox', () => {
    it('should display all 14 skills across domains when each expanded', () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} />,
      );

      // Only one domain expanded at a time — verify each domain group exists
      // Only 9 of 13 domains have skills assigned (the other 4 have no skills = not rendered)
      const domainIds = [
        'commercial-legal', 'corporate-legal', 'employment-legal',
        'privacy-legal', 'regulatory-legal',
        'ai-governance-legal', 'ip-legal', 'litigation-legal', 'legal-clinic',
      ];

      let totalSkills = 0;
      for (const domain of domainIds) {
        const btn = screen.getByTestId(`skill-domain-${domain}`);
        fireEvent.click(btn);
        const skills = document.querySelectorAll('[data-testid^="skill-item-"]');
        totalSkills += skills.length;
      }

      // 14 total skill items across all domains
      expect(totalSkills).toBe(14);
    });

    it('should only expand one domain at a time', async () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} />,
      );

      fireEvent.click(screen.getByTestId('skill-domain-commercial-legal'));
      expect(screen.getByTestId('skill-list-commercial-legal')).toBeTruthy();

      fireEvent.click(screen.getByTestId('skill-domain-employment-legal'));
      // Commercial should collapse, employment expands
      await waitFor(() => {
        expect(screen.queryByTestId('skill-list-commercial-legal')).toBeNull();
        expect(screen.getByTestId('skill-list-employment-legal')).toBeTruthy();
      });
    });
  });

  describe('Abnormal', () => {
    it('should handle undefined defaultDomain gracefully', () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} defaultDomain={undefined} />,
      );

      // Should render without crash
      expect(screen.getByTestId('ai-skill-selector')).toBeTruthy();
    });

    it('should handle rapid double-clicks on skill', async () => {
      const onSelect = vi.fn();
      render(
        // @ts-expect-error
        <AiSkillSelector onSelect={onSelect} defaultDomain="commercial-legal" />,
      );

      const skillBtn = screen.getByTestId('skill-item-commercial-contract-drafter');
      fireEvent.click(skillBtn);
      fireEvent.click(skillBtn);

      // Should call twice
      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error', () => {
    it('should not crash when onSelect throws', async () => {
      const onSelect = vi.fn().mockImplementation(() => {
        throw new Error('select error');
      });

      expect(() =>
        render(
          // @ts-expect-error
          <AiSkillSelector onSelect={onSelect} defaultDomain="commercial-legal" />,
        ),
      ).not.toThrow();
    });
  });
});

// ── AiResultCard ─────────────────────────────────────────────

import { AiResultCard } from '../AiResultCard';
import type { SkillResult, AgentSkill } from '@/lib/ai/types';

const makeResult = (overrides: Partial<SkillResult> = {}): SkillResult => ({
  output: { summary: 'Test output' },
  summary: 'Đây là tóm tắt kết quả AI',
  citations: ['Bộ luật Dân sự 2015 — Điều 117'],
  confidence: 0.75,
  usage: { promptTokens: 100, completionTokens: 50 },
  skill: 'general-legal-researcher' as AgentSkill,
  executedAt: new Date().toISOString(),
  ...overrides,
});

describe('AiResultCard', () => {
  describe('Whitebox', () => {
    it('should render result with summary and confidence', () => {
      const result = makeResult();
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" />,
      );

      expect(screen.getByTestId('ai-result-card')).toBeTruthy();
      expect(screen.getByText('Đây là tóm tắt kết quả AI')).toBeTruthy();
      expect(screen.getByTestId('ai-result-confidence')).toBeTruthy();
      expect(screen.getByText(/Độ tin cậy/)).toBeTruthy();
    });

    it('should show loading state', () => {
      const result = makeResult();
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" loading />,
      );

      expect(screen.getByTestId('ai-result-loading')).toBeTruthy();
    });

    it('should show error state', () => {
      const result = makeResult();
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" error="API key missing" />,
      );

      expect(screen.getByTestId('ai-result-error')).toBeTruthy();
      expect(screen.getByText('API key missing')).toBeTruthy();
    });

    it('should toggle collapse on header click', () => {
      const result = makeResult();
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" />,
      );

      const toggle = screen.getByTestId('ai-result-toggle');
      // Initially expanded → body visible
      expect(screen.getByTestId('ai-result-body')).toBeTruthy();

      fireEvent.click(toggle);
      // Collapsed → body hidden
      expect(screen.queryByTestId('ai-result-body')).toBeNull();

      fireEvent.click(toggle);
      // Re-expanded
      expect(screen.getByTestId('ai-result-body')).toBeTruthy();
    });

    it('should call onApply when apply button clicked', () => {
      const onApply = vi.fn();
      const result = makeResult();
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" onApply={onApply} />,
      );

      fireEvent.click(screen.getByTestId('ai-result-apply'));
      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onApply).toHaveBeenCalledWith(result);
    });

    it('should not show apply button without onApply', () => {
      const result = makeResult();
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" />,
      );

      expect(screen.queryByTestId('ai-result-apply')).toBeNull();
    });

    it('should display citations', () => {
      const result = makeResult({
        citations: ['Luật DN 2020 — Điều 27', 'Bộ luật Dân sự 2015 — Điều 401'],
      });
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" />,
      );

      // Citations are rendered with emoji prefix in rounded badges
      const citationsContainer = document.querySelector('[data-testid="ai-result-card"]');
      expect(citationsContainer?.textContent).toContain('Luật DN 2020');
      expect(citationsContainer?.textContent).toContain('Điều 401');
    });
  });

  describe('Blackbox', () => {
    it('should render contract skill output with clauses', () => {
      const result = makeResult({
        skill: 'commercial-contract-drafter',
        output: {
          contractTitle: 'HỢP ĐỒNG MUA BÁN',
          parties: [{ role: 'Bên A', name: 'Công ty ABC' }],
          clauses: [{ articleNumber: 1, title: 'Đối tượng', content: 'Nội dung', legalBasis: 'Điều 385 Bộ luật Dân sự 2015' }],
          warnings: ['Kiểm tra năng lực pháp lý'],
          summary: 'Hợp đồng mua bán tiêu chuẩn',
        },
      });
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="commercial-contract-drafter" />,
      );

      expect(screen.getByText('HỢP ĐỒNG MUA BÁN')).toBeTruthy();
      expect(screen.getByText('Công ty ABC')).toBeTruthy();
    });

    it('should render review skill output with findings', () => {
      const result = makeResult({
        skill: 'commercial-contract-reviewer',
        output: {
          overallRisk: 'high',
          findings: [{
            severity: 'high',
            issue: 'Điều khoản phạt vi phạm vượt quy định',
            recommendation: 'Giảm mức phạt xuống',
            legalBasis: 'Điều 418 Bộ luật Dân sự 2015',
          }],
          summary: 'Hợp đồng có rủi ro cao',
        },
      });
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="commercial-contract-reviewer" />,
      );

      expect(screen.getByText('Điều khoản phạt vi phạm vượt quy định')).toBeTruthy();
    });

    it('should render compliance output with score', () => {
      const result = makeResult({
        skill: 'corporate-compliance-checker',
        output: {
          complianceScore: 72,
          gaps: [{
            severity: 'high',
            area: 'Báo cáo thuế',
            action: 'Nộp tờ khai thuế quý 2',
            legalBasis: 'Luật Quản lý thuế',
          }],
          summary: 'Còn nhiều điểm chưa tuân thủ',
        },
      });
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="corporate-compliance-checker" />,
      );

      // "Điểm tuân thủ: 72/100" — split across elements
      const body = screen.getByTestId('ai-result-body');
      expect(body.textContent).toContain('72');
      expect(body.textContent).toContain('100');
    });
  });

  describe('Abnormal', () => {
    it('should handle empty output', () => {
      const result = makeResult({ output: {}, summary: '' });
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" />,
      );

      // Should render without crash
      expect(screen.getByTestId('ai-result-card')).toBeTruthy();
    });

    it('should handle confidence extremes', () => {
      const low = makeResult({ confidence: 0.1 });
      const high = makeResult({ confidence: 0.95 });

      const { rerender } = render(
        // @ts-expect-error
        <AiResultCard result={low} skill="general-legal-researcher" />,
      );
      expect(screen.getByText(/10%/)).toBeTruthy();

      rerender(
        // @ts-expect-error
        <AiResultCard result={high} skill="general-legal-researcher" />,
      );
      expect(screen.getByText(/95%/)).toBeTruthy();
    });

    it('should handle very long summary text', () => {
      const result = makeResult({
        summary: 'A'.repeat(5000),
      });
      render(
        // @ts-expect-error
        <AiResultCard result={result} skill="general-legal-researcher" />,
      );

      expect(screen.getByTestId('ai-result-card')).toBeTruthy();
    });
  });
});

// ── AiAssistantPanel ─────────────────────────────────────────

import { AiAssistantPanel } from '../AiAssistantPanel';

describe('AiAssistantPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Whitebox', () => {
    it('should render toggle button', () => {
      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      expect(screen.getByTestId('ai-assistant-toggle')).toBeTruthy();
    });

    it('should expand panel on click', () => {
      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      expect(screen.getByTestId('ai-assistant-body')).toBeTruthy();
      expect(screen.getByTestId('ai-assistant-empty')).toBeTruthy();
    });

    it('should show empty state when nothing selected', () => {
      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      expect(screen.getByText('Chọn một kỹ năng AI để bắt đầu phân tích')).toBeTruthy();
    });

    it('should show executing state when skill is running', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      // Open the panel
      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      // Expand a domain to see skills
      fireEvent.click(screen.getByTestId('skill-domain-commercial-legal'));
      // Select a skill
      const skillBtn = screen.getByTestId('skill-item-commercial-contract-drafter');
      fireEvent.click(skillBtn);

      await waitFor(() => {
        expect(screen.getByTestId('ai-assistant-executing')).toBeTruthy();
      });
    });

    it('should call fetch with correct body', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: makeResult() }),
      });

      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-123" requestTitle="Test Request" />,
      );

      // Open panel, expand domain, then click skill
      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      fireEvent.click(screen.getByTestId('skill-domain-commercial-legal'));
      fireEvent.click(screen.getByTestId('skill-item-commercial-contract-drafter'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/analyze', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ requestId: 'req-123', skill: 'commercial-contract-drafter' }),
        }));
      });
    });
  });

  describe('Blackbox', () => {
    it('should display result after successful AI call', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: makeResult({
            skill: 'commercial-contract-drafter',
            summary: 'Kết quả phân tích hợp đồng',
            output: { contractTitle: 'Hợp đồng test' },
          }),
        }),
      });

      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      fireEvent.click(screen.getByTestId('skill-domain-commercial-legal'));
      fireEvent.click(screen.getByTestId('skill-item-commercial-contract-drafter'));

      await waitFor(() => {
        expect(screen.getByText('Kết quả phân tích hợp đồng')).toBeTruthy();
      });
    });
  });

  describe('Abnormal', () => {
    it('should handle fetch error gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      fireEvent.click(screen.getByTestId('skill-domain-commercial-legal'));
      fireEvent.click(screen.getByTestId('skill-item-commercial-contract-drafter'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-assistant-error')).toBeTruthy();
      });
    });

    it('should handle API error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'AI_NOT_CONFIGURED' }),
      });

      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" />,
      );

      fireEvent.click(screen.getByTestId('ai-assistant-toggle'));
      fireEvent.click(screen.getByTestId('skill-domain-commercial-legal'));
      fireEvent.click(screen.getByTestId('skill-item-commercial-contract-drafter'));

      await waitFor(() => {
        expect(screen.getByText(/AI chưa được cấu hình/)).toBeTruthy();
      });
    });
  });

  describe('Error', () => {
    it('should handle null matterTypeKey', () => {
      render(
        // @ts-expect-error
        <AiAssistantPanel requestId="req-1" requestTitle="Test" matterTypeKey={null} />,
      );

      expect(screen.getByTestId('ai-assistant-toggle')).toBeTruthy();
    });
  });
});
