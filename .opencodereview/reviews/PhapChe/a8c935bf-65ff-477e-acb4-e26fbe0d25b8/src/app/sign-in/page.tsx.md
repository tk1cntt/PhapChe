# Review: `src/app/sign-in/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 9-11

Avoid inline `style` attributes for maintainability. This inline style for background can be replaced with a Tailwind arbitrary value class: `bg-[var(--color-bg)]`. Inline styles should only be used for truly dynamic/computed values that cannot be expressed via utility classes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: 'var(--color-bg)' }}
      >
```
</details>


