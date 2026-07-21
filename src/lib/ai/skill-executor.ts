/**
 * Skill Executor — Core engine to run AI agent skills
 *
 * Orchestrates: RAG retrieval → system prompt rendering → LLM call → audit trail
 * Each skill execution is traceable with AiSuggestion records.
 */

import type {
  AgentSkill,
  SkillContext,
  SkillResult,
  SkillResultStream,
  AiSuggestion,
  ChatMessage,
  SearchResult,
  LegalDomain,
} from './types';
import { DOMAIN_SKILL_MAP as DEFAULT_DOMAIN_SKILL_MAP } from './types';
import { llmComplete, llmStream, isLlmConfigured, DEFAULT_MODELS } from './llm-gateway';
import { semanticSearch, isVectorStoreReady } from './vector-store';
import { renderSystemPrompt, getSystemPrompt, getSkillsForDomain } from './system-prompts';

// ── Configuration ───────────────────────────────────────────

export interface SkillExecutorConfig {
  /** Default model to use (falls back to gpt-4o-mini) */
  defaultModel?: string;
  /** Max tokens for skill execution */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Whether to perform RAG search before execution */
  enableRag?: boolean;
  /** Min similarity score for RAG results */
  ragMinScore?: number;
  /** Max RAG results to include */
  ragTopK?: number;
  /** Domain → skills mapping (defaults to types.ts) */
  domainSkillMap?: Record<string, AgentSkill[]>;
}

/** Default model from env, falls back to gpt-4o-mini */
const ENV_DEFAULT_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini';

const DEFAULT_CONFIG: Required<SkillExecutorConfig> = {
  defaultModel: ENV_DEFAULT_MODEL,
  maxTokens: 4096,
  temperature: 0.3,
  enableRag: true,
  ragMinScore: 0.3,
  ragTopK: 5,
  domainSkillMap: DEFAULT_DOMAIN_SKILL_MAP as unknown as Record<string, AgentSkill[]>,
};

// ── Executor ────────────────────────────────────────────────

export class SkillExecutor {
  private config: Required<SkillExecutorConfig>;
  private suggestions: AiSuggestion[] = [];

  constructor(config: SkillExecutorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute an agent skill synchronously (returns full result).
   */
  async execute(skill: AgentSkill, context: SkillContext): Promise<SkillResult> {
    const model = DEFAULT_MODELS[this.config.defaultModel] ?? DEFAULT_MODELS['gpt-4o-mini'];

    // 1. RAG — get legal context
    let legalContext: SearchResult[] = [];
    if (this.config.enableRag && isVectorStoreReady()) {
      legalContext = await semanticSearch({
        query: `${context.requestContext.title} ${context.requestContext.description ?? ''}`,
        domainTags: [context.domain],
        topK: this.config.ragTopK,
        minScore: this.config.ragMinScore,
      });
    }

    // 2. Render system prompt
    const systemPrompt = renderSystemPrompt(skill, {
      matterType: context.matterTypeKey,
      requestTitle: context.requestContext.title,
      requestDescription: context.requestContext.description ?? '',
      documentContent: context.requestContext.documentContent ?? '',
      locale: context.locale,
      legalContext: legalContext.map((r) => ({
        source: r.chunk.source,
        content: r.chunk.content,
        score: r.score.toFixed(2),
      })),
    });

    const promptTpl = getSystemPrompt(skill);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Hãy thực hiện nhiệm vụ: ${promptTpl.description}` },
    ];

    // 3. Call LLM
    const response = await llmComplete({
      model,
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      responseFormat: promptTpl.outputFormat === 'json_object' ? 'json_object' : 'text',
    });

    // 4. Parse output
    let output: Record<string, unknown>;
    try {
      output = JSON.parse(response.content);
    } catch {
      output = { text: response.content };
    }

    // 5. Build citations
    const citations = legalContext.map((r) => r.chunk.source);

    const result: SkillResult = {
      output,
      summary: (output.summary as string) ?? (output.answer as string) ?? response.content.slice(0, 200),
      citations,
      confidence: this.computeConfidence(citations.length, output),
      usage: {
        promptTokens: response.usage?.promptTokens ?? 0,
        completionTokens: response.usage?.completionTokens ?? 0,
      },
      skill,
      executedAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Execute an agent skill with streaming (yields partial results).
   */
  async *executeStream(skill: AgentSkill, context: SkillContext): AsyncGenerator<SkillResultStream> {
    const model = DEFAULT_MODELS[this.config.defaultModel] ?? DEFAULT_MODELS['gpt-4o-mini'];

    // RAG
    let legalContext: SearchResult[] = [];
    if (this.config.enableRag && isVectorStoreReady()) {
      yield { chunk: null, status: 'Đang tra cứu cơ sở dữ liệu pháp lý...', done: false };
      legalContext = await semanticSearch({
        query: `${context.requestContext.title} ${context.requestContext.description ?? ''}`,
        domainTags: [context.domain],
        topK: this.config.ragTopK,
        minScore: this.config.ragMinScore,
      });
      if (legalContext.length > 0) {
        yield { chunk: null, status: `Tìm thấy ${legalContext.length} tài liệu pháp lý liên quan`, done: false };
      }
    }

    // Render prompt
    const systemPrompt = renderSystemPrompt(skill, {
      matterType: context.matterTypeKey,
      requestTitle: context.requestContext.title,
      requestDescription: context.requestContext.description ?? '',
      documentContent: context.requestContext.documentContent ?? '',
      locale: context.locale,
      legalContext: legalContext.map((r) => ({
        source: r.chunk.source,
        content: r.chunk.content,
        score: r.score.toFixed(2),
      })),
    });

    const promptTpl = getSystemPrompt(skill);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Hãy thực hiện nhiệm vụ: ${promptTpl.description}` },
    ];

