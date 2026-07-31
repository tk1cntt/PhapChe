# Review: `src/app/[locale]/cases/[id]/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 12

---

## 🔴 Critical (2)

**🔒 Security** · line 50

**Workspace Isolation Bypass:** Using `session.activeWorkspaceId ?? undefined` in Prisma `where` clauses causes the workspace filter to be silently dropped when `activeWorkspaceId` is null/undefined. In Prisma, `undefined` values in `where` are ignored, meaning the query runs without a workspace constraint — potentially exposing legal requests from other workspaces to the current user.

Fix: explicitly check that `activeWorkspaceId` exists before querying, or throw an error if it is missing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Ensure workspace isolation
    const activeWsId = session.activeWorkspaceId;
    if (!activeWsId) {
      throw new Error('No active workspace selected');
    }
    // ... then use activeWsId directly in where clauses
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    where: { workspaceId: session.activeWorkspaceId ?? undefined },
```
</details>

---

**🔒 Security** · line 67

Same workspace isolation bypass issue in the `legalRequest.findFirst` query. When `activeWorkspaceId` is null, `?? undefined` causes Prisma to ignore the `workspaceId` filter entirely.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      workspaceId: activeWsId,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      workspaceId: session.activeWorkspaceId ?? undefined,
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 44-45

**Missing error handling for Prisma queries:** Both `prisma.user.findUnique` and `prisma.legalRequest.findFirst` are not wrapped in try-catch. Any database error (connection failure, timeout, schema mismatch) will result in an unhandled rejection and a raw 500 error page, giving a poor user experience and potentially leaking stack traces.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
```
</details>

---

**🐛 Bug** · line 64

