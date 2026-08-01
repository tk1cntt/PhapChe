# Review: `src/lib/ai/llm-gateway.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 15

---

## 🔴 Critical (1)

**🐛 Bug**

Anthropic response parsing is broken. The Anthropic Messages API returns `{ content: [{ type: 'text', text: '...' }], ... }` at the top level — there is no `choices` array. The current code does `data.choices as Array<...>`, which will be `undefined` for Anthropic responses. `firstChoice` becomes `undefined`, both condition branches fail, and `content` always ends up as `''`. This means all Anthropic calls silently return empty content. The fix should check `data.content` directly for Anthropic (or when `choices` is absent).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
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
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const data = await response.json() as Record<string, unknown>;
      const latencyMs = Date.now() - startTime;

      // Parse OpenAI-compatible response format
      const choices = data.choices as Array<{ message?: { content?: string }; content?: Array<{ text?: string }> }>;
      const firstChoice = choices?.[0];

      let content: string;
      // Dùng typeof check thay vì truthy — empty string "" is falsy
      if (typeof firstChoice?.message?.content === 'string') {
        content = firstChoice.message.content;
      } else if (typeof firstChoice?.content === 'object' && Array.isArray(firstChoice.content)) {
        // Anthropic content block array
        content = firstChoice.content.map((c) => c.text ?? '').join('');
      } else {
        content = '';
      }
```
</details>


## 🟠 High (3)

**🐛 Bug** · line 162

URL concatenation produces double slashes when `baseUrl` ends with `/`. For example, `https://api.openai.com/v1/` + `/chat/completions` = `https://api.openai.com/v1//chat/completions`, which can cause 404 errors. Use `new URL()` or strip trailing slashes from `baseUrl` before concatenation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const url = `${baseUrl}/chat/completions`;
```
</details>

---

**🐛 Bug** · lines 92-101

`resolveApiKey` for Anthropic skips the `DEFAULT_ANTHROPIC_KEY` fallback. The function checks `process.env[config.apiKeyEnv]`, then `GATEWAY_KEY`, then falls back to `DEFAULT_OPENAI_KEY` and `DEFAULT_GROQ_KEY` only. Anthropic is never matched, so even if `ANTHROPIC_API_KEY` env var is set, `DEFAULT_ANTHROPIC_KEY` (resolved once at startup) won't be used. This means `getAvailableModels()` will exclude Anthropic models if the env var is set after the module loads, or if `ANTHROPIC_API_KEY` was set at process start but `process.env.ANTHROPIC_API_KEY` is somehow empty at call time.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
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
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function resolveApiKey(config: LlmModelConfig): string {
  // Priority: process.env override > gateway fallback
  const envVal = process.env[config.apiKeyEnv];
  if (envVal && envVal.length > 0) return envVal;
  if (GATEWAY_KEY) return GATEWAY_KEY;
  // Fallback to static hardcoded defaults (only in dev)
  if (config.provider === 'openai' && DEFAULT_OPENAI_KEY) return DEFAULT_OPENAI_KEY;
  if (config.provider === 'groq' && DEFAULT_GROQ_KEY) return DEFAULT_GROQ_KEY;
  return '';
}
```
</details>

---

**🐛 Bug** · lines 357-367

`llmStream` does not check `response.ok` before reading the body. If `callOpenAiCompatible` returns a non-2xx response (e.g., 400, 401, 403, 429), the code proceeds to `response.body?.getReader()`, which will either fail silently or produce garbage. The `response.ok` check is missing entirely — this is a regression compared to `llmComplete` which properly checks it.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // (response.ok check is already present — no change needed here, but ensure it's reached)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const response = await callOpenAiCompatible(request.model, request.messages, {
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    responseFormat: request.responseFormat,
    stream: true,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`LLM_STREAM_ERROR: HTTP ${response.status} — ${errorText}`);
  }
```
</details>


## 🟡 Medium (8)

**🐛 Bug** · lines 322-331

Retry logic in `llmComplete` uses fragile error-message substring matching (`'fetch'`, `'network'`, `'timeout'`, `'429'`, `'500'`, `'502'`, `'503'`). This can produce false positives (e.g., a legitimate error message containing "fetch") and misses `AbortError` (thrown by `AbortSignal.timeout`), which has `error.name === 'AbortError'` but whose message does not contain 'timeout' in all runtimes. Prefer checking `error.name` or using `instanceof` checks (e.g., `error instanceof TypeError` for network errors, and checking `error.name === 'AbortError'`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        const isRetryable =
          error instanceof TypeError ||
          (error instanceof DOMException && error.name === 'AbortError') ||
          (error instanceof Error &&
            (error.name === 'AbortError' ||
             error.message.includes('429') ||
             error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503')));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const isRetryable =
          error instanceof TypeError ||
          (error instanceof Error &&
            (error.message.includes('fetch') ||
             error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('429') ||
             error.message.includes('500') ||
             error.message.includes('502') ||
             error.message.includes('503')));
```
</details>

