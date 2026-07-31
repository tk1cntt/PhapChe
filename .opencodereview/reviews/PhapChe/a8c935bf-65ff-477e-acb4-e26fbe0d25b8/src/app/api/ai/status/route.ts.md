# Review: `src/app/api/ai/status/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 13-44

The GET handler has no try/catch block. If any imported function (isLlmConfigured, getAvailableModels, isVectorStoreReady, getIndexStats, getAllSkills) throws an exception, the endpoint will return an unhandled HTTP 500 error with no useful diagnostic information. Since this is a status endpoint, it should gracefully degrade: catch errors and return a partial status indicating which subsystems failed to report.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET() {
  try {
    const llmReady = isLlmConfigured();
    const ragReady = isVectorStoreReady();
    const models = llmReady ? getAvailableModels() : [];
    const skills = getAllSkills();
    const ragStats = getIndexStats();

    return NextResponse.json({
      status: llmReady ? 'available' : 'not_configured',
      llm: {
        configured: llmReady,
        availableModels: models.map((m) => ({
          id: m.modelId,
          provider: m.provider,
          maxTokens: m.maxTokens,
        })),
      },
      rag: {
        ready: ragReady,
        chunkCount: ragStats.chunkCount,
        documentCount: ragStats.documentCount,
        sources: ragStats.sources,
      },
      skills: {
        total: skills.length,
        list: skills,
        byDomain: Object.fromEntries(
          Object.entries(DOMAIN_SKILL_MAP).map(([domain, dSkills]) => [domain, dSkills]),
        ),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve AI status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to retrieve AI system status',
      },
      { status: 500 },
    );
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET() {
  const llmReady = isLlmConfigured();
  const ragReady = isVectorStoreReady();
  const models = llmReady ? getAvailableModels() : [];
  const skills = getAllSkills();
  const ragStats = getIndexStats();

  return NextResponse.json({
    status: llmReady ? 'available' : 'not_configured',
    llm: {
      configured: llmReady,
      availableModels: models.map((m) => ({
        id: m.modelId,
        provider: m.provider,
        maxTokens: m.maxTokens,
      })),
    },
    rag: {
      ready: ragReady,
      chunkCount: ragStats.chunkCount,
      documentCount: ragStats.documentCount,
      sources: ragStats.sources,
    },
    skills: {
      total: skills.length,
      list: skills,
      byDomain: Object.fromEntries(
        Object.entries(DOMAIN_SKILL_MAP).map(([domain, dSkills]) => [domain, dSkills]),
      ),
    },
  });
}
```
</details>


## 🟡 Medium (1)

**🔒 Security** · lines 30-35

`getIndexStats()` returns internal `documentId` values in the `sources` array, which are exposed directly to the client. Document IDs are internal identifiers used for operations like `removeDocument` and may be sensitive. Consider omitting `documentId` from the response or replacing it with a non-sensitive index.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    rag: {
      ready: ragReady,
      chunkCount: ragStats.chunkCount,
      documentCount: ragStats.documentCount,
      sources: ragStats.sources.map(({ source, chunkCount }) => ({
        source,
        chunkCount,
      })),
    },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    rag: {
      ready: ragReady,
      chunkCount: ragStats.chunkCount,
      documentCount: ragStats.documentCount,
      sources: ragStats.sources,
    },
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 39-41

The `byDomain` field is computed via `Object.fromEntries(Object.entries(DOMAIN_SKILL_MAP).map(...))` which is a no-op shallow copy of the already-imported `DOMAIN_SKILL_MAP`. This redundant transformation adds unnecessary runtime overhead on every request. Consider using `DOMAIN_SKILL_MAP` directly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      byDomain: DOMAIN_SKILL_MAP,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      byDomain: Object.fromEntries(
        Object.entries(DOMAIN_SKILL_MAP).map(([domain, dSkills]) => [domain, dSkills]),
      ),
```
</details>


