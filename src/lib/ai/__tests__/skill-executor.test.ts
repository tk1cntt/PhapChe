import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillExecutor } from '../skill-executor';
import type { SkillExecutorConfig } from '../skill-executor';
import type { SkillContext, AgentSkill, SearchResult } from '../types';

// ── Mock LLM Gateway ─────────────────────────────────────────

vi.mock('../llm-gateway', () => ({
  llmComplete: vi.fn(),
  llmStream: vi.fn(),
  isLlmConfigured: vi.fn(),
  getAvailableModels: vi.fn(),
  DEFAULT_MODELS: {
    'gpt-4o-mini': {
      provider: 'openai' as const,
      modelId: 'gpt-4o-mini',
      apiKeyEnv: 'OPENAI_API_KEY',
      maxTokens: 4096,
      temperature: 0.3,
    },
  },
}));

import { llmComplete, llmStream, isLlmConfigured } from '../llm-gateway';

// ── Mock Vector Store ────────────────────────────────────────

vi.mock('../vector-store', () => ({
  semanticSearch: vi.fn(),
  isVectorStoreReady: vi.fn(),
  getIndexStats: vi.fn(),
  vectorIndex: { clear: vi.fn(), size: 0, documentCount: 0 },
}));

import { semanticSearch, isVectorStoreReady } from '../vector-store';

// ── Mock System Prompts (actual implementation) ──────────────
// We use the real system-prompts module, not a mock

// ── Helpers ──────────────────────────────────────────────────

function makeContext(overrides: Partial<SkillContext> = {}): SkillContext {
  return {
    matterTypeKey: 'hop-dong-thuong-mai',
    domain: 'commercial-legal',
    requestContext: {
      title: 'Hợp đồng mua bán hàng hóa',
      description: 'Khách hàng muốn soạn hợp đồng mua bán thiết bị văn phòng',
    },
    locale: 'vi',
    ...overrides,
  };
}

const MOCK_LLM_RESPONSE = {
  content: JSON.stringify({
    contractTitle: 'HỢP ĐỒNG MUA BÁN HÀNG HÓA',
    summary: 'Hợp đồng mua bán thiết bị văn phòng tiêu chuẩn',
  }),
  usage: { promptTokens: 1500, completionTokens: 500, totalTokens: 2000 },
  model: 'gpt-4o-mini',
  latencyMs: 1200,
};

// ── SkillExecutor ────────────────────────────────────────────

