# Review: `src/app/[locale]/admin/organizations/organizations.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🟡 Medium (4)

**🐛 Bug** · lines 157-182

Missing `:focus-visible` styles on interactive elements (`.create-btn`, `.modal-close`, `.btn-cancel`, `.btn-submit`, `.action-link`). Without a visible focus indicator, keyboard-only users cannot determine which element is focused, violating WCAG 2.1 SC 2.4.7 (Focus Visible). Add a `:focus-visible` outline or ring to all interactive controls.

<details>
<summary>:bulb: Suggestion</summary>

```
.create-btn:focus-visible {
  outline: 2px solid #087970;
  outline-offset: 2px;
}

.create-btn:hover {
  background: linear-gradient(180deg, #0a7d74, #07685f);
  box-shadow: 0 6px 16px rgba(8, 121, 112, 0.4);
  transform: translateY(-1px);
}

.create-btn:active {
  transform: translateY(0);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  background: linear-gradient(180deg, #0b8f86, #087970);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(8, 121, 112, 0.3);
}

.create-btn:hover {
  background: linear-gradient(180deg, #0a7d74, #07685f);
  box-shadow: 0 6px 16px rgba(8, 121, 112, 0.4);
  transform: translateY(-1px);
}

.create-btn:active {
  transform: translateY(0);
}
```
</details>

---

**🔧 Maintainability** · lines 11-15

No responsive design (media queries) anywhere in the file. The `.table-head` and `.table-row` use CSS Grid with fixed column counts (controlled externally via `grid-template-columns`), the modal has `max-width: 520px`, and `.form-row` uses a fixed two-column layout. On viewports narrower than ~640px, the table will overflow horizontally, the modal will be cramped, and the two-column form row will collapse poorly. Consider adding `@media` breakpoints to switch to single-column or stacked layouts.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-head {
  display: grid;
  background: linear-gradient(180deg, #f8fafc, #f5f7fb);
  border-bottom: 1px solid #dfe7f1;
}

@media (max-width: 640px) {
  .table-container {
    overflow-x: auto;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 100%;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.table-head {
  display: grid;
  background: linear-gradient(180deg, #f8fafc, #f5f7fb);
  border-bottom: 1px solid #dfe7f1;
}
```
</details>

---

**🔧 Maintainability** · lines 185-198

Hardcoded `z-index: 1000` on the modal overlay can easily conflict with other layered UI elements (toast notifications, dropdown menus, tooltips). If any other component uses `z-index >= 1000`, it will render above the modal backdrop, breaking the expected stacking order. Use a CSS custom property (e.g., `var(--z-modal)`) or a centralized z-index scale to manage stacking contexts consistently.

<details>
<summary>:bulb: Suggestion</summary>

```
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 1000);
  padding: 20px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
```
</details>

---

**🐛 Bug** · lines 279-290

The `form-field input` and `form-field select` use `width: 100%` with horizontal padding (`padding: 0 14px`) but do not set `box-sizing: border-box`. Unless a global reset is in place, the actual rendered width will be `100% + 28px`, causing the inputs to overflow their parent container. Add `box-sizing: border-box` to ensure padding is included in the width calculation.

<details>
<summary>:bulb: Suggestion</summary>

```
.form-field input,
.form-field select {
  width: 100%;
  height: 42px;
  border: 1px solid #dfe7f1;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.form-field input,
.form-field select {
  width: 100%;
  height: 42px;
  border: 1px solid #dfe7f1;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  transition: all 0.2s;
}
```
</details>


## 🔵 Low (3)

**🐛 Bug** · lines 42-49

Table cell content has no overflow protection. Long text (e.g., organization names, descriptions) will overflow the cell or wrap unpredictably, potentially breaking the grid layout. Add `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap` to prevent layout breakage from unexpectedly long content.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-row .td {
  display: flex;
  align-items: center;
  padding: 0 18px;
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.table-row .td {
  display: flex;
  align-items: center;
  padding: 0 18px;
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
}
```
</details>

---

**⚡ Performance** · lines 31-36

`transition: 0.2s` without a property name targets all animatable properties. When the grid layout recalculates (e.g., window resize, column changes), the browser will attempt to transition every animatable property, including layout-triggering ones like `grid-template-columns` or `width`, causing unnecessary paint/layout work. Use `transition: background 0.2s` to limit the transition to only the intended hover effect.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-row {
  display: grid;
  min-height: 68px;
  background: #fff;
  transition: background 0.2s;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.table-row {
  display: grid;
  min-height: 68px;
  background: #fff;
  transition: 0.2s;
}
```
</details>

---

**🔧 Maintainability** · lines 31-40

Table body rows lack visual separators (e.g., `border-bottom`). When the grid has many columns or the hover background is subtle (`#fbfdff` vs `#fff`), rows may visually blend together, making it hard to scan across columns. The `.table-head` has a bottom border but the `.table-row` elements do not. Consider adding a separator between rows.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-row {
  display: grid;
  min-height: 68px;
  background: #fff;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #fbfdff;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.table-row {
  display: grid;
  min-height: 68px;
  background: #fff;
  transition: 0.2s;
}

.table-row:hover {
  background: #fbfdff;
}
```
</details>


