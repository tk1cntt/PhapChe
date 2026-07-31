# Review: `src/app/[locale]/admin/partner/partner.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (1)

**🐛 Bug** · lines 11-15

Both `.table-head` and `.table-row` use `display: grid` but lack `grid-template-columns`. If column templates are not set elsewhere (e.g., via inline styles from JS), the grid will collapse to a single column, breaking the entire table layout — all cells will stack vertically instead of forming proper columns.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-head {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* or explicit column definition */
  background: linear-gradient(180deg, #f8fafc, #f5f7fb);
  border-bottom: 1px solid #dfe7f1;
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


## 🟡 Medium (3)

**🐛 Bug** · lines 98-107

`.status-badge` has no default `background-color` or `color` property. If a component renders a status badge without also applying a color-modifier class, the badge will be completely invisible (transparent background, no text color), leading to missing status indicators.

<details>
<summary>:bulb: Suggestion</summary>

```
.status-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  background: #eef2f7;
  color: #334155;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.status-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
```
</details>

---

**🐛 Bug** · lines 31-36

`.table-row` has no bottom border or divider between rows. Without a separator, adjacent rows in a data table become visually indistinguishable, degrading readability and usability for data-heavy admin interfaces.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-row {
  display: grid;
  min-height: 68px;
  background: #fff;
  border-bottom: 1px solid #dfe7f1;
  transition: 0.2s;
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

**📝 Other** · lines 85-96

`.action-link` resets `border` and `background` (suggesting it's applied to `<button>` elements) but lacks `font-family: inherit`, `font-size: inherit`, and `:focus-visible` styles. This causes inconsistent button rendering across browsers and removes the focus indicator, making the control inaccessible to keyboard users.

<details>
<summary>:bulb: Suggestion</summary>

```
.table-row .td .action-link {
  color: #087f78;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.table-row .td .action-link:focus-visible {
  outline: 2px solid #087f78;
  outline-offset: 2px;
  border-radius: 4px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.table-row .td .action-link {
  color: #087f78;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  background: none;
  border: none;
  cursor: pointer;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 27-29

`.table-head .th:last-child` and `.table-row .td:last-child` set `border-right: none`, but no `border-right` is defined on the base `.th` or `.td` elements. If a border-right is added in the future by a grid-column rule, this would be useful; otherwise it's dead code that may confuse maintainers.

<details>
<summary>:bulb: Suggestion</summary>

```
/* Remove this rule if no border-right exists on .th; otherwise define border-right on .th first */
.table-head .th:last-child {
  border-right: none;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.table-head .th:last-child {
  border-right: none;
}
```
</details>


