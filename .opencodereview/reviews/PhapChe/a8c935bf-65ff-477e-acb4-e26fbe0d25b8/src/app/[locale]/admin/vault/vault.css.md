# Review: `src/app/[locale]/admin/vault/vault.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟡 Medium (5)

**🐛 Bug** · lines 341-347

**Table overflow hidden clips content at intermediate viewport widths.** The `.vault-table-card` uses `overflow: hidden` in the base style, but `overflow-x: auto` is only applied inside `@media (max-width: 1400px)`. Between 1200px (the table's `min-width`) and 1400px, the table content may be clipped rather than scrollable. For screens wider than 1400px, if the table is wider than the container, content is also lost. Move `overflow-x: auto` to the base rule or use `overflow: auto` instead of `overflow: hidden`.

<details>
<summary>:bulb: Suggestion</summary>

```
.vault-client .vault-table-card {
  background: #fff;
  border: 1px solid #dfe7f1;
  border-radius: 15px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  overflow-x: auto;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.vault-client .vault-table-card {
  background: #fff;
  border: 1px solid #dfe7f1;
  border-radius: 15px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}
```
</details>

---

**🐛 Bug** · lines 31-45

**Missing hover and focus-visible states on primary upload button.** The `.vault-upload-btn` has `cursor: pointer` but no `:hover`, `:focus-visible`, or `:active` styles. This makes the button unresponsive to mouse and keyboard interaction, reducing accessibility and perceived performance. Add hover (e.g., slightly lighter gradient or brightness shift) and a visible focus ring.

<details>
<summary>:bulb: Suggestion</summary>

```
.vault-client .vault-upload-btn {
  height: 45px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #0b8f86, #087970);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 8px 18px rgba(8, 127, 120, 0.25);
  cursor: pointer;
  transition: box-shadow 0.2s, filter 0.2s;
}

.vault-client .vault-upload-btn:hover {
  filter: brightness(1.1);
  box-shadow: 0 10px 22px rgba(8, 127, 120, 0.35);
}

.vault-client .vault-upload-btn:focus-visible {
  outline: 2px solid #0b8f86;
  outline-offset: 2px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.vault-client .vault-upload-btn {
  height: 45px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #0b8f86, #087970);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 8px 18px rgba(8, 127, 120, 0.25);
  cursor: pointer;
}
```
</details>

---

**🐛 Bug** · lines 314-332

**Missing hover and focus-visible states on toolbar buttons and create button.** `.vault-toolbar-btn`, `.vault-create-btn`, and `.vault-error-card button` all lack `:hover`, `:focus-visible`, and `:active` styles. This degrades keyboard accessibility and user feedback. Add hover background changes and focus-visible outlines.

<details>
<summary>:bulb: Suggestion</summary>

```
.vault-client .vault-toolbar-btn {
  height: 44px;
  border: 1px solid #dfe7f1;
  background: #fff;
  border-radius: 8px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.vault-client .vault-toolbar-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.vault-client .vault-toolbar-btn:focus-visible {
  outline: 2px solid #0b8f86;
  outline-offset: 2px;
}

.vault-client .vault-toolbar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.vault-client .vault-toolbar-btn {
  height: 44px;
  border: 1px solid #dfe7f1;
  background: #fff;
  border-radius: 8px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.vault-client .vault-toolbar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```
</details>

---

**🔧 Maintainability** · lines 3-20

**Hardcoded design tokens throughout the file.** Colors (e.g., `#0f172a`, `#64748b`, `#dfe7f1`), spacing values (`31px`, `36px`, `22px`), border radii, and font sizes are all hardcoded. Without CSS custom properties (design tokens), making global theme changes or supporting dark mode requires modifying every occurrence. Consider defining CSS custom properties on `:root` or `.vault-client` for colors, spacing scale, radii, and typography.

<details>
<summary>:bulb: Suggestion</summary>

```
/* Example: define tokens at the top of the file */
:root {
  --vault-color-text-primary: #0f172a;
  --vault-color-text-secondary: #64748b;
  --vault-color-border: #dfe7f1;
  --vault-color-accent: #0b8f86;
  --vault-radius-md: 8px;
  --vault-radius-lg: 15px;
  --vault-spacing-md: 18px;
  --vault-spacing-lg: 24px;
}

.vault-client {
  padding: 31px 36px 42px;
}

.vault-client .vault-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
}

.vault-client .vault-page-header h1 {
  font-size: 31px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: #020617;
  margin-bottom: 12px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.vault-client {
  padding: 31px 36px 42px;
}

.vault-client .vault-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
}

.vault-client .vault-page-header h1 {
  font-size: 31px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: #020617;
  margin-bottom: 12px;
}
```
</details>

---

**🐛 Bug** · lines 165-176

**Search inputs lack focus indicators.** `.vault-search-box` and `.vault-search-input` have no `:focus-within` or input `:focus` styles. When a user tabs into or clicks the search field, there is no visual indication of focus, making keyboard navigation confusing. Add a focus-within style that changes the border color or adds a subtle ring.

<details>
<summary>:bulb: Suggestion</summary>

```
.vault-client .vault-search-box {
  width: 100%;
  height: 40px;
  border: 1px solid #dfe7f1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: #fff;
  margin-bottom: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.vault-client .vault-search-box:focus-within {
  border-color: #0b8f86;
  box-shadow: 0 0 0 3px rgba(11, 143, 134, 0.15);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.vault-client .vault-search-box {
  width: 100%;
  height: 40px;
  border: 1px solid #dfe7f1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: #fff;
  margin-bottom: 14px;
}
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 508-517

**Action link lacks `:focus-visible` style.** The `.vault-action-link` only defines a `:hover` underline. For keyboard users, there is no visible focus indicator, making it hard to tell which link is focused. Add a `:focus-visible` outline.

<details>
<summary>:bulb: Suggestion</summary>

```
.vault-client .vault-action-link {
  color: #087f78;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.vault-client .vault-action-link:hover {
  text-decoration: underline;
}

.vault-client .vault-action-link:focus-visible {
  outline: 2px solid #087f78;
  outline-offset: 2px;
  border-radius: 2px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.vault-client .vault-action-link {
  color: #087f78;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.vault-client .vault-action-link:hover {
  text-decoration: underline;
}
```
</details>


