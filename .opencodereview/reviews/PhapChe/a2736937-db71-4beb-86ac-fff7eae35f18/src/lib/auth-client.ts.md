# Review: `src/lib/auth-client.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 1

---

## 🟠 High (1)

**🐛 Bug** · lines 2-4

When this module runs on the server (SSR) and the `BETTER_AUTH_URL` environment variable is not set, `baseURL` will be `undefined`. This causes the auth client to make API calls to an undefined URL, resulting in runtime errors that are difficult to debug. Consider providing a default fallback or throwing a clear error early.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.BETTER_AUTH_URL || (() => { throw new Error('BETTER_AUTH_URL environment variable is required on the server'); })())
});
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.BETTER_AUTH_URL
});
```
</details>


