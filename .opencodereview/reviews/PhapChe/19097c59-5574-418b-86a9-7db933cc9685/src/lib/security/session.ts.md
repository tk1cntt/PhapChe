# Review: `src/lib/security/session.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 5

---

## 🟠 High (1)

**🐛 Bug** · lines 39-48

Missing error handling for async calls: `auth.api.getSession` and `prisma.user.findFirst` are not wrapped in try/catch. If the auth service or database fails (e.g., connection timeout, network error), the unhandled exception will propagate as a 500 error instead of a graceful redirect or user-friendly error page.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function requireAppSession(reqHeaders?: Headers): Promise<AppSession> {
  const h = reqHeaders ?? await headers();
  let session;
  try {
    session = await auth.api.getSession({ headers: h });
  } catch {
    const pathname = h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }
  if (!session?.user?.id) {
    const pathname = h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }

  const userId = session.user.id;
  let user;
  try {
    user = await prisma.user.findFirst({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function requireAppSession(reqHeaders?: Headers): Promise<AppSession> {
  const h = reqHeaders ?? await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user?.id) {
    const pathname = h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
  }

  const userId = session.user.id;
  const user = await prisma.user.findFirst({
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 69-73

Non-deterministic `activeWorkspaceId` selection: when multiple memberships share the same highest-priority role, `reduce` picks the first iterated membership, which is non-deterministic because the query lacks `orderBy`. This can cause the active workspace to flip between requests, leading to inconsistent UI behavior. Consider adding `orderBy` (e.g., by `workspaceId` or `createdAt`) to ensure deterministic selection.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Sort memberships to ensure deterministic tie-breaking when roles have equal priority
  const sorted = [...user.memberships].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId));
  const bestMembership = sorted.reduce((best, m) => {
    const bestPriority = ROLE_PRIORITY[best.role] ?? 0;
    const mPriority = ROLE_PRIORITY[m.role] ?? 0;
    return mPriority > bestPriority ? m : best;
  }, sorted[0]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const bestMembership = user.memberships.reduce((best, m) => {
    const bestPriority = ROLE_PRIORITY[best.role] ?? 0;
    const mPriority = ROLE_PRIORITY[m.role] ?? 0;
    return mPriority > bestPriority ? m : best;
  }, user.memberships[0]);
```
</details>

---

**🐛 Bug** · lines 20-27

Unsafe role casting and priority lookup: `m.role as AppRole` is a type assertion that silently coerces any database string into the `AppRole` type without validation. Additionally, `ROLE_PRIORITY` is typed as `Record<string, number>`, so unknown roles fall through with priority 0 — silently treated as lowest privilege. This masks data integrity issues and could lead to incorrect authorization decisions. Consider using a runtime guard or narrowing the priority map type to `Record<AppRole, number>`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const ROLE_PRIORITY: Record<AppRole, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
};

function assertAppRole(role: string): AppRole {
  if (!(role in ROLE_PRIORITY)) {
    throw new Error(`Unknown role: ${role}`);
  }
  return role as AppRole;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
};
```
</details>

---

**🔒 Security** · lines 43-44

Reliance on custom header `x-pathname` for redirect URL construction: if this header is not properly set by the server middleware or is forwarded from client requests, it could be manipulated by attackers to redirect users to arbitrary paths (open redirect via the `returnUrl` parameter). While `encodeURIComponent` provides some protection, the source of truth should be the actual request URL from a trusted source (e.g., Next.js `headers().get('x-invoke-path')` or the request object itself) rather than a custom header that may be client-controlled.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Prefer a trusted source for the current pathname, not a client-settable header
    const pathname = h.get('x-invoke-path') ?? h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const pathname = h.get('x-pathname') ?? '';
    redirect(buildSignInUrl(pathname));
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 29-36

Hardcoded sign-in URL path `/sign-in` and locale list `['vi', 'en', 'zh', 'ja']`: these business-related values are embedded directly in the utility function. If the sign-in route or supported locales change, they must be updated in multiple places. Consider extracting them into a shared constants module.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider moving these to a shared constants/config module
const DEFAULT_LOCALE = 'vi';
const VALID_LOCALES = ['vi', 'en', 'zh', 'ja'];
const SIGN_IN_PATH = '/sign-in';

function buildSignInUrl(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const locale = VALID_LOCALES.includes(segments[0] ?? '') ? segments[0] : DEFAULT_LOCALE;
  const returnUrl = encodeURIComponent(pathname);
  return `/${locale}${SIGN_IN_PATH}?returnUrl=${returnUrl}`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const DEFAULT_LOCALE = 'vi';
const VALID_LOCALES = ['vi', 'en', 'zh', 'ja'];

function buildSignInUrl(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const locale = VALID_LOCALES.includes(segments[0] ?? '') ? segments[0] : DEFAULT_LOCALE;
  const returnUrl = encodeURIComponent(pathname);
  return `/${locale}/sign-in?returnUrl=${returnUrl}`;
```
</details>


