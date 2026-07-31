# Review: `src/app/[locale]/admin/requests/requests.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟡 Medium (3)

**🐛 Bug** · lines 603-612

**.td cells lack overflow handling** — While `.stack` inside `.td` uses `text-overflow: ellipsis`, the `.td` container itself has no `overflow: hidden`, `text-overflow: ellipsis`, or `white-space: nowrap`. If content directly inside `.td` (not wrapped in `.stack`) is long, it will break the grid layout or overflow visually.

<details>
<summary>:bulb: Suggestion</summary>

```
.td {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  border-right: 1px solid #dfe7f1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.td {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  border-right: 1px solid #dfe7f1;
  min-width: 0;
}
```
</details>

---

**🐛 Bug** · lines 60-73

**Missing `:focus-visible` styles on all interactive elements** — Buttons (`.primary-btn`, `.ghost-btn`, `.tool-btn`, `.btn-retry`), links (`.action-link`), and clickable cards (`.tree-partner`, `.tree-org`, `.pipeline-card`) have no `:focus-visible` or `:focus` styling. This is a keyboard accessibility regression: users navigating via Tab will have no visible focus indicator, making the page unusable for keyboard-only and assistive-tech users.

<details>
<summary>:bulb: Suggestion</summary>

```
.primary-btn {
  height: 45px;
  padding: 0 18px;
  border-radius: 10px;
  background: linear-gradient(180deg, #3ba3e7, #2389d0);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(35, 137, 208, 0.25);
  transition: all 0.2s;
}

.primary-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.primary-btn {
  height: 45px;
  padding: 0 18px;
  border-radius: 10px;
  background: linear-gradient(180deg, #3ba3e7, #2389d0);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(35, 137, 208, 0.25);
  transition: all 0.2s;
}
```
</details>

---

**🐛 Bug** · lines 524-530

**`.search-box input` inherits no font-family** — The input element does not explicitly inherit `font-family`, which can cause browsers to render it in a default monospace or system font inconsistent with the rest of the page, especially on mobile and in some desktop environments.

<details>
<summary>:bulb: Suggestion</summary>

```
.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  font-family: inherit;
  background: transparent;
  color: inherit;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  background: transparent;
}
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 958-961

**Hardcoded `min-width: 1180px` in responsive table** — The 900px breakpoint forces `.table-head` and `.table-row` to `min-width: 1180px`. This value is brittle: if column widths change in the grid-template-columns definition, the horizontal scroll may trigger too early or too late. Consider using a CSS custom property derived from the sum of column min-widths, or use `min-width: max-content`.

<details>
<summary>:bulb: Suggestion</summary>

```
  .table-head,
  .table-row {
    min-width: max-content;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  .table-head,
  .table-row {
    min-width: 1180px;
  }
```
</details>

---

**🔧 Maintainability** · lines 3-12

**`calc(100vh - 76px)` depends on a magic header height** — The `.content` `min-height` is tied to a hardcoded 76px header. If the header height changes (e.g., due to different content, i18n, or a redesign), this layout breaks. Extract this into a CSS custom property so it can be maintained in one place.

<details>
<summary>:bulb: Suggestion</summary>

```
:root {
  --header-height: 76px;
}

.content {
  min-height: calc(100vh - var(--header-height));
  padding: 32px 36px 48px;
  background:
    radial-gradient(circle at 82% 8%, rgba(59, 130, 246, 0.06), transparent 28%),
    radial-gradient(circle at 38% 78%, rgba(15, 118, 110, 0.05), transparent 34%),
    #f8fafc;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #0f172a;
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
    radial-gradient(circle at 82% 8%, rgba(59, 130, 246, 0.06), transparent 28%),
    radial-gradient(circle at 38% 78%, rgba(15, 118, 110, 0.05), transparent 34%),
    #f8fafc;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #0f172a;
}
```
</details>


