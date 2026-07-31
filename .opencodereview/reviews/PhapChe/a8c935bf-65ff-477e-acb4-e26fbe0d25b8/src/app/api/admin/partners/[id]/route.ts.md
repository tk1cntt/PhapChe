# Review: `src/app/api/admin/partners/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 13

---

## 🔴 Critical (3)

**🐛 Bug** · line 128

Fake random data in relatedUsers description: Using `Math.random()` to generate a fake number of open records (`Math.floor(Math.random() * 5) + 1`) produces incorrect, misleading data sent to the client. This should be replaced with an actual database query or a truthful placeholder like `'N/A'`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      description: `${m.role === 'partner_admin' ? 'Partner Admin' : m.role}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      description: `${m.role === 'partner_admin' ? 'Partner Admin' : m.role} · owner của ${Math.floor(Math.random() * 5) + 1} hồ sơ đang mở`,
```
</details>

---

**🐛 Bug** · line 146

Fake timeline requestCode: Using `Date.now().toString().slice(-6)` generates a fabricated request code based on the current timestamp instead of the actual `log.requestId`. This produces incorrect timeline data sent to the client.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      requestCode: log.requestId || undefined,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      requestCode: log.requestId ? `REQ-${Date.now().toString().slice(-6)}` : undefined,
```
</details>

---

**🐛 Bug** · line 179

Fake document size in auditLogsForFeed: `Math.floor(Math.random() * 5 + 1) + '.1 MB'` generates a completely fabricated file size. This is misleading and should be removed or replaced with actual metadata from the audit log.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // TODO: retrieve actual docSize from storage metadata
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          meta.docSize = Math.floor(Math.random() * 5 + 1) + '.1 MB';
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 223-228

Fake stats calculations: `documents: Math.floor(activeRequests * 1.5)` and `workspaces: partner.engagements.length * 2` are fabricated metrics with no basis in real data. These should be replaced with actual database queries or omitted until real data is available.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        stats: {
          activeRequests,
          completedRequests,
          slaRisk: slaAtRiskRequests,
          // TODO: replace with actual document count query
          documents: 0,
          workspaces: partner.engagements.length,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        stats: {
          activeRequests,
          completedRequests,
          slaRisk: slaAtRiskRequests,
          documents: Math.floor(activeRequests * 1.5),
          workspaces: partner.engagements.length * 2,
```
</details>


## 🟡 Medium (7)

**🔧 Maintainability** · line 166

Use of `any` type for `meta` variable loses type safety. Define a proper interface for the metadata shape, or at minimum add a comment explaining why `any` is necessary.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      let meta: Record<string, unknown> = {};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      let meta: any = {};
```
</details>

---

**🐛 Bug** · lines 167-171

Empty catch block silently swallows JSON parse errors from `log.metadataSummary`. If parsing fails, the error is silently ignored, hiding potential data corruption. At minimum, log the error for observability.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      try {
        if (log.metadataSummary) {
          meta = typeof log.metadataSummary === 'string' ? JSON.parse(log.metadataSummary) : log.metadataSummary;
        }
      } catch (e) {
        console.warn('Failed to parse metadataSummary:', e);
        meta = {};
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      try {
        if (log.metadataSummary) {
          meta = typeof log.metadataSummary === 'string' ? JSON.parse(log.metadataSummary) : log.metadataSummary;
        }
      } catch {}
```
</details>

---

**🔧 Maintainability** · lines 250-253

