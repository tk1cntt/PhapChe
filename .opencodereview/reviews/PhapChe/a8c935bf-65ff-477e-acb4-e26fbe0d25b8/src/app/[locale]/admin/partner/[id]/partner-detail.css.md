# Review: `src/app/[locale]/admin/partner/[id]/partner-detail.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟠 High (1)

**🐛 Bug** · lines 28-36

Multiple interactive elements (buttons, clickable areas, document actions) lack `:focus-visible` styles. Only form inputs (`select`, `input`, `textarea`) have `:focus` outlines. This makes the page inaccessible for keyboard-only users — they cannot see which button or clickable area is currently focused. Affected elements include: `.back-link`, `.ghost-btn`, `.primary-btn`, `.danger-btn`, `.small-btn`, `.document-btn`, `.btn-retry`, and `.upload-area`.

<details>
<summary>:bulb: Suggestion</summary>

```
.back-link:focus-visible,
.ghost-btn:focus-visible,
.primary-btn:focus-visible,
.danger-btn:focus-visible,
.small-btn:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}

.back-link,
.ghost-btn,
.primary-btn,
.danger-btn,
.small-btn {
  font-family: inherit;
  cursor: pointer;
  border: none;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.back-link,
.ghost-btn,
.primary-btn,
.danger-btn,
.small-btn {
  font-family: inherit;
  cursor: pointer;
  border: none;
}
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 590-601

The `.comment-form textarea` uses `width: 100%` with `padding: 12px 14px` but does not set `box-sizing: border-box`. In the default `content-box` model, the actual rendered width will be 100% + 24px (horizontal padding) + 2px (border), causing the textarea to overflow its container. Add `box-sizing: border-box` to prevent layout breakage.

<details>
<summary>:bulb: Suggestion</summary>

```
.comment-form textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid #edf2f7;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  color: #0f172a;
  background: #fbfdff;
  resize: vertical;
  transition: all 0.2s;
  box-sizing: border-box;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.comment-form textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid #edf2f7;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  color: #0f172a;
  background: #fbfdff;
  resize: vertical;
  transition: all 0.2s;
}
```
</details>

---

**🐛 Bug** · lines 502-507

The `.status-form-field textarea` also uses padding but lacks `box-sizing: border-box`. While it doesn't have an explicit `width: 100%`, it could still overflow if the parent flex container constrains width unexpectedly. Add `box-sizing: border-box` for consistency.

<details>
<summary>:bulb: Suggestion</summary>

```
.status-form-field textarea {
  height: auto;
  min-height: 80px;
  padding: 12px 14px;
  resize: vertical;
  box-sizing: border-box;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.status-form-field textarea {
  height: auto;
  min-height: 80px;
  padding: 12px 14px;
  resize: vertical;
}
```
</details>

---

**🔧 Maintainability** · lines 3-12

The entire stylesheet uses hardcoded color values (e.g., `#0f766e` appears 14+ times, `#0f172a` appears 10+ times, `#64748b` appears 9+ times). This makes theme changes (dark mode, rebranding) extremely labor-intensive and error-prone. Consider extracting these into CSS custom properties (e.g., `--color-primary: #0f766e;`, `--color-text-primary: #0f172a;`) defined on `:root` or a theme class.

<details>
<summary>:bulb: Suggestion</summary>

```
:root {
  --color-primary: #0f766e;
  --color-primary-hover: #0d9488;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-bg-page: #f8fafc;
  --color-bg-card: #ffffff;
  --color-bg-subtle: #fbfdff;
  --color-bg-hover: #f8fafc;
  --color-border: #dfe7f1;
  --color-border-light: #edf2f7;
  --color-accent-blue: #2563eb;
  --color-accent-orange: #f97316;
  --color-accent-purple: #7c3aed;
  --color-danger: #e11d48;
  --color-danger-bg: #fff1f2;
  --color-danger-border: #fecdd3;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --font-weight-heavy: 800;
  --font-weight-black: 900;
  --shadow-card: 0 14px 35px rgba(15, 23, 42, 0.055);
  --shadow-hero: 0 18px 42px rgba(15, 23, 42, 0.06);
}

.content {
  min-height: calc(100vh - 76px);
  padding: 32px 36px 48px;
  background:
    radial-gradient(circle at 82% 8%, rgba(15, 118, 110, 0.05), transparent 28%),
    radial-gradient(circle at 38% 76%, rgba(37, 99, 235, 0.04), transparent 34%),
    var(--color-bg-page);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--color-text-primary);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.content {
  min-height: calc(100vh - 76px);
  padding: 32px 36px 48px;
  background:
    radial-gradient(circle at 82% 8%, rgba(15, 118, 110, 0.05), transparent 28%),
    radial-gradient(circle at 38% 76%, rgba(37, 99, 235, 0.04), transparent 34%),
    #f8fafc;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #0f172a;
}
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 309-314

The sidebar column in `.detail-layout` uses a fixed `380px` width. Between the 760px and 1180px breakpoints, the layout remains two-column, but at narrower viewports, a 380px sidebar may be too wide relative to the main content column, causing cramped content. Consider using `minmax(0, 380px)` or a percentage-based value, or adding an intermediate breakpoint.

<details>
<summary>:bulb: Suggestion</summary>

```
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
  gap: 24px;
  align-items: start;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;
}
```
</details>

---

**🔧 Maintainability**

The `.status-status-form-field select, .status-form-field input, .status-form-field textarea` selector contains a typo: `.status-status-form-field` (duplicated 'status-'). This will never match any element, making the `:focus` styles for these form controls silently fail. The intended selector is likely `.status-form-field select, .status-form-field input, .status-form-field textarea`.

<details>
<summary>:bulb: Suggestion</summary>

```
.status-form-field select,
.status-form-field input,
.status-form-field textarea {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.status-status-form-field select,
.status-form-field input,
.status-form-field textarea {
```
</details>


