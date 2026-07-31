# Review: `src/app/api/ai/init/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟠 High (1)

**🐛 Bug** · lines 12-14

Race condition: `initializeLegalKnowledge()` is not concurrency-safe. The check `isVectorStoreReady()` (inside the function) is not atomic with the subsequent indexing loop. If two concurrent GET requests arrive before the vector store is initialized, both will see `isVectorStoreReady() === false`, both will call `vectorIndex.removeDocument()` and `indexDocument()`, leading to duplicate chunks and potential data corruption. Consider adding a mutex/lock (e.g., an in-memory promise-based lock) or using a database-level upsert to make this truly idempotent under concurrency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Use a module-level lock to prevent concurrent initialization
let initPromise: Promise<unknown> | null = null;

export async function GET() {
  try {
    // Reuse the existing in-flight promise to avoid duplicate indexing
    if (!initPromise) {
      initPromise = initializeLegalKnowledge();
    }
    const result = await initPromise;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET() {
  try {
    const result = await initializeLegalKnowledge();
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 14

No timeout for the indexing operation. If `initializeLegalKnowledge()` hangs (e.g., vector store is unreachable or slow), this API route will hang until the platform kills it (e.g., Vercel's 60s function timeout). This can cause poor UX and wasted compute. Consider wrapping with `Promise.race` and a timeout, or using `AbortSignal.timeout()`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const result = await Promise.race([
      initializeLegalKnowledge(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_INIT_TIMEOUT')), 50_000),
      ),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const result = await initializeLegalKnowledge();
```
</details>


