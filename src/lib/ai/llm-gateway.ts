/**
 * LLM Gateway — Single entry point for all LLM calls
 *
 * Supports: OpenAI, Azure OpenAI, Anthropic, Groq, custom OpenAI-compatible endpoints.
 * Features: auto-retry (3x), streaming, JSON mode, usage tracking, rate limiting.
 *
 * Environment variables (prefixed by provider):
 *   OPENAI_API_KEY, OPENAI_BASE_URL
 *   AZURE_API_KEY, AZURE_BASE_URL
 *   ANTHROPIC_API_KEY
 *   GROQ_API_KEY
 *   LLM_GATEWAY_KEY, LLM_GATEWAY_URL
 */

import type {
  LlmModelConfig,
  LlmRequest,
  LlmResponse,
  LlmStreamChunk,
  ChatMessage,
  LlmProvider,
} from './types';

// ── Default model configs ───────────────────────────────────

const DEFAULT_OPENAI_KEY = process.env.OPENAI_API_KEY ?? '';
const DEFAULT_OPENAI_URL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
const DEFAULT_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const DEFAULT_GROQ_KEY = process.env.GROQ_API_KEY ?? '';
const GATEWAY_KEY = process.env.LLM_GATEWAY_KEY ?? '';
const GATEWAY_URL = process.env.LLM_GATEWAY_URL ?? '';

/** Default models — override via env */
export const DEFAULT_MODELS: Record<string, LlmModelConfig> = {
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    baseUrl: DEFAULT_OPENAI_URL,
    apiKeyEnv: 'OPENAI_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    baseUrl: DEFAULT_OPENAI_URL,
    apiKeyEnv: 'OPENAI_API_KEY',
    maxTokens: 8192,
    temperature: 0.3,
  },
  'claude-haiku': {
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-latest',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  'claude-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-latest',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    maxTokens: 8192,
    temperature: 0.3,
  },
  'groq-llama': {
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  'startup-model': {
    provider: 'openai',
    modelId: 'startup-model',
    baseUrl: DEFAULT_OPENAI_URL,
    apiKeyEnv: 'OPENAI_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  'legal-agent': {
    provider: 'openai',
    modelId: 'legal-agent',
    baseUrl: DEFAULT_OPENAI_URL,
    apiKeyEnv: 'OPENAI_API_KEY',
    maxTokens: 16384,
    temperature: 0.3,
  },
};

// ── Resolve API key ─────────────────────────────────────────

function resolveApiKey(config: LlmModelConfig): string {
  // Priority: process.env override > gateway fallback
  const envVal = process.env[config.apiKeyEnv];
  if (envVal && envVal.length > 0) return envVal;
  if (GATEWAY_KEY) return GATEWAY_KEY;
  // Fallback to static hardcoded defaults (only in dev)
  if (config.provider === 'openai' && DEFAULT_OPENAI_KEY) return DEFAULT_OPENAI_KEY;
  if (config.provider === 'anthropic' && DEFAULT_ANTHROPIC_KEY) return DEFAULT_ANTHROPIC_KEY;
  if (config.provider === 'groq' && DEFAULT_GROQ_KEY) return DEFAULT_GROQ_KEY;
  return '';
}

function resolveBaseUrl(config: LlmModelConfig): string {
  if (config.baseUrl) return config.baseUrl;
  if (GATEWAY_URL) return GATEWAY_URL;
  if (config.provider === 'openai') return DEFAULT_OPENAI_URL;
  if (config.provider === 'groq') return 'https://api.groq.com/openai/v1';
  return '';
}

// ── Retry config ─────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

function getRetryDelay(attempt: number): number {
  const base = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
  const jitter = Math.random() * 0.3 * base;
  return base + jitter;
}

// ── Rate limiter ─────────────────────────────────────────────

const requestTimestamps: number[] = [];
const MAX_RPM = 60; // max requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(): void {
  // WARNING: Not concurrency-safe under concurrent async calls.
  // If concurrent calls are possible, serialize via a mutex or use a token-bucket library.
  const now = Date.now();
  // Prune old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_WINDOW) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_RPM) {
    throw new Error('LLM_RATE_LIMIT: Too many requests. Try again later.');
  }
  requestTimestamps.push(now);
}

// ── OpenAI-compatible API call ───────────────────────────────

async function callOpenAiCompatible(
  config: LlmModelConfig,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json_object';
    stream?: boolean;
  },
): Promise<Response> {
  const apiKey = resolveApiKey(config);
  const baseUrl = resolveBaseUrl(config);

  if (!apiKey) {
    throw new Error(
      `LLM_API_KEY_MISSING: No API key found for ${config.provider}/${config.modelId}. ` +
      `Set ${config.apiKeyEnv} or LLM_GATEWAY_KEY in environment.`,
    );
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const body: Record<string, unknown> = {
    model: config.modelId,
    messages,
    temperature: options.temperature ?? config.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
  };

  if (options.responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' };
  }

  if (options.stream) {
    body.stream = true;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.provider === 'azure'
        ? { 'api-key': apiKey }
        : { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000), // 2 min timeout
  });

  return response;
}

// ── Anthropic API call ───────────────────────────────────────