Second unguarded Prisma call — same missing error handling issue as above.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  let legalRequest;
  try {
    legalRequest = await prisma.legalRequest.findFirst({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const legalRequest = await prisma.legalRequest.findFirst({
```
</details>


## 🟡 Medium (5)

**🐛 Bug** · lines 105-106

**Unsafe `as any` cast for translation keys:** `tMatter(mtKey as any)` and `tDesc(mtKey as any)` bypass TypeScript type checking. If `mtKey` is not a valid translation key, `next-intl` may throw a runtime error. Consider validating the key against known matter type keys before calling the translation function, or use a fallback value.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const matterTypeLabel = mtKey ? (tMatter as any)(mtKey) as string : legalRequest.title;
  const matterTypeDescription: string | null = mtKey ? (tDesc as any)(mtKey) as string : null;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const matterTypeLabel = mtKey ? tMatter(mtKey as any) : legalRequest.title;
  const matterTypeDescription: string | null = mtKey ? tDesc(mtKey as any) : null;
```
</details>

---

**🐛 Bug** · line 112

**Unsafe type cast for `contactInfo` JSON field:** `as Record<string, string>` assumes the stored JSON is always a flat object of strings. If the database contains an array, a number, or deeply nested objects, destructuring `contactInfo.email` etc. may produce unexpected values or cause runtime errors. Consider using a runtime validation (e.g., Zod schema) or at minimum a defensive type guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const contactInfo = legalRequest.contactInfo as Record<string, unknown> | null;
  const contactInfoSafe = contactInfo && typeof contactInfo === 'object' && !Array.isArray(contactInfo)
    ? {
        email: String(contactInfo.email ?? ''),
        phone: String(contactInfo.phone ?? ''),
        companyName: String(contactInfo.companyName ?? ''),
        taxCode: String(contactInfo.taxCode ?? ''),
      }
    : null;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const contactInfo = legalRequest.contactInfo as Record<string, string> | null;
```
</details>

---

**🐛 Bug** · lines 100-102

**Fragile SLA remaining days calculation:** When `remainingMs` is negative but very small (e.g., -1ms), `Math.ceil(-1/86400000)` yields `-0` (which is `0`), hiding the overdue state. The sign-flipping logic `isOverdue ? -remainingDays : remainingDays` is also confusing and error-prone. Consider using `Math.floor` for deadline calculations to consistently round toward zero, or use a simpler approach like `Math.ceil(remainingMs / MS_PER_DAY)` with explicit handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const remainingMs = deadline.getTime() - now.getTime();
  const remainingDays = remainingMs > 0
    ? Math.ceil(remainingMs / MS_PER_DAY)
    : Math.floor(remainingMs / MS_PER_DAY);
  const isOverdue = remainingMs < 0 && !['approved', 'delivered', 'closed', 'cancelled'].includes(legalRequest.status);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const remainingMs = deadline.getTime() - now.getTime();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const isOverdue = remainingMs < 0 && !['approved', 'delivered', 'closed', 'cancelled'].includes(legalRequest.status);
```
</details>

---

**🐛 Bug** · line 108

**Unsafe JSON cast for `answers`:** Casting `intakeSubmission?.answers` as `Record<string, string>` without validation assumes the JSON field is always a flat key-value object. If the stored data has a different shape, accessing `answers[a.key]` may produce unexpected results or crash.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const rawAnswers = legalRequest.intakeSubmission?.answers ?? {};
  const answers: Record<string, unknown> = typeof rawAnswers === 'object' && !Array.isArray(rawAnswers) ? rawAnswers as Record<string, unknown> : {};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const answers = (legalRequest.intakeSubmission?.answers ?? {}) as Record<string, string>;
```
</details>

---

**🐛 Bug** · lines 109-111

**Unsafe JSON cast for `answerLabels`:** Casting `intakeSubmission?.answerLabels` as `Array<{key: string; label: string; required: boolean}>` without validation assumes the JSON field is always an array of the expected shape. If the stored data is malformed, mapping over it may fail.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const rawAnswerLabels = legalRequest.intakeSubmission?.answerLabels;
  const answerLabels: Array<{key: string; label: string; required: boolean}> = Array.isArray(rawAnswerLabels) ? rawAnswerLabels : [];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const answerLabels = (legalRequest.intakeSubmission?.answerLabels ?? []) as Array<{
    key: string; label: string; required: boolean;
  }>;
```
</details>


## 🔵 Low (3)

**🔧 Maintainability** · lines 15-16

**Hardcoded business status labels:** `STATUS_LABELS` and `STATUS_COLORS` are hardcoded Vietnamese strings. For a multi-locale app (this page already uses `next-intl`), these should ideally come from translation files rather than being hardcoded constants.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider moving these to translation files for i18n support
const STATUS_LABELS: Record<string, string> = {
  draft_intake: 'Nháp',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const STATUS_LABELS: Record<string, string> = {
  draft_intake: 'Nháp',
```
</details>

---

**🎨 Style** · line 135

**Nested ternary expression:** The `specialistRole` assignment uses a nested ternary (`a ? x : b ? y : z`), which is prohibited by the project's code quality rules. Nested ternaries reduce readability and are error-prone.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          specialistRole: (() => {
            if (legalRequest.assignedSpecialist) return 'Chuyên viên';
            if (legalRequest.assignedReviewer) return 'Người duyệt';
            return null;
          })(),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          specialistRole: legalRequest.assignedSpecialist ? 'Chuyên viên' : legalRequest.assignedReviewer ? 'Người duyệt' : null,
```
</details>

---

**⚡ Performance** · lines 44-64

**Sequential Prisma queries instead of parallel:** `prisma.user.findUnique` and `prisma.legalRequest.findFirst` are independent queries but executed sequentially. They could be run in parallel with `Promise.all` to reduce page load time.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [user, tMatter, tDesc, legalRequest] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        memberships: {
          where: { workspaceId: session.activeWorkspaceId ?? undefined },
          select: { workspace: { select: { name: true, slug: true } } },
        },
      },
    }),
    getTranslations('MatterTypes'),
    getTranslations('MatterTypeDescriptions'),
    prisma.legalRequest.findFirst({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      memberships: {
        where: { workspaceId: session.activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } },
      },
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  const tMatter = await getTranslations('MatterTypes');
  const tDesc = await getTranslations('MatterTypeDescriptions');

  const legalRequest = await prisma.legalRequest.findFirst({
```
</details>