---

**🐛 Bug** · lines 350-362

`llmStream` has no retry logic at all. If the stream request fails with a transient error (e.g., 429 or 5xx), the generator immediately throws instead of retrying. This is inconsistent with `llmComplete` which retries up to 3 times. Consider adding retry logic for the initial request, or at least documenting the intentional asymmetry.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function* llmStream(request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
  checkRateLimit();

  if (request.model.provider === 'anthropic') {
    throw new Error('LLM_STREAM_UNSUPPORTED: Anthropic streaming not yet implemented. Use llmComplete().');
  }

  let response: Response;
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
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function* llmStream(request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
  checkRateLimit();

  if (request.model.provider === 'anthropic') {
    throw new Error('LLM_STREAM_UNSUPPORTED: Anthropic streaming not yet implemented. Use llmComplete().');
  }

  const response = await callOpenAiCompatible(request.model, request.messages, {
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    responseFormat: request.responseFormat,
    stream: true,
  });
```
</details>

---

**🔒 Security** · lines 26-31

API keys are resolved from environment variables at module load time (top-level `const` declarations). This means if `process.env` changes after the module is first imported (e.g., in tests, or when using a secrets manager that injects env vars lazily), the module will use stale/empty values. While `resolveApiKey` reads `process.env` dynamically, `DEFAULT_OPENAI_KEY`, `DEFAULT_ANTHROPIC_KEY`, `DEFAULT_GROQ_KEY`, `GATEWAY_KEY`, and `GATEWAY_URL` are all frozen at import time. This is a maintainability concern — consider making these lazy getters.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function getDefaultOpenAiKey(): string { return process.env.OPENAI_API_KEY ?? ''; }
function getDefaultOpenAiUrl(): string { return process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'; }
function getDefaultAnthropicKey(): string { return process.env.ANTHROPIC_API_KEY ?? ''; }
function getDefaultGroqKey(): string { return process.env.GROQ_API_KEY ?? ''; }
function getGatewayKey(): string { return process.env.LLM_GATEWAY_KEY ?? ''; }
function getGatewayUrl(): string { return process.env.LLM_GATEWAY_URL ?? ''; }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const DEFAULT_OPENAI_KEY = process.env.OPENAI_API_KEY ?? '';
const DEFAULT_OPENAI_URL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
const DEFAULT_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const DEFAULT_GROQ_KEY = process.env.GROQ_API_KEY ?? '';
const GATEWAY_KEY = process.env.LLM_GATEWAY_KEY ?? '';
const GATEWAY_URL = process.env.LLM_GATEWAY_URL ?? '';
```
</details>

---

**⚡ Performance** · lines 124-138

Rate limiter uses `Array.shift()` which is O(n) per call. While the array is capped at `MAX_RPM` (60), this is acceptable, but the limiter is not concurrency-safe. If `llmComplete` or `llmStream` is called concurrently, the `requestTimestamps` array can be corrupted by race conditions (e.g., two calls both see `length < MAX_RPM` and both push, exceeding the limit). Consider using a proper token-bucket or adding a mutex, or document that the caller must serialize requests.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const requestTimestamps: number[] = [];
const MAX_RPM = 60; // max requests per minute
const RATE_WINDOW = 60_000; // 1 minute
let rateLimitLock = false;

function checkRateLimit(): void {
  // Note: This is not fully concurrency-safe; serialize LLM calls or use a proper token-bucket.
  const now = Date.now();
  const cutoff = now - RATE_WINDOW;
  // Use filter instead of shift-in-loop for O(n) but clearer semantics
  for (let i = requestTimestamps.length - 1; i >= 0; i--) {
    if (requestTimestamps[i] < cutoff) {
      requestTimestamps.splice(i, 1);
    }
  }
  if (requestTimestamps.length >= MAX_RPM) {
    throw new Error('LLM_RATE_LIMIT: Too many requests. Try again later.');
  }
  requestTimestamps.push(now);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const requestTimestamps: number[] = [];
const MAX_RPM = 60; // max requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(): void {
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
```
</details>

---

**🐛 Bug** · lines 406-408

In `llmStream`, `reader.releaseLock()` is called in `finally`, but if the stream is consumed to completion (the `[DONE]` case or `done: true`), the reader's lock is already released automatically. Calling `releaseLock()` on an already-released reader throws a `TypeError`. The safe approach is to check `reader.locked` first, or use `reader.cancel()` pattern instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } finally {
    try { reader.releaseLock(); } catch { /* lock may already be released */ }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } finally {
    reader.releaseLock();
  }
```
</details>

---

**🐛 Bug** · lines 180-183

Azure OpenAI support is not actually implemented. Azure uses `api-key` header (not `Authorization: Bearer`) and its URL structure is `https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=...`. The current `callOpenAiCompatible` always uses `Authorization: Bearer` and `${baseUrl}/chat/completions`, which won't work with Azure. Either add proper Azure handling or remove the 'Azure OpenAI' claim from the file header.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    headers: {
      'Content-Type': 'application/json',
      ...(config.provider === 'azure'
        ? { 'api-key': apiKey }
        : { Authorization: `Bearer ${apiKey}` }),
    },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
```
</details>

---

**🐛 Bug** · line 232

`callAnthropic` hardcodes `anthropic-version: '2023-06-01'` which is ~3 years old. Anthropic has deprecated older API versions and newer features (e.g., extended thinking, tool use v2) require newer versions. This could cause subtle breakage or missing features. Consider using `'2023-06-01'` as a minimum or making this configurable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      'anthropic-version': '2023-06-01', // TODO: Consider bumping to a newer version for extended features
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      'anthropic-version': '2023-06-01',
```
</details>

---

**🐛 Bug** · lines 209-211

`callAnthropic` only uses the first system message when multiple exist. `messages.find()` returns the first match. If the caller passes multiple system messages (e.g., from different prompt templates), only the first one is sent to Anthropic, while the rest are silently dropped. Anthropic API supports a single system string, so this is a data loss issue. Consider concatenating all system messages or throwing an error if multiple are provided.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Separate system message from conversation
  // Anthropic only supports a single system string; concatenate if multiple.
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const conversationMsgs = messages.filter((m) => m.role !== 'system');
  const systemMsg = systemMsgs.length > 0
    ? systemMsgs.map((m) => m.content).join('\n\n')
    : undefined;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Separate system message from conversation
  const systemMsg = messages.find((m) => m.role === 'system');
  const conversationMsgs = messages.filter((m) => m.role !== 'system');
```
</details>


## 🔵 Low (3)

**🔧 Maintainability** · lines 134-137

The `rateLimitLock` variable is declared but never used in the suggestion. Actually, the point is: the rate limiter has a race condition in concurrent scenarios. The current code is fine for single-threaded Node.js event loop, but if multiple async calls interleave, two calls can both check `requestTimestamps.length >= MAX_RPM` before either pushes, both passing the check. This is a real but subtle issue. The simplest fix is to note it, or use a proper locking mechanism.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // WARNING: Not concurrency-safe under concurrent async calls.
  // If concurrent calls are possible, serialize via a mutex or use a token-bucket library.
  if (requestTimestamps.length >= MAX_RPM) {
    throw new Error('LLM_RATE_LIMIT: Too many requests. Try again later.');
  }
  requestTimestamps.push(now);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (requestTimestamps.length >= MAX_RPM) {
    throw new Error('LLM_RATE_LIMIT: Too many requests. Try again later.');
  }
  requestTimestamps.push(now);
```
</details>

---

**🔧 Maintainability** · line 438

`resolveApiKey` is exported but not documented. External callers might not understand the priority chain (process.env → GATEWAY_KEY → static defaults). Consider adding a JSDoc comment explaining the resolution order.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
/**
 * Resolve API key with priority: process.env > LLM_GATEWAY_KEY > static defaults.
 * Exported for testing and diagnostics.
 */
export { resolveApiKey, resolveBaseUrl };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export { resolveApiKey, resolveBaseUrl };
```
</details>

---

**🔧 Maintainability** · lines 401-403

Silent catch in stream JSON parsing hides malformed responses. If the API returns malformed JSON (not just empty lines), the error is silently swallowed. This makes debugging stream issues very difficult. At minimum, log a warning with the raw data that failed to parse.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        } catch {
          console.warn('[LLM Gateway] Failed to parse stream chunk:', data.slice(0, 200));
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        } catch {
          // Skip unparseable chunks
        }
```
</details>


