# Review: `src/lib/ai/legal-knowledge/index.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 4

---

## 🟠 High (2)

**🐛 Bug** · lines 55-63

**Race condition: initialization guard is not atomic.**

`isVectorStoreReady()` is checked before any indexing completes, but the loop contains `await` points. If two callers invoke `initializeLegalKnowledge()` concurrently, both can pass the guard before the first document finishes indexing, leading to duplicate work and potential inconsistent state.

**Fix:** Use a module-level promise as a mutex — save the pending initialization promise and return it if already in progress.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Deduplicate concurrent initialization calls
  if (_initPromise) return _initPromise;

  // Skip if already initialized (post-await re-check inside _initPromise)
  if (isVectorStoreReady()) {
    const stats = getIndexStats();
    return {
      indexed: stats.documentCount,
      totalChunks: stats.chunkCount,
      sources: stats.sources.map((s) => s.source),
    };
  }

  _initPromise = doInitialize();
  return _initPromise;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Skip if already initialized
  if (isVectorStoreReady()) {
    const stats = getIndexStats();
    return {
      indexed: stats.documentCount,
      totalChunks: stats.chunkCount,
      sources: stats.sources.map((s) => s.source),
    };
  }
```
</details>

---

**🐛 Bug** · lines 68-83

**Missing error handling: `removeDocument` is called before `indexDocument`, but if `indexDocument` throws, the document's chunks are already deleted and never re-added.**

This leaves the vector store in an inconsistent state — the document is partially or fully missing with no recovery path. The caller also gets no indication of which documents succeeded or failed.

**Fix:** Wrap each document's indexing in try/catch, and only call `removeDocument` after successful indexing (or use a two-phase approach: remove old chunks after new ones are added). Collect errors and report them to the caller.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const errors: Array<{ docId: string; error: string }> = [];

  for (const doc of ALL_DOCUMENTS) {
    try {
      const text = buildDocumentText(doc);
      const chunks = await indexDocument(
        doc.id,
        doc.source,
        text,
        doc.domainTags,
        { version: doc.version },
      );

      totalChunks += chunks;
      sources.push(doc.source);
    } catch (err) {
      errors.push({
        docId: doc.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  for (const doc of ALL_DOCUMENTS) {
    // Remove existing index for this doc first (in case of re-init)
    vectorIndex.removeDocument(doc.id);

    const text = buildDocumentText(doc);
    const chunks = await indexDocument(
      doc.id,
      doc.source,
      text,
      doc.domainTags,
      { version: doc.version },
    );

    totalChunks += chunks;
    sources.push(doc.source);
  }
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 55-63

**Stale guard: `isVectorStoreReady()` is a global check, not per-document.**

Once *any* data exists in the vector store (e.g., from a single law), this early return prevents newly added documents from being indexed on subsequent calls. If `ALL_DOCUMENTS` grows or documents are updated, those changes are silently ignored.

**Fix:** Consider tracking which specific document IDs have been indexed (e.g., via a `Set<string>` or checking `getIndexStats().sources` against `ALL_DOCUMENTS`), so only unindexed documents are processed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Check which documents still need indexing
  const stats = getIndexStats();
  const indexedIds = new Set(stats.sources.map((s) => s.documentId));
  const pending = ALL_DOCUMENTS.filter((d) => !indexedIds.has(d.id));
  if (pending.length === 0) {
    return {
      indexed: stats.documentCount,
      totalChunks: stats.chunkCount,
      sources: stats.sources.map((s) => s.source),
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Skip if already initialized
  if (isVectorStoreReady()) {
    const stats = getIndexStats();
    return {
      indexed: stats.documentCount,
      totalChunks: stats.chunkCount,
      sources: stats.sources.map((s) => s.source),
    };
  }
```
</details>

---

**⚡ Performance** · lines 68-83

**Sequential async in loop: independent documents are indexed one at a time.**

Each document's indexing is independent (they don't depend on each other). Using `Promise.all` (or `Promise.allSettled` for error isolation) would parallelize the embedding calls and complete initialization significantly faster.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const results = await Promise.allSettled(
    ALL_DOCUMENTS.map(async (doc) => {
      const text = buildDocumentText(doc);
      const chunks = await indexDocument(
        doc.id,
        doc.source,
        text,
        doc.domainTags,
        { version: doc.version },
      );
      return { doc, chunks };
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalChunks += result.value.chunks;
      sources.push(result.value.doc.source);
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  for (const doc of ALL_DOCUMENTS) {
    // Remove existing index for this doc first (in case of re-init)
    vectorIndex.removeDocument(doc.id);

    const text = buildDocumentText(doc);
    const chunks = await indexDocument(
      doc.id,
      doc.source,
      text,
      doc.domainTags,
      { version: doc.version },
    );

    totalChunks += chunks;
    sources.push(doc.source);
  }
```
</details>


