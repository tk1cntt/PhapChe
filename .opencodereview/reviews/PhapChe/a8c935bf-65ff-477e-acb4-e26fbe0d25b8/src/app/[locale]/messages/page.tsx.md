# Review: `src/app/[locale]/messages/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🔴 Critical (1)

**🐛 Bug** · lines 32-44

Missing error handling for the entire data fetching block. All Prisma queries (lines 52-108) and session resolution (line 47) are not wrapped in try/catch. Any database connection failure, query error, or session issue will result in an unhandled promise rejection, causing a 500 error page with no user-friendly feedback. Wrap the data fetching logic in try/catch and render an appropriate error state or fallback UI.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const t = await getTranslations('UserMessages');
  const tMatter = await getTranslations('MatterTypes');

  try {
    // Fetch user info
    const user = await prisma.user.findUnique({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const t = await getTranslations('UserMessages');
  const tMatter = await getTranslations('MatterTypes');

  // Fetch user info
  const user = await prisma.user.findUnique({
```
</details>


## 🟠 High (1)

**🔧 Maintainability** · lines 22-30

Hardcoded Vietnamese strings ('vừa xong', 'p', 'h', 'd') in `formatRelativeTime` break i18n consistency. This is a multilingual page using `next-intl`, yet relative time labels are hardcoded in Vietnamese. Use `next-intl` translations (e.g., `t('justNow')`, `t('minutesAgo')`, `t('hoursAgo')`, `t('daysAgo')`) so the relative time formatting respects the user's locale.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider using next-intl relative time formatting or a library like date-fns/intl
// to produce locale-aware relative time strings instead of hardcoded Vietnamese.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}p`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · lines 113-116

Use of `any` type for `dbMessages` (`Record<string, any[]>`) and `dbCaseInfo` (`Record<string, any>`) loses all type safety. Define explicit interfaces (e.g., `MessageData` with `id`, `content`, `senderId`, `senderName`, `isOutgoing`, `createdAt` fields, and `CaseInfo` with the known fields) so TypeScript can catch structural mismatches at compile time.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  interface MessageData {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    isOutgoing: boolean;
    createdAt: string;
  }

  const dbMessages: Record<string, MessageData[]> = {};
  threadIds.forEach((id) => {
    dbMessages[id] = [];
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const dbMessages: Record<string, any[]> = {};
  threadIds.forEach((id) => {
    dbMessages[id] = [];
  });
```
</details>

---

**🐛 Bug** · lines 172-173

Unsafe `as any` cast on `tMatter(mtKey as any)`. If `mtKey` is not a valid translation key in the `MatterTypes` namespace, `tMatter` will return the raw key string at runtime without any compile-time warning. The `as any` cast circumvents TypeScript's key validation entirely. Use a type-safe fallback: `const matterTypeDisplay = mtKey && (mtKey in matterTypeKeys) ? tMatter(mtKey as MatterTypeKey) : (req.matterType || 'Legal Request');`

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const mtKey = (req as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key;
    const matterTypeDisplay = mtKey
      ? tMatter(mtKey as Parameters<typeof tMatter>[0]) 
      : (req.matterType || 'Legal Request');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const mtKey = (req as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key;
    const matterTypeDisplay = mtKey ? tMatter(mtKey as any) : (req.matterType || 'Legal Request');
```
</details>

---

**🐛 Bug** · lines 81-86

Conditional Prisma `include` guarded by `isEnabled('DB_MIGRATION_PHASE4')` (lines 66-72) means `matterTypeRef` may be absent from the query result. Later at line 139 the code unconditionally casts `req` to access `matterTypeRef?.key`, which is safe due to optional chaining, but the runtime cast `(req as { matterTypeRef?: ... })` is misleading — it suggests the property always exists. If the feature flag is off, `matterTypeRef` will simply be `undefined` and the fallback is used. While this doesn't crash, the conditional include pattern is fragile: if someone removes the fallback later, it will silently break when the flag is off. Consider always including `matterTypeRef` (since Prisma ignores unknown includes) or use a typed union.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Always include matterTypeRef; Prisma simply returns null for relations
        // that don't exist yet, and optional chaining handles it safely.
        matterTypeRef: {
          select: { id: true, key: true },
        },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        // Include matterTypeRef for new FK-based approach
        ...(isEnabled('DB_MIGRATION_PHASE4') ? {
          matterTypeRef: {
            select: { id: true, key: true },
          },
        } : {}),
```
</details>

---

**🐛 Bug** · lines 62-64

`activeWorkspaceId ?? ''` falls back to an empty string when `activeWorkspaceId` is null/undefined. This passes `workspaceId: ''` to Prisma queries, which may match no records (or unexpectedly match records with an empty workspaceId). If `activeWorkspaceId` is required for the page to function, consider redirecting or throwing early rather than silently querying with an empty string. If it's optional, use `activeWorkspaceId ?? undefined` so Prisma ignores the filter.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    prisma.message.count({
      where: { workspaceId: activeWorkspaceId ?? undefined },
    }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    prisma.message.count({
      where: { workspaceId: activeWorkspaceId ?? '' },
    }),
```
</details>


## 🔵 Low (1)

**🐛 Bug** · line 190

`openThreads` calculation `Math.min(3, Math.max(1, Math.floor(totalConversations / 2)))` always returns at least 1, even when `totalConversations` is 0. This would display '1 open thread' when there are actually 0 conversations. Consider allowing 0: `Math.min(3, Math.floor(totalConversations / 2))`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const openThreads = Math.min(3, Math.floor(totalConversations / 2));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const openThreads = Math.min(3, Math.max(1, Math.floor(totalConversations / 2)));
```
</details>


