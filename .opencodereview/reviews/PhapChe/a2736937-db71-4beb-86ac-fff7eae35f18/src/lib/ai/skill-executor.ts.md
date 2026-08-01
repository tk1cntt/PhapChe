# Review: `src/lib/ai/skill-executor.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 8

---

## 🔴 Critical (2)

**🐛 Bug** · lines 169-175

Missing error handling for all async operations in `execute`. If `semanticSearch`, `renderSystemPrompt`, `getSystemPrompt`, or `llmComplete` throw, the caller receives a raw unhandled rejection with no context. This can crash upstream callers that expect structured errors. Wrap the body in try-catch and return a well-formed error result.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async execute(skill: AgentSkill, context: SkillContext): Promise<SkillResult> {
    try {
      const model = DEFAULT_MODELS[this.config.defaultModel] ?? DEFAULT_MODELS['gpt-4o-mini'];

      // 1. RAG — get legal context
      let legalContext: SearchResult[] = [];
      if (this.config.enableRag && isVectorStoreReady()) {
        legalContext = await semanticSearch({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async execute(skill: AgentSkill, context: SkillContext): Promise<SkillResult> {
    const model = DEFAULT_MODELS[this.config.defaultModel] ?? DEFAULT_MODELS['gpt-4o-mini'];

    // 1. RAG — get legal context
    let legalContext: SearchResult[] = [];
    if (this.config.enableRag && isVectorStoreReady()) {
      legalContext = await semanticSearch({
```
</details>

---

**🐛 Bug** · lines 242-249

Missing error handling for all async operations in `executeStream`. If `semanticSearch`, `renderSystemPrompt`, `getSystemPrompt`, or `llmStream` throw, the generator will throw an unhandled rejection, breaking the caller's iteration. Wrap the body in try-catch and yield an error status.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async *executeStream(skill: AgentSkill, context: SkillContext): AsyncGenerator<SkillResultStream> {
    try {
      const model = DEFAULT_MODELS[this.config.defaultModel] ?? DEFAULT_MODELS['gpt-4o-mini'];

      // RAG
      let legalContext: SearchResult[] = [];
      if (this.config.enableRag && isVectorStoreReady()) {
        yield { chunk: null, status: 'Đang tra cứu cơ sở dữ liệu pháp lý...', done: false };
        legalContext = await semanticSearch({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async *executeStream(skill: AgentSkill, context: SkillContext): AsyncGenerator<SkillResultStream> {
    const model = DEFAULT_MODELS[this.config.defaultModel] ?? DEFAULT_MODELS['gpt-4o-mini'];

    // RAG
    let legalContext: SearchResult[] = [];
    if (this.config.enableRag && isVectorStoreReady()) {
      yield { chunk: null, status: 'Đang tra cứu cơ sở dữ liệu pháp lý...', done: false };
      legalContext = await semanticSearch({
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 283-293

`executeStream` does not actually stream LLM output to the caller. The `for await` loop accumulates all chunks into `fullContent` and only yields the final parsed result at the end. This defeats the purpose of streaming — callers expecting incremental partial results will get nothing until the entire LLM response is complete. Consider yielding each `chunk.delta` as it arrives so consumers can display partial output.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let fullContent = '';
    for await (const chunk of llmStream({
      model,
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      responseFormat: 'text', // Streaming doesn't support JSON mode
    })) {
      if (chunk.done) break;
      fullContent += chunk.delta;
      yield { chunk: null, delta: chunk.delta, status: 'Đang phân tích...', done: false };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
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
```
</details>

---

**🐛 Bug** · lines 392-397

Race condition in `getSkillExecutor` singleton. When `config` is provided, the function always overwrites `defaultExecutor` with a new instance. If concurrent requests call `getSkillExecutor` with different configs, they can race: one request may receive an executor configured for another request's needs. The `if (!defaultExecutor || config)` guard also means passing `config` to one call permanently changes the singleton for all subsequent callers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function getSkillExecutor(config?: SkillExecutorConfig): SkillExecutor {
  if (!defaultExecutor) {
    defaultExecutor = new SkillExecutor({ defaultModel: ENV_DEFAULT_MODEL });
  }
  if (config) {
    return new SkillExecutor({ defaultModel: ENV_DEFAULT_MODEL, ...config });
  }
  return defaultExecutor;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getSkillExecutor(config?: SkillExecutorConfig): SkillExecutor {
  if (!defaultExecutor || config) {
    defaultExecutor = new SkillExecutor({ defaultModel: ENV_DEFAULT_MODEL, ...config });
  }
  return defaultExecutor;
}
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 369-378

`computeConfidence` casts `output.confidence` and `output.complianceScore` as `number` without validation. If the LLM returns a string, `NaN`, or `undefined`, the arithmetic (`score = ...`, `s >= 80`) produces `NaN` or incorrect results. Validate with `typeof x === 'number' && !Number.isNaN(x)` before using these values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Output has explicit confidence
    if (typeof output.confidence === 'number' && !Number.isNaN(output.confidence)) {
      score = output.confidence;
    }

    // Output has score that indicates quality
    if (typeof output.complianceScore === 'number' && !Number.isNaN(output.complianceScore)) {
      const s = output.complianceScore;
      if (s >= 80) score += 0.1;
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Output has explicit confidence
    if (typeof output.confidence === 'number') {
      score = output.confidence as number;
    }

    // Output has score that indicates quality
    if (typeof output.complianceScore === 'number') {
      const s = output.complianceScore as number;
      if (s >= 80) score += 0.1;
    }
```
</details>

---

**🔧 Maintainability** · line 153

Dangerous double type assertion `DEFAULT_DOMAIN_SKILL_MAP as unknown as Record<string, AgentSkill[]>` at line 128. This bypasses TypeScript's type checking and silently coerces the imported constant into a different type. If the actual shape of `DEFAULT_DOMAIN_SKILL_MAP` doesn't match `Record<string, AgentSkill[]>`, runtime errors will occur with no compile-time warning. Fix the type definition at the source (in `types.ts`) instead of forcing the cast here.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  domainSkillMap: DEFAULT_DOMAIN_SKILL_MAP,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  domainSkillMap: DEFAULT_DOMAIN_SKILL_MAP as unknown as Record<string, AgentSkill[]>,
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 200

Hardcoded Vietnamese user-facing strings (e.g., `'Hãy thực hiện nhiệm vụ:'`, `'Đang tra cứu cơ sở dữ liệu pháp lý...'`, `'Hoàn tất phân tích'`). These should be extracted to i18n resources or at minimum constants to support localization and avoid scattering raw strings through business logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // TODO: Extract to i18n
      { role: 'user', content: `Hãy thực hiện nhiệm vụ: ${promptTpl.description}` },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      { role: 'user', content: `Hãy thực hiện nhiệm vụ: ${promptTpl.description}` },
```
</details>

---

**🐛 Bug** · lines 197-201

`getSystemPrompt(skill)` may return `undefined` or `null` if the skill is not found in the prompt registry. The code then accesses `promptTpl.description` and `promptTpl.outputFormat` without a null guard, which would throw a TypeError. Add a null check and handle the missing prompt case gracefully.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const promptTpl = getSystemPrompt(skill);
    if (!promptTpl) {
      throw new Error(`No system prompt found for skill: ${skill.id ?? skill.name}`);
    }
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Hãy thực hiện nhiệm vụ: ${promptTpl.description}` },
    ];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const promptTpl = getSystemPrompt(skill);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Hãy thực hiện nhiệm vụ: ${promptTpl.description}` },
    ];
```
</details>


