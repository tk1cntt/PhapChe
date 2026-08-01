# Review: `src/lib/ai/vector-store.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 7

---

## 🔴 Critical (1)

**🐛 Bug** · line 145

**Embedding dimension mismatch will crash search.**

`text-embedding-3-small` returns 1536-dimensional vectors, but `pseudoEmbed()` returns 256-dimensional vectors. If any chunks are indexed with pseudo-embeddings (API failure) while the query is embedded with a real embedding (or vice versa), `cosineSimilarity()` at line 83 throws: `Vector dimension mismatch: 256 vs 1536`, crashing the entire search.

**Scenario:** The API is temporarily down → `indexDocument` falls back to pseudo-embeddings. Later, the API recovers → `semanticSearch` gets a real 1536-dim embedding for the query. Search crashes for every request.

**Fix:** Store the embedding dimension per chunk and filter out mismatched dimensions during search, or standardize on a single dimension for both real and pseudo embeddings (e.g., pad/truncate pseudo to 1536).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Guard against dimension mismatch from mixed real/pseudo embeddings
      if (queryEmbedding.length !== chunk.embedding.length) {
        console.warn(
          `[VectorIndex] Skipping chunk ${chunk.id}: embedding dim mismatch ` +
          `(query=${queryEmbedding.length}, chunk=${chunk.embedding.length})`
        );
        continue;
      }
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
```
</details>


## 🟠 High (3)

**🐛 Bug** · lines 229-231

**Silent fallback to pseudo-embedding on API failure.**

Both `embedText` (line 185) and `embedBatch` (line 221) use empty `catch` blocks that swallow all errors. No logging, no warning, no signal to the caller. Search quality silently degrades to meaningless pseudo-embeddings, and operators have no way to know the system is running in degraded mode.

**Fix:** At minimum, log the error with `console.error`. Better: emit a metric/instrumentation event and consider returning an error or throwing to let the caller decide whether to proceed with degraded quality.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (err) {
      console.error('[embedText] Embedding API failed, falling back to pseudo-embedding:', err);
      // Optionally: emit metric for observability
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch {
      // Fall through to pseudo-embedding
    }
```
</details>

---

**🐛 Bug** · line 332

**`embedBatch` may return fewer embeddings than input texts, causing undefined access.**

The OpenAI batch embedding API may skip or truncate results. In `indexDocument`, `embeddings[i]` would be `undefined` for mismatched indices, leading to `chunk.embedding` being `undefined`, which crashes `cosineSimilarity` (line 83) with `Cannot read properties of undefined` when `magnitude()` tries to iterate it.

**Fix:** Validate that `embeddings.length === texts.length` and each element is non-null before proceeding.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (embeddings.length !== chunks.length) {
    throw new Error(
      `[indexDocument] Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`
    );
  }

  const docChunks: DocumentChunk[] = chunks.map((chunk, i) => ({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const docChunks: DocumentChunk[] = chunks.map((chunk, i) => ({
```
</details>

---

**🐛 Bug** · lines 267-272

Same silent fallback issue as `embedText`. The `embedBatch` function also swallows all API errors with no logging. When `indexDocument` calls `embedBatch` and the API fails, all chunks get pseudo-embeddings silently — and the caller (`indexDocument`) has no way to know the embeddings are semantically meaningless.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (err) {
      console.error('[embedBatch] Embedding API failed, falling back to pseudo-embeddings:', err);
    }
  }

  return Promise.all(texts.map(pseudoEmbed));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch {
      // Fall through
    }
  }

  return Promise.all(texts.map(pseudoEmbed));
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 51-52

**Chunk overlap uses character slicing, not word boundaries.**

`currentChunk.slice(-overlap)` on line 47 slices at arbitrary character positions, which can split words in the middle. In legal documents, this can fragment critical terms (e.g., "indemnification" → "cation" in one chunk's overlap).

**Fix:** Use word or sentence boundary logic for overlap. For example, split on the last whitespace before the overlap point.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      if (overlap > 0 && currentChunk.length > overlap) {
        // Split at word boundary to avoid mid-word fragmentation
        let overlapText = currentChunk.slice(-overlap);
        const firstSpace = overlapText.indexOf(' ');
        if (firstSpace > 0 && firstSpace < overlapText.length - 1) {
          overlapText = overlapText.slice(firstSpace + 1);
        }
        currentChunk = overlapText + '\n\n' + trimmed;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      if (overlap > 0 && currentChunk.length > overlap) {
        currentChunk = currentChunk.slice(-overlap) + '\n\n' + trimmed;
```
</details>

---

**⚡ Performance** · lines 129-136

**`VectorIndex.search` performs O(n) linear scan with no index structure.**

For a production legal document store, the chunk count will grow quickly. The current implementation computes cosine similarity for every chunk on every search. With hundreds of thousands of chunks, latency will be unacceptable.

**Fix:** Consider using a k-d tree, FAISS (via WASM), or the planned PGVector migration. In the short term, add a comment noting the scalability limit and a rough chunk-count threshold.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /**
   * Search by embedding vector.
   *
   * NOTE: O(n) linear scan — acceptable for <50k chunks.
   * For production scale, migrate to PGVector (HNSW index) or FAISS.
   */
  search(
    queryEmbedding: number[],
    topK: number = 10,
    minScore: number = 0.5,
    domainTags?: LegalDomain[],
  ): SearchResult[] {
    const results: SearchResult[] = [];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  /** Search by embedding vector */
  search(
    queryEmbedding: number[],
    topK: number = 10,
    minScore: number = 0.5,
    domainTags?: LegalDomain[],
  ): SearchResult[] {
    const results: SearchResult[] = [];
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 204-235

**Duplicate API call logic in `embedText` and `embedBatch`.**

The API key check, base URL construction, fetch call, and error handling are duplicated between the two functions (lines 189-199 and 243-256). If the embedding model or API endpoint changes, both functions must be updated.

**Fix:** Extract the common fetch logic into a shared helper (e.g., `callEmbeddingApi(input: string | string[])`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
async function callEmbeddingApi(input: string | string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  if (!apiKey) return null;

  try {
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input,
      }),
      signal: AbortSignal.timeout(Array.isArray(input) ? 60_000 : 30_000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index?: number }>;
    };
    return data.data
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((d) => d.embedding);
  } catch (err) {
    console.error('[callEmbeddingApi] Failed:', err);
    return null;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  if (apiKey) {
    try {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          data: Array<{ embedding: number[] }>;
        };
        return data.data[0]?.embedding ?? pseudoEmbed(text);
      }
    } catch {
      // Fall through to pseudo-embedding
    }
  }

  return pseudoEmbed(text);
}
```
</details>


