# Review: `src/app/[locale]/sign-in/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 7-12

Static inline styles are used for the background gradient (`radial-gradient` and `linear-gradient`). These are purely decorative and not dynamic, so they should be moved to a CSS class or Tailwind configuration. Inline styles bypass browser CSS caching, complicate style maintenance, and violate the React best practice of avoiding inline `style` attributes except for truly dynamic values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-white to-slate-50"
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      style={{
        backgroundImage: `
          radial-gradient(circle at top right, rgba(20,184,166,.12), transparent 35%),
          linear-gradient(180deg, #ffffff, #f8fafc)
        `,
      }}
```
</details>


