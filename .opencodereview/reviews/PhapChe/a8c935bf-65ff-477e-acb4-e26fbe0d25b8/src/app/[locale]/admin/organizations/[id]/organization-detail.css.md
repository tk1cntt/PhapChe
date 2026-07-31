# Review: `src/app/[locale]/admin/organizations/[id]/organization-detail.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟠 High (1)

**🔧 Maintainability** · lines 5-8

**Hardcoded color values throughout the file** — Hex colors like `#0f766e`, `#0d9488`, `#64748b`, `#0f172a`, `#dfe7f1`, `#edf2f7`, `#f8fafc`, `#fbfdff`, `#ffffff`, `#334155`, `#475569`, and `#94a3b8` are repeated many times (e.g., `#0f766e` appears ~10 times, `#0d9488` appears ~4 times as hover variant). This makes theme changes, dark mode support, and branding updates very error-prone — a single color change requires touching dozens of lines. Consider defining CSS custom properties (design tokens) on a `:root` or theme selector, e.g., `--color-primary: #0f766e;`, `--color-primary-hover: #0d9488;`, `--color-text-primary: #0f172a;`, `--color-text-muted: #64748b;`, etc.

<details>
<summary>:bulb: Suggestion</summary>

```
:root {
  --color-primary: #0f766e;
  --color-primary-hover: #0d9488;
  --color-text-primary: #0f172a;
  --color-text-muted: #64748b;
  --color-text-secondary: #334155;
  --color-border: #dfe7f1;
  --color-border-light: #edf2f7;
  --color-bg-page: #f8fafc;
  --color-bg-card: #ffffff;
  --color-bg-input: #fbfdff;
}

.content {
  background:
    radial-gradient(circle at 82% 8%, rgba(13, 148, 136, 0.08), transparent 28%),
    radial-gradient(circle at 42% 76%, rgba(37, 99, 235, 0.05), transparent 34%),
    var(--color-bg-page);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  background:
    radial-gradient(circle at 82% 8%, rgba(13, 148, 136, 0.08), transparent 28%),
    radial-gradient(circle at 42% 76%, rgba(37, 99, 235, 0.05), transparent 34%),
    #f8fafc;
```
</details>


## 🟡 Medium (3)

**📝 Other** · lines 128-134

**Px-based typography prevents user text scaling** — All font sizes use `px` units (e.g., `font-size: 34px`, `14px`, `13px`, `12px`). When users increase their browser's default font size for accessibility, `px`-based values do not scale. Using `rem` units (relative to the root font size) would respect user preferences. For example, `font-size: 34px` → `font-size: 2.125rem` (assuming 16px base), `font-size: 14px` → `font-size: 0.875rem`.

<details>
<summary>:bulb: Suggestion</summary>

```
.org-details h1 {
  font-size: 2.125rem;
  line-height: 1.15;
  letter-spacing: -0.056em;
  margin: 0 0 0.75rem;
  color: #ffffff;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.org-details h1 {
  font-size: 34px;
  line-height: 1.15;
  letter-spacing: -0.9px;
  margin: 0 0 12px;
  color: #ffffff;
}
```
</details>

---

**📝 Other** · lines 38-41

**Missing `prefers-reduced-motion` media query** — Multiple interactive elements use `transition: all 0.2s` (e.g., `.back-link`, `.btn-edit`, `.btn-delete`, `.quick-action`, `.btn-cancel`, `.btn-save`, `.btn-retry`, `.form-field input`, `.form-field select`). Users with vestibular disorders who have enabled "reduce motion" at the OS level will still see these animations. Consider wrapping transitions in a `@media (prefers-reduced-motion: no-preference)` block or disabling them when the user prefers reduced motion.

<details>
<summary>:bulb: Suggestion</summary>

```
@media (prefers-reduced-motion: no-preference) {
  .back-link {
    transition: all 0.2s;
  }
}

.back-link:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.back-link:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}
```
</details>

---

**📝 Other** · lines 209-211

**Missing `:focus-visible` styles for interactive elements** — Buttons (`.back-link`, `.btn-edit`, `.btn-delete`, `.quick-action`, `.btn-cancel`, `.btn-save`, `.btn-retry`) and form inputs have `:hover` styles but no `:focus-visible` styles. Keyboard-only users navigating via Tab will have no visual indication of which element is focused, making the page difficult or impossible to use without a mouse.

<details>
<summary>:bulb: Suggestion</summary>

```
.btn-edit:hover {
  background: rgba(255, 255, 255, 0.24);
}

.btn-edit:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.btn-edit:hover {
  background: rgba(255, 255, 255, 0.24);
}
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 9

**Magic number in `min-height` calc** — `min-height: calc(100vh - 76px)` on `.content` uses a hardcoded `76px` that presumably represents the header/navbar height. If the header height changes in a redesign, this value will silently break the layout. Consider using a CSS custom property like `--header-height: 76px;` defined centrally, or use a more robust layout approach (e.g., CSS Grid with `grid-template-rows`).

<details>
<summary>:bulb: Suggestion</summary>

```
  min-height: calc(100vh - var(--header-height, 76px));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  min-height: calc(100vh - 76px);
```
</details>

---

**⚡ Performance** · lines 100-111

**Multiple `backdrop-filter: blur(10px)` instances may degrade mobile performance** — `backdrop-filter` is applied to `.org-avatar` and `.hero-stat` elements. On low-end mobile devices, backdrop-filter blur is GPU-intensive. When combined with the hero section's `::before`/`::after` pseudo-elements and radial gradients, this could cause janky scrolling or battery drain. Consider using `@supports (backdrop-filter: blur(1px))` to provide a fallback, or limiting blur usage on mobile via media queries.

<details>
<summary>:bulb: Suggestion</summary>

```
.org-avatar {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@supports (backdrop-filter: blur(1px)) {
  .org-avatar {
    backdrop-filter: blur(10px);
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.org-avatar {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}
```
</details>