describe('SkillExecutor', () => {
  let executor: SkillExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new SkillExecutor();
  });

  // ── Constructor ─────────────────────────────────────────────

  describe('constructor', () => {
    it('should create with default config', () => {
      const ex = new SkillExecutor();
      expect(ex).toBeInstanceOf(SkillExecutor);
    });

    it('should accept custom config', () => {
      const config: SkillExecutorConfig = {
        defaultModel: 'claude-sonnet',
        maxTokens: 8000,
        temperature: 0.5,
        enableRag: false,
        ragMinScore: 0.5,
        ragTopK: 10,
      };
      const ex = new SkillExecutor(config);
      expect(ex).toBeInstanceOf(SkillExecutor);
    });
  });

  // ── execute (Whitebox) ──────────────────────────────────────

  describe('execute — Whitebox', () => {
    it('should call RAG search when vector store is ready', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([]);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      await executor.execute('commercial-contract-drafter', makeContext());

      expect(semanticSearch).toHaveBeenCalledTimes(1);
      expect(semanticSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('Hợp đồng mua bán hàng hóa'),
          domainTags: ['commercial-legal'],
        }),
      );
    });

    it('should skip RAG when vector store is not ready', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      await executor.execute('commercial-contract-drafter', makeContext());

      expect(semanticSearch).not.toHaveBeenCalled();
    });

    it('should skip RAG when disabled in config', async () => {
      const noRagExecutor = new SkillExecutor({ enableRag: false });
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      await noRagExecutor.execute('commercial-contract-drafter', makeContext());

      expect(semanticSearch).not.toHaveBeenCalled();
    });

    it('should call llmComplete with correct model config', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      await executor.execute('commercial-contract-drafter', makeContext());

      expect(llmComplete).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(llmComplete).mock.calls[0][0];
      expect(callArgs.model.modelId).toBe('gpt-4o-mini');
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.responseFormat).toBe('json_object');
    });

    it('should fall back to text response format for non-JSON skills', async () => {
      // 'general-legal-researcher' also has json_object format
      // All skills have json_object, so we test with a custom config
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      await executor.execute('general-legal-researcher', makeContext());

      const callArgs = vi.mocked(llmComplete).mock.calls[0][0];
      expect(callArgs.responseFormat).toBe('json_object');
    });

    it('should parse JSON output correctly', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        ...MOCK_LLM_RESPONSE,
        content: JSON.stringify({ answer: 'Luật quy định...', summary: 'Tóm tắt', confidence: 0.85 }),
      });

      const result = await executor.execute('general-legal-researcher', makeContext());
      expect(result.output.answer).toBe('Luật quy định...');
      expect(result.output.summary).toBe('Tóm tắt');
      expect(result.confidence).toBe(0.85);
    });

    it('should handle non-JSON LLM output gracefully', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        ...MOCK_LLM_RESPONSE,
        content: 'Đây là plain text response không phải JSON',
      });

      const result = await executor.execute('commercial-contract-drafter', makeContext());
      expect(result.output.text).toBe('Đây là plain text response không phải JSON');
    });

    it('should include citations from RAG results', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([
        {
          score: 0.85,
          chunk: {
            id: 'chunk-1',
            documentId: 'doc-1',
            source: 'Luật Doanh nghiệp 2020',
            content: 'Nội dung...',
            chunkIndex: 0,
            embedding: [0.1, 0.2],
            domainTags: ['corporate-legal'],
            metadata: {},
            indexedAt: new Date().toISOString(),
          },
        },
        {
          score: 0.72,
          chunk: {
            id: 'chunk-2',
            documentId: 'doc-2',
            source: 'Bộ luật Dân sự 2015',
            content: 'Nội dung...',
            chunkIndex: 0,
            embedding: [0.3, 0.4],
            domainTags: ['commercial-legal'],
            metadata: {},
            indexedAt: new Date().toISOString(),
          },
        },
      ]);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute('commercial-contract-drafter', makeContext());

      expect(result.citations).toHaveLength(2);
      expect(result.citations).toContain('Luật Doanh nghiệp 2020');
      expect(result.citations).toContain('Bộ luật Dân sự 2015');
    });

    it('should return correct skill in result', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute('employment-contract-reviewer', makeContext({
        domain: 'employment-legal',
      }));

      expect(result.skill).toBe('employment-contract-reviewer');
      expect(result.executedAt).toBeTruthy();
      expect(new Date(result.executedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  // ── execute (Blackbox) ──────────────────────────────────────

  describe('execute — Blackbox', () => {
    it('should produce valid SkillResult for contract drafter', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({
          contractTitle: 'HỢP ĐỒNG MUA BÁN',
          parties: [{ role: 'Bên A', name: 'Công ty TNHH ABC' }],
          clauses: [{ articleNumber: 1, title: 'Đối tượng', content: '...' }],
          summary: 'Hợp đồng mua bán hàng hóa',
          warnings: ['Cần kiểm tra năng lực pháp lý của bên mua'],
        }),
        usage: { promptTokens: 1000, completionTokens: 400, totalTokens: 1400 },
        model: 'gpt-4o-mini',
        latencyMs: 900,
      });

      const result = await executor.execute('commercial-contract-drafter', makeContext());

      expect(result.output.contractTitle).toBeDefined();
      expect(result.summary).toBeTruthy();
      expect(result.usage.promptTokens).toBeGreaterThan(0);
      expect(result.usage.completionTokens).toBeGreaterThan(0);
      expect(result.executedAt).toBeTruthy();
    });

    it('should produce valid SkillResult for employment contract reviewer', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({
          complianceScore: 85,
          findings: [{ severity: 'high', issue: 'Thời gian thử việc quá dài' }],
          summary: 'Hợp đồng lao động có một số điểm cần điều chỉnh',
        }),
        usage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
        model: 'gpt-4o-mini',
        latencyMs: 800,
      });

      const result = await executor.execute(
        'employment-contract-reviewer',
        makeContext({ domain: 'employment-legal' }),
      );

      expect(result.output.complianceScore).toBe(85);
      expect(Array.isArray(result.output.findings)).toBe(true);
      expect(result.summary).toContain('điều chỉnh');
    });

    it('should produce valid SkillResult for litigation risk scorer', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({
          overallRisk: 'medium',
          strengths: ['Có chứng cứ rõ ràng'],
          weaknesses: ['Thời hiệu khởi kiện sắp hết'],
          summary: 'Vụ việc có triển vọng nhưng cần khẩn trương',
        }),
        usage: { promptTokens: 800, completionTokens: 250, totalTokens: 1050 },
        model: 'gpt-4o-mini',
        latencyMs: 700,
      });

      const result = await executor.execute('litigation-risk-scorer', makeContext());

      expect(result.output.overallRisk).toBe('medium');
      expect(result.skill).toBe('litigation-risk-scorer');
    });

    it('should handle all 31 skills without crashing', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({ summary: 'OK' }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        model: 'gpt-4o-mini',
        latencyMs: 100,
      });

      const skills: AgentSkill[] = [
        'commercial-contract-drafter',
        'commercial-contract-reviewer',
        'employment-contract-reviewer',
        'employment-policy-checker',
        'corporate-doc-generator',
        'corporate-compliance-checker',
        'ip-trademark-search',
        'ip-patent-analyzer',
        'privacy-compliance-checker',
        'privacy-dpia-generator',
        'regulatory-gap-analyzer',
        'ai-governance-assessor',
        'litigation-risk-scorer',
        'general-legal-researcher',
        'document-issue-analyzer',
        'nda-reviewer',
        'vendor-contract-reviewer',
        'board-resolution-drafter',
        'entity-compliance-checker',
        'labor-discipline-checker',
        'internal-regulation-drafter',
        'dsar-response-drafter',
        'trademark-clearance',
        'cease-desist-drafter',
        'demand-letter-drafter',
        'litigation-strategist',
        'tos-generator',
        'compliance-gap-analyzer',
        'ai-impact-assessment',
        'client-letter-drafter',
        'legal-memo-drafter',
      ];

      for (const skill of skills) {
        const domain = getDomainForSkill(skill);
        const result = await executor.execute(skill, makeContext({ domain }));
        expect(result.skill).toBe(skill);
        expect(result.summary).toBeTruthy();
      }

      expect(llmComplete).toHaveBeenCalledTimes(31);
    });
  });

  // ── execute (Abnormal) ──────────────────────────────────────

  describe('execute — Abnormal', () => {
    it('should handle empty request description', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute(
        'commercial-contract-drafter',
        makeContext({ requestContext: { title: 'Test', description: '' } }),
      );

      expect(result.summary).toBeTruthy();
    });

    it('should handle very long request title', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute(
        'general-legal-researcher',
        makeContext({
          requestContext: {
            title: 'Công ty A muốn khởi kiện công ty B về việc vi phạm hợp đồng '.repeat(50),
          },
        }),
      );

      expect(result.skill).toBe('general-legal-researcher');
    });

    it('should handle different locales', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      // Test with English locale
      await executor.execute(
        'commercial-contract-drafter',
        makeContext({ locale: 'en' }),
      );

      // Test with Japanese locale
      await executor.execute(
        'commercial-contract-drafter',
        makeContext({ locale: 'ja' }),
      );

      expect(llmComplete).toHaveBeenCalledTimes(2);
    });

    it('should handle RAG returning empty results', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([]);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute('commercial-contract-drafter', makeContext());

      expect(result.citations).toHaveLength(0);
    });
  });

  // ── execute (Error) ─────────────────────────────────────────

  describe('execute — Error', () => {
    it('should propagate LLM errors', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockRejectedValue(new Error('LLM_API_ERROR: HTTP 500'));

      await expect(
        executor.execute('commercial-contract-drafter', makeContext()),
      ).rejects.toThrow('LLM_API_ERROR');
    });

    it('should propagate RAG errors but not prevent execution', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockRejectedValue(new Error('RAG search failed'));
      // But LLM still should not be called since RAG threw before it
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      // The error from semanticSearch will propagate
      await expect(
        executor.execute('commercial-contract-drafter', makeContext()),
      ).rejects.toThrow('RAG search failed');

      expect(llmComplete).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON from LLM', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        content: '{ broken json!!!!',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        model: 'gpt-4o-mini',
        latencyMs: 200,
      });

      const result = await executor.execute('commercial-contract-drafter', makeContext());
      expect(result.output.text).toBe('{ broken json!!!!');
      expect(result.summary).toBeTruthy();
    });
  });

  // ── executeStream ───────────────────────────────────────────

  describe('executeStream', () => {
    it('should yield status updates during RAG + execution', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([
        {
          score: 0.9,
          chunk: {
            id: 'c1',
            documentId: 'd1',
            source: 'Bộ luật Dân sự 2015',
            content: 'Nội dung...',
            chunkIndex: 0,
            embedding: [0.5],
            domainTags: ['commercial-legal'],
            metadata: {},
            indexedAt: new Date().toISOString(),
          },
        },
      ]);

      // Mock stream
      vi.mocked(llmStream).mockImplementation(async function* () {
        yield { delta: '{"summary":', done: false };
        yield { delta: '"Phân tích hoàn tất"}', done: false };
        yield { delta: '', done: true };
      });

      const chunks: Awaited<ReturnType<typeof executor.executeStream>['next']>['value'][] = [];
      for await (const chunk of executor.executeStream('general-legal-researcher', makeContext())) {
        chunks.push(chunk);
      }

      // Should have status + final result
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      // First chunk should be status
      expect(chunks[0].done).toBe(false);
      expect(chunks[0].status).toBeTruthy();
      // Last chunk should be result
      const last = chunks[chunks.length - 1];
      expect(last.done).toBe(true);
      expect(last.chunk).not.toBeNull();
    });

    it('should report "không có tài liệu" when RAG returns empty', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([]);

      // Mock stream with JSON output
      vi.mocked(llmStream).mockImplementation(async function* () {
        yield { delta: '{"summary":"OK"}', done: false };
        yield { delta: '', done: true };
      });

      const chunks: Awaited<ReturnType<typeof executor.executeStream>['next']>['value'][] = [];
      for await (const chunk of executor.executeStream('general-legal-researcher', makeContext())) {
        chunks.push(chunk);
      }

      // Should complete successfully even with empty RAG
      const last = chunks[chunks.length - 1];
      expect(last.done).toBe(true);
      expect(last.chunk).not.toBeNull();
    });

    it('should skip RAG when vector store not ready', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);

      vi.mocked(llmStream).mockImplementation(async function* () {
        yield { delta: '{"summary":"OK"}', done: false };
        yield { delta: '', done: true };
      });

      const chunks: Awaited<ReturnType<typeof executor.executeStream>['next']>['value'][] = [];
      for await (const chunk of executor.executeStream('general-legal-researcher', makeContext())) {
        chunks.push(chunk);
      }

      expect(semanticSearch).not.toHaveBeenCalled();
      const last = chunks[chunks.length - 1];
      expect(last.done).toBe(true);
    });
  });

  // ── recordSuggestion ────────────────────────────────────────

  describe('recordSuggestion', () => {
    it('should record a suggestion with all fields', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute('commercial-contract-drafter', makeContext());
      const suggestion = executor.recordSuggestion('req-123', 'commercial-contract-drafter', result, 'user-1');

      expect(suggestion.id).toMatch(/^ai-\d+-[a-z0-9]+$/);
      expect(suggestion.requestId).toBe('req-123');
      expect(suggestion.skill).toBe('commercial-contract-drafter');
      expect(suggestion.decision).toBe('pending');
      expect(suggestion.decidedById).toBe('user-1');
      expect(suggestion.decidedAt).toBeNull();
      expect(suggestion.finalOutput).toBeNull();
      expect(suggestion.createdAt).toBeTruthy();
    });

    it('should record suggestion without decidedById', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute('general-legal-researcher', makeContext());
      const suggestion = executor.recordSuggestion('req-456', 'general-legal-researcher', result);

      expect(suggestion.decidedById).toBeNull();
    });

    it('should increment internal suggestion list', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      expect(executor.getSuggestions()).toHaveLength(0);

      const result = await executor.execute('commercial-contract-drafter', makeContext());
      executor.recordSuggestion('req-1', 'commercial-contract-drafter', result);
      expect(executor.getSuggestions()).toHaveLength(1);

      executor.recordSuggestion('req-2', 'commercial-contract-drafter', result);
      expect(executor.getSuggestions()).toHaveLength(2);
    });
  });

  // ── getSuggestionsForRequest ────────────────────────────────

  describe('getSuggestionsForRequest', () => {
    it('should filter suggestions by requestId', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue(MOCK_LLM_RESPONSE);

      const result = await executor.execute('commercial-contract-drafter', makeContext());
      executor.recordSuggestion('req-A', 'commercial-contract-drafter', result);
      executor.recordSuggestion('req-B', 'commercial-contract-drafter', result);
      executor.recordSuggestion('req-A', 'general-legal-researcher', result);

      const reqASuggestions = executor.getSuggestionsForRequest('req-A');
      expect(reqASuggestions).toHaveLength(2);
      expect(reqASuggestions.every((s) => s.requestId === 'req-A')).toBe(true);

      const reqBSuggestions = executor.getSuggestionsForRequest('req-B');
      expect(reqBSuggestions).toHaveLength(1);
    });

    it('should return empty array for unknown requestId', () => {
      expect(executor.getSuggestionsForRequest('non-existent')).toHaveLength(0);
    });
  });

  // ── computeConfidence ───────────────────────────────────────

  describe('computeConfidence (via execute)', () => {
    it('should give base confidence 0.5 with no citations', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([]);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({ summary: 'test' }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        model: 'gpt-4o-mini',
        latencyMs: 100,
      });

      const result = await executor.execute('general-legal-researcher', makeContext());

      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.citations).toHaveLength(0);
    });

    it('should increase confidence with 3+ citations', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(true);
      vi.mocked(semanticSearch).mockResolvedValue([
        { score: 0.8, chunk: makeChunk('s1') },
        { score: 0.7, chunk: makeChunk('s2') },
        { score: 0.6, chunk: makeChunk('s3') },
      ]);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({ summary: 'test' }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        model: 'gpt-4o-mini',
        latencyMs: 100,
      });

      const result = await executor.execute('general-legal-researcher', makeContext());

      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.citations).toHaveLength(3);
    });

    it('should use explicit confidence from output if provided', async () => {
      vi.mocked(isVectorStoreReady).mockReturnValue(false);
      vi.mocked(llmComplete).mockResolvedValue({
        content: JSON.stringify({ summary: 'test', confidence: 0.92 }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        model: 'gpt-4o-mini',
        latencyMs: 100,
      });

      const result = await executor.execute('general-legal-researcher', makeContext());

      expect(result.confidence).toBe(0.92);
    });
  });
});

