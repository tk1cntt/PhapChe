# Review: `src/app/invite/[token]/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 41-47

**Critical Bug: Hardcoded mock invite data instead of API call.** The `useEffect` sets `inviteInfo` with hardcoded placeholder values (`id: token`, `email: 'invited@example.com'`, `role: 'specialist'`, `partnerName: 'Đối tác Pháp Chế'`). This means:
1. The token is never validated against the server — any URL path like `/invite/anything` will render successfully.
2. The invite details (role, partner, email) are always the same regardless of the actual token.

**Fix:** Replace the hardcoded data with an actual `fetch` call to your invite-lookup API (e.g., `GET /api/partner/invite/${token}`) with proper loading/error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/partner/invite/${token}`);
        if (!res.ok) throw new Error('Token không hợp lệ hoặc đã hết hạn');
        const data = await res.json();
        setInviteInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin lời mời');
      } finally {
        setLoading(false);
      }
    }
    fetchInvite();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    setInviteInfo({
      id: token,
      email: 'invited@example.com',
      role: 'specialist',
      partnerName: 'Đối tác Pháp Chế',
    });
    setLoading(false);
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 50-54

**High Bug: Session check does not wait for auth loading state.** The `handleAccept` function checks `!session` to decide whether to redirect to sign-in, but it does not account for `isPending`. When the auth state is still loading, `session` is `undefined`/`null`, causing a premature redirect to `/sign-in` even for users who are already authenticated. The user should see a loading state (or the button should be disabled) until `isPending` resolves.

**Fix:** Guard the session check with `isPending`, or disable the accept button while `isPending` is true.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const handleAccept = async () => {
    if (isPending) return; // Wait for auth to resolve
    if (!session) {
      router.push(`/sign-in?callbackUrl=/invite/${token}`);
      return;
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const handleAccept = async () => {
    if (!session) {
      router.push(`/sign-in?callbackUrl=/invite/${token}`);
      return;
    }
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · line 94

**Duplicate `@keyframes spin` animation definition.** The same `@keyframes spin { to { transform: rotate(360deg); } }` is defined in both the loading-state return (line 66) and the main-view return (line 195). This is duplicate code; only one definition is needed. Extract the `<style>` tag into a single place (e.g., the top-level return or a layout component).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      </div>
    );
  }

  // Main invite accept view
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
```
</details>

---

**🔧 Maintainability** · lines 85-87

**Extensive use of inline `style` attributes for static values.** Most inline styles in this file (e.g., `textAlign: 'center'`, `fontWeight: 800`, `fontSize: 'var(--text-2xl)'`, `marginBottom: 24`, etc.) are not dynamic and should be defined as CSS classes or CSS modules. Inline styles are only justified for truly dynamic values. This pattern harms maintainability and makes it harder to apply consistent theming.

Consider extracting common styles into a `.module.css` file or using Tailwind/CSS utility classes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider moving static styles to CSS modules or utility classes.
  // Only dynamic values (e.g., computed from props/state) should use inline style.
  const containerClass = 'min-h-screen flex items-center justify-center';
  const cardClass = 'panel';
  const cardStyle: React.CSSProperties = { maxWidth: 448, width: '100%' };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const containerClass = 'min-h-screen flex items-center justify-center';
  const cardClass = 'panel';
  const cardStyle: React.CSSProperties = { maxWidth: 448, width: '100%' };
```
</details>

---

**🔧 Maintainability** · lines 50-60

**Hardcoded URL paths throughout the component.** Multiple URL paths are hardcoded as string literals: `/sign-in`, `/dashboard`, `/`, `/api/partner/invite/accept`. Per the project checklist, business-related hardcoded strings (especially URL paths) should be avoided. These should be extracted into a centralized route constants file (e.g., `routes.ts`) to make refactoring and maintenance easier.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider: import { ROUTES } from '@/lib/routes';
  const handleAccept = async () => {
    if (!session) {
      router.push(`${ROUTES.SIGN_IN}?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(ROUTES.API_INVITE_ACCEPT, {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const handleAccept = async () => {
    if (!session) {
      router.push(`/sign-in?callbackUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/invite/accept', {
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 8-13

**Unused state field `email` in `InviteInfo`.** The `email` field is declared in the `InviteInfo` interface and populated in state, but it is never rendered anywhere in the component. Remove it from the state and interface if it's not needed, or display it in the UI (e.g., below the partner name) to confirm to the user which email was invited.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
interface InviteInfo {
  id: string;
  email: string;
  role: 'admin' | 'specialist' | 'viewer';
  partnerName?: string;
}
```
</details>


