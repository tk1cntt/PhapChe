# Review: `src/app/[locale]/admin/audit/audit.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (2)

**🐛 Bug** · lines 31-45

Interactive element `.export-btn` has no `:focus-visible` or `:focus` styles. Without a visible focus indicator, keyboard-only users cannot tell when the button is focused, which is an accessibility (a11y) violation (WCAG 2.1, SC 2.4.7).

<details>
<summary>:bulb: Suggestion</summary>

```
.audit-client .export-btn {
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

.audit-client .export-btn:focus-visible {
  outline: 2px solid #0b8f86;
  outline-offset: 2px;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.audit-client .export-btn {
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

**🔧 Maintainability** · lines 210-215

The `grid-template-columns` definition `1.05fr 1.1fr 1fr 1.1fr 1.05fr 1.25fr 1.4fr` is duplicated verbatim in both `.audit-table-head` and `.audit-table-row`. If the column layout ever needs adjustment, both places must be updated in sync, creating a maintenance risk. Consider defining a single CSS custom property (e.g., `--audit-table-columns`) on the shared parent `.audit-table-card` and referencing it via `var(--audit-table-columns)` in both rules.

<details>
<summary>:bulb: Suggestion</summary>

```
.audit-table-card {
  --audit-table-columns: 1.05fr 1.1fr 1fr 1.1fr 1.05fr 1.25fr 1.4fr;
  background: #fff;
  border: 1px solid #dfe7f1;
  border-radius: 15px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.audit-table-head {
  display: grid;
  grid-template-columns: var(--audit-table-columns);
  background: linear-gradient(180deg, #f8fafc, #f5f7fb);
  border-bottom: 1px solid #dfe7f1;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.audit-table-head {
  display: grid;
  grid-template-columns: 1.05fr 1.1fr 1fr 1.1fr 1.05fr 1.25fr 1.4fr;
  background: linear-gradient(180deg, #f8fafc, #f5f7fb);
  border-bottom: 1px solid #dfe7f1;
}
```
</details>


## 🔵 Low (1)

**⚡ Performance** · lines 232-239

`.audit-table-row` uses `transition: 0.2s` without specifying the property. This causes the browser to check all animatable properties on every frame during the transition, which is less efficient than targeting only the property that changes (here, `background`).

<details>
<summary>:bulb: Suggestion</summary>

```
.audit-table-row {
  display: grid;
  grid-template-columns: 1.05fr 1.1fr 1fr 1.1fr 1.05fr 1.25fr 1.4fr;
  min-height: 72px;
  border-bottom: 1px solid #dfe7f1;
  background: #fff;
  transition: background 0.2s;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.audit-table-row {
  display: grid;
  grid-template-columns: 1.05fr 1.1fr 1fr 1.1fr 1.05fr 1.25fr 1.4fr;
  min-height: 72px;
  border-bottom: 1px solid #dfe7f1;
  background: #fff;
  transition: 0.2s;
}
```
</details>