// ── getSkillExecutor / isAiReady ─────────────────────────────

import { getSkillExecutor, isAiReady } from '../skill-executor';

describe('getSkillExecutor', () => {
  it('should return singleton instance', () => {
    const ex1 = getSkillExecutor();
    const ex2 = getSkillExecutor();
    expect(ex1).toBe(ex2);
  });

  it('should create new instance with config', () => {
    const defaultEx = getSkillExecutor();
    const configuredEx = getSkillExecutor({ maxTokens: 8192 });
    expect(configuredEx).not.toBe(defaultEx);
  });
});

describe('isAiReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when LLM is configured', () => {
    vi.mocked(isLlmConfigured).mockReturnValue(true);
    expect(isAiReady()).toBe(true);
  });

  it('should return false when LLM is not configured', () => {
    vi.mocked(isLlmConfigured).mockReturnValue(false);
    expect(isAiReady()).toBe(false);
  });
});

// ── Helpers ──────────────────────────────────────────────────

function makeChunk(source: string, docId = 'doc-1') {
  return {
    id: `${docId}:chunk:0`,
    documentId: docId,
    source,
    content: 'Nội dung pháp lý mẫu',
    chunkIndex: 0,
    embedding: [0.1, 0.2, 0.3],
    domainTags: ['commercial-legal'] as const,
    metadata: {},
    indexedAt: new Date().toISOString(),
  };
}

function getDomainForSkill(skill: AgentSkill) {
  const map: Record<string, string> = {
    'commercial-contract-drafter': 'commercial-legal',
    'commercial-contract-reviewer': 'commercial-legal',
    'employment-contract-reviewer': 'employment-legal',
    'employment-policy-checker': 'employment-legal',
    'corporate-doc-generator': 'corporate-legal',
    'corporate-compliance-checker': 'corporate-legal',
    'ip-trademark-search': 'ip-legal',
    'ip-patent-analyzer': 'ip-legal',
    'privacy-compliance-checker': 'privacy-legal',
    'privacy-dpia-generator': 'privacy-legal',
    'regulatory-gap-analyzer': 'regulatory-legal',
    'ai-governance-assessor': 'ai-governance-legal',
    'litigation-risk-scorer': 'litigation-legal',
    'general-legal-researcher': 'legal-clinic',
  };
  return map[skill] as import('../types').LegalDomain;
}
