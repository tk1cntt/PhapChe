# Review: `src/app/globals.css`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 1

---

## 🟠 High (1)

**🐛 Bug** · lines 60-61

`.pill.purple` uses the same color variables as `.pill.blue` (`--color-info-muted` and `--color-info`), which is almost certainly a copy-paste error. The design tokens file (tokens.css) defines `--color-purple` and `--color-purple-muted` specifically for purple variants. This causes `.pill.purple` to render identically to `.pill.blue`, defeating the purpose of having a separate purple pill variant.

<details>
<summary>:bulb: Suggestion</summary>

```
.pill.blue   { background: var(--color-info-muted);    color: var(--color-info); }
.pill.purple { background: var(--color-purple-muted); color: var(--color-purple); }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
.pill.blue   { background: var(--color-info-muted);    color: var(--color-info); }
.pill.purple { background: var(--color-info-muted);    color: var(--color-info); }
```
</details>