Hardcoded business numbers: `max: 32`, `activeRequests * 0.5`, and `activeRequests * 1.5` are magic numbers scattered across the response builder. These should be extracted into named constants or configuration values to improve maintainability and reduce the risk of stale values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        capacity: {
          openRequests: { current: activeRequests, max: MAX_OPEN_REQUESTS },
          slaOnTime: completedRequests > 0 ? Math.round((completedRequests / (completedRequests + slaAtRiskRequests)) * 100) : 100,
          pendingDocs: Math.floor(activeRequests * PENDING_DOCS_MULTIPLIER),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        capacity: {
          openRequests: { current: activeRequests, max: 32 },
          slaOnTime: completedRequests > 0 ? Math.round((completedRequests / (completedRequests + slaAtRiskRequests)) * 100) : 100,
          pendingDocs: Math.floor(activeRequests * 0.5),
```
</details>

---

**🐛 Bug** · lines 10-13

Unused parameter: `req: NextRequest` is declared but never used in the function body. While this is required by Next.js route handler signature, consider prefixing with underscore (`_req`) to signal intent and avoid linting warnings.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
```
</details>

---

**🐛 Bug** · lines 132-140

Potential duplicate entries in `relatedUsers`: customer users are pushed from `recentRequests` without deduplication. The same customer could appear multiple times if they have multiple recent requests. Also, `slice(0, 3)` on push plus `slice(0, 5)` on return means the deduplication should happen at the collection level, not just at truncation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const seenIds = new Set(partner.members.map((m) => m.user.id));
    const customerUsers = recentRequests
      .filter((r) => r.createdBy && !seenIds.has(r.createdBy.id))
      .map((r) => {
        seenIds.add(r.createdBy!.id);
        return {
          id: r.createdBy!.id,
          name: r.createdBy!.name,
          role: 'customer' as const,
          description: `Customer · tương tác về hồ sơ`,
        };
      });
    relatedUsers.push(...customerUsers.slice(0, 3));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const customerUsers = recentRequests
      .filter((r) => r.createdBy)
      .map((r) => ({
        id: r.createdBy!.id,
        name: r.createdBy!.name,
        role: 'customer' as const,
        description: `Customer · tương tác về hồ sơ`,
      }));
    relatedUsers.push(...customerUsers.slice(0, 3));
```
</details>

---

**🐛 Bug** · line 252

Misleading SLA calculation: `slaOnTime` divides completed requests by `completedRequests + slaAtRiskRequests`. However, `slaAtRiskRequests` counts requests within 24h of deadline, not requests that actually missed SLA. This makes the percentage inaccurate. Consider renaming or using actual SLA-missed count.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // TODO: slaOnTime should use actual SLA-breach count, not at-risk count
          slaOnTime: completedRequests > 0 ? Math.round((completedRequests / (completedRequests + slaAtRiskRequests)) * 100) : 100,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          slaOnTime: completedRequests > 0 ? Math.round((completedRequests / (completedRequests + slaAtRiskRequests)) * 100) : 100,
```
</details>

---

**🐛 Bug** · lines 254-256

`slaRisks.requests` maps over `recentRequests` (the 20 most recent requests overall) instead of actual SLA-at-risk requests. This produces misleading data — it shows recent request codes regardless of whether they are SLA-at-risk. Should query or filter for actual SLA-at-risk requests instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          slaRisks: {
            count: slaAtRiskRequests,
            // TODO: should query actual SLA-at-risk requests, not just recent ones
            requests: slaAtRiskRequests > 0 ? recentRequests.filter(r => r.slaDeadline && new Date(r.slaDeadline) <= new Date(Date.now() + 24 * 60 * 60 * 1000)).slice(0, 2).map(r => r.code || 'N/A').join(', ') : '',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          slaRisks: {
            count: slaAtRiskRequests,
            requests: slaAtRiskRequests > 0 ? recentRequests.slice(0, 2).map(r => r.code || 'N/A').join(', ') : '',
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 258

Hardcoded Vietnamese UI strings (e.g., 'Không có quyền cần rà soát', 'hồ sơ đang mở', 'tương tác về hồ sơ') are embedded directly in the API response builder. These should come from i18n configuration or at minimum be extracted into constants to support localization.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          accessReview: { count: 0, description: 'No permissions to review' },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          accessReview: { count: 0, description: 'Không có quyền cần rà soát' },
```
</details>

---

**🔧 Maintainability** · line 143

Unused variable `index` in map callback. If not needed, it should be omitted to avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const timeline = recentAuditLogs.slice(0, 4).map((log) => ({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const timeline = recentAuditLogs.slice(0, 4).map((log, index) => ({
```
</details>