    // Stream
    yield { chunk: null, status: 'Đang phân tích...', done: false };

    let fullContent = '';
    for await (const chunk of llmStream({
      model,
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      responseFormat: 'text', // Streaming doesn't support JSON mode
    })) {
      fullContent += chunk.delta;
      if (chunk.done) break;
    }

    // Parse final result
    let output: Record<string, unknown>;
    try {
      output = JSON.parse(fullContent);
    } catch {
      output = { text: fullContent };
    }

    const citations = legalContext.map((r) => r.chunk.source);
    const result: SkillResult = {
      output,
      summary: (output.summary as string) ?? fullContent.slice(0, 200),
      citations,
      confidence: this.computeConfidence(citations.length, output),
      usage: { promptTokens: 0, completionTokens: 0 }, // Streaming doesn't return usage
      skill,
      executedAt: new Date().toISOString(),
    };

    yield { chunk: result, status: 'Hoàn tất phân tích', done: true };
  }

  /**
   * Record an AI suggestion for audit trail.
   */
  recordSuggestion(
    requestId: string,
    skill: AgentSkill,
    result: SkillResult,
    decidedById?: string,
  ): AiSuggestion {
    const suggestion: AiSuggestion = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requestId,
      skill,
      aiOutput: JSON.stringify(result.output),
      finalOutput: null,
      decision: 'pending',
      decidedById: decidedById ?? null,
      decisionNotes: null,
      citations: result.citations,
      model: this.config.defaultModel,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        latencyMs: 0, // TODO: track latency
      },
      createdAt: result.executedAt,
      decidedAt: null,
    };

    this.suggestions.push(suggestion);
    return suggestion;
  }

  /** Get all suggestions recorded in this session */
  getSuggestions(): AiSuggestion[] {
    return [...this.suggestions];
  }

  /** Get suggestions for a specific request */
  getSuggestionsForRequest(requestId: string): AiSuggestion[] {
    return this.suggestions.filter((s) => s.requestId === requestId);
  }

  // ── Private helpers ──────────────────────────────────────

  private computeConfidence(citationCount: number, output: Record<string, unknown>): number {
    let score = 0.5; // Base confidence

    // More citations → higher confidence
    if (citationCount >= 3) score += 0.2;
    else if (citationCount >= 1) score += 0.1;

    // Output has explicit confidence
    if (typeof output.confidence === 'number') {
      score = output.confidence as number;
    }

    // Output has score that indicates quality
    if (typeof output.complianceScore === 'number') {
      const s = output.complianceScore as number;
      if (s >= 80) score += 0.1;
    }
    if (typeof output.overallRisk === 'string') {
      // Risk assessment present → slightly higher confidence
      score += 0.05;
    }

    return Math.min(1, Math.max(0, score));
  }
}

// ── Default executor instance ───────────────────────────────

let defaultExecutor: SkillExecutor | null = null;

export function getSkillExecutor(config?: SkillExecutorConfig): SkillExecutor {
  if (!defaultExecutor || config) {
    defaultExecutor = new SkillExecutor({ defaultModel: ENV_DEFAULT_MODEL, ...config });
  }
  return defaultExecutor;
}

/**
 * Quick check: is the AI system ready to execute skills?
 */
export function isAiReady(): boolean {
  return isLlmConfigured();
}
