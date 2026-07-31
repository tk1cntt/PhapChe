# Review: `src/app/api/admin/requests/triage/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 8

---

## 🔴 Critical (3)

**🐛 Bug** · line 29

**NaN Risk**: `parseInt` returns `NaN` for non-numeric strings (e.g., `?pageSize=abc`). `Math.max(5, NaN)` and `Math.min(50, NaN)` both return `NaN`, which propagates to `skip` and `take`, breaking the Prisma query. The same applies to `page` on line 26. Use `Number.isNaN` checks or default to safe values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const rawPageSize = parseInt(searchParams.get('pageSize') || '10', 10);
const pageSize = Number.isNaN(rawPageSize) ? 10 : Math.min(50, Math.max(5, rawPageSize));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
```
</details>

---

**🐛 Bug** · line 28

**NaN Risk on `page`**: Same issue as `pageSize` — `parseInt` returns `NaN` for non-numeric input, and `Math.max(1, NaN)` yields `NaN`, which propagates to `skip` and breaks the Prisma query. Apply the same `Number.isNaN` guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const rawPage = parseInt(searchParams.get('page') || '1', 10);
const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
```
</details>

---

**🐛 Bug** · lines 133-136

**Redirect interception**: `requireAppSession` calls `redirect()` from `next/navigation` (line 44/62 of session.ts), which throws a `NEXT_REDIRECT` error. This catch block catches all errors indiscriminately, converting the intended redirect into a 500 error response. Re-throw the redirect error to let Next.js handle it properly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    // Re-throw Next.js redirect errors so they are handled by the framework
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Admin triage error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Admin triage error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
  }
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 80

**Duplicate fallback codes across pages**: The fallback code uses `index` (the loop index within the current page, resetting to 0 on each page). If two requests on different pages both lack a `code`, they will receive the same temporary code (e.g., `REQ-2026-001`), violating uniqueness. Consider using `skip + index + 1` or a UUID-based fallback instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
code: req.code ?? `REQ-${new Date().getFullYear()}-${String(skip + index + 1).padStart(5, '0')}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
code: req.code ?? `REQ-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
```
</details>

---

**🐛 Bug** · line 104

**Null `workspaceId` in `in` filter**: `workspaceIds` may contain `null` if any triage request has `workspaceId: null`. When passed to Prisma's `workspaceId: { in: [null, ...] }`, Prisma interprets `null` as matching `IS NULL` rows, which is likely unintended — it could return memberships for workspace-less records across the database. Filter out null/undefined values: `workspaceIds.filter(Boolean)`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const workspaceIds = [...new Set(triageRequests.map(r => r.workspaceId).filter(Boolean))];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const workspaceIds = [...new Set(triageRequests.map(r => r.workspaceId))];
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 80

**Empty string `code` not handled**: The nullish coalescing operator (`??`) only catches `null`/`undefined`, not empty strings. If `req.code` is `''`, it will pass through as an empty string instead of falling back to the generated code. Consider `req.code || ...` or explicitly checking for empty strings.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
code: req.code || `REQ-${new Date().getFullYear()}-${String(skip + index + 1).padStart(5, '0')}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
code: req.code ?? `REQ-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
```
</details>


## 🔵 Low (2)

**🎨 Style** · line 92

**Non-strict equality `!=`**: Per the review checklist, using `!=` is prohibited. Use strict equality `!== null && !== undefined` instead, or consider `!!req.intakeSubmission?.answers` if answers is always truthy when present.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
hasAnswers: req.intakeSubmission?.answers !== null && req.intakeSubmission?.answers !== undefined,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
hasAnswers: req.intakeSubmission?.answers != null,
```
</details>

---

**🔧 Maintainability** · line 135

**Redundant `detail` field in error response**: The `detail` field duplicates the `error` message (`'Internal server error'`) and adds no value. Either remove it or populate it with a meaningful, non-sensitive error detail for debugging purposes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
```
</details>