async function callAnthropic(
  config: LlmModelConfig,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<Response> {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    throw new Error(
      `LLM_API_KEY_MISSING: No API key found for ${config.provider}/${config.modelId}. ` +
      `Set ${config.apiKeyEnv} in environment.`,
    );
  }

  // Separate system message from conversation
  // Anthropic only supports a single system string; concatenate if multiple.
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const conversationMsgs = messages.filter((m) => m.role !== 'system');
  const systemMsg = systemMsgs.length > 0
    ? systemMsgs.map((m) => m.content).join('\n\n')
    : undefined;

  const body: Record<string, unknown> = {
    model: config.modelId,
    max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
    temperature: options.temperature ?? config.temperature ?? 0.3,
    messages: conversationMsgs.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (systemMsg) {
    body.system = systemMsg;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01', // TODO: Consider bumping to a newer version for extended features
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  return response;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Send a completion request to an LLM.
 * Automatically retries on network/rate-limit errors (3x).
 */
export async function llmComplete(request: LlmRequest): Promise<LlmResponse> {
  checkRateLimit();
  const startTime = Date.now();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let response: Response;

      if (request.model.provider === 'anthropic') {
        response = await callAnthropic(request.model, request.messages, {
          temperature: request.temperature,
          maxTokens: request.maxTokens,
        });
      } else {
        // OpenAI, Groq, Azure, custom → all use OpenAI-compatible API
        response = await callOpenAiCompatible(request.model, request.messages, {
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          responseFormat: request.responseFormat,
          stream: false,
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status === 429 && attempt < MAX_RETRIES) {
          // Rate limited — wait and retry
          await new Promise((r) => setTimeout(r, getRetryDelay(attempt)));
          continue;
        }
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, getRetryDelay(attempt)));
          continue;
        }
        throw new Error(`LLM_API_ERROR: HTTP ${response.status} — ${errorText}`);
      }

      const data = await response.json() as Record<string, unknown>;
      const latencyMs = Date.now() - startTime;

      let content: string;
      if (request.model.provider === 'anthropic') {
        // Anthropic Messages API: content is a top-level array of blocks
        const anthropicContent = data.content as Array<{ type: string; text?: string }> | undefined;
        content = Array.isArray(anthropicContent)
          ? anthropicContent.map((c) => c.text ?? '').join('')
          : '';
      } else {
        // OpenAI-compatible format
        const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
        const firstChoice = choices?.[0];
        content = typeof firstChoice?.message?.content === 'string'
          ? firstChoice.message.content
          : '';
      }

      const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

      if (!content && (usage?.total_tokens ?? 0) > 0) {
        const fc = 'firstChoice' in data ? (data as Record<string, unknown>).firstChoice : undefined;
        console.warn('[LLM Gateway] Response has tokens but empty content. Raw message:', JSON.stringify(fc ?? {}).slice(0, 300));
      }

      return {
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens ?? 0,
              completionTokens: usage.completion_tokens ?? 0,
              totalTokens: usage.total_tokens ?? 0,
            }
          : undefined,
        model: request.model.modelId,
        latencyMs,
      };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const isRetryable =
          error instanceof TypeError ||
          (error instanceof Error &&
            (error.name === 'AbortError' ||
             error.message.includes('429') ||
             error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503')));

        if (isRetryable) {
          await new Promise((r) => setTimeout(r, getRetryDelay(attempt)));
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error('LLM_MAX_RETRIES: Request failed after all retries');
}

/**
 * Stream a completion from an LLM.
 * Yields partial content chunks as they arrive.
 * Only supports OpenAI-compatible streaming (not Anthropic yet).
 */
export async function* llmStream(request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
  checkRateLimit();

  if (request.model.provider === 'anthropic') {
    throw new Error('LLM_STREAM_UNSUPPORTED: Anthropic streaming not yet implemented. Use llmComplete().');
  }

  let response!: Response;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await callOpenAiCompatible(request.model, request.messages, {
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        responseFormat: request.responseFormat,
        stream: true,
      });
      break;
    } catch (error) {
      if (attempt >= MAX_RETRIES) throw error;
      const isRetryable = error instanceof TypeError ||
        (error instanceof Error &&
          (error.name === 'AbortError' ||
           error.message.includes('429') ||
           error.message.includes('500') ||
           error.message.includes('502') ||
           error.message.includes('503')));
      if (!isRetryable) throw error;
      await new Promise((r) => setTimeout(r, getRetryDelay(attempt)));
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`LLM_STREAM_ERROR: HTTP ${response.status} — ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('LLM_STREAM_ERROR: No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        yield { delta: '', done: true };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          yield { delta: '', done: true };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            yield { delta, done: false };
          }
        } catch {
          console.warn('[LLM Gateway] Failed to parse stream chunk:', data.slice(0, 200));
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* lock may already be released */ }
  }
}

/**
 * Check if LLM Gateway is configured and available.
 */
export function isLlmConfigured(): boolean {
  const envKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY', 'LLM_GATEWAY_KEY'];
  return envKeys.some((k) => {
    const val = process.env[k];
    return val && val.length > 0;
  });
}

/**
 * Get available models (those with configured API keys).
 */
export function getAvailableModels(): LlmModelConfig[] {
  const available: LlmModelConfig[] = [];

  for (const config of Object.values(DEFAULT_MODELS)) {
    const key = resolveApiKey(config);
    if (key) {
      available.push(config);
    }
  }

  return available;
}

/**
 * Resolve API key with priority: process.env > LLM_GATEWAY_KEY > static defaults.
 * Exported for testing and diagnostics.
 */
export { resolveApiKey, resolveBaseUrl };
