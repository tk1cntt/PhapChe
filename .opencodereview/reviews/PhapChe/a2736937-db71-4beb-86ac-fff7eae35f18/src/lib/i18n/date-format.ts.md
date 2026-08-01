# Review: `src/lib/i18n/date-format.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 47-58

**Critical Bug**: `formatDateTime` calls `toLocaleDateString` which only formats the date portion. The `hour`, `minute`, and `second` options from `DEFAULT_DATETIME` and any user-provided options are silently ignored. The function is effectively identical to `formatDate` and never produces time output. Use `toLocaleString` instead, which respects both date and time options.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function formatDateTime(
  date: Date | string,
  locale: string,
  options?: DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(getLocaleDateCode(locale), {
    ...DEFAULT_DATETIME,
    ...options,
  } as Intl.DateTimeFormatOptions);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function formatDateTime(
  date: Date | string,
  locale: string,
  options?: DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleDateCode(locale), {
    ...DEFAULT_DATETIME,
    ...options,
  } as Intl.DateTimeFormatOptions);
}
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 39-40

**Maintainability**: All three functions (`formatDate`, `formatDateTime`, `formatTime`) contain identical date parsing and validation logic. Extract this into a shared helper to reduce duplication and ensure consistent behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function parseDate(date: Date | string): Date | null {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? null : d;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
```
</details>

---

**🔧 Maintainability** · line 40

**Maintainability**: Invalid dates silently return an empty string with no warning or error. Callers may render empty UI elements or propagate the empty string downstream, making debugging difficult. Consider either throwing an error, returning `null`/`undefined`, or at minimum logging a warning so the failure is observable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (isNaN(d.getTime())) {
    console.warn('[formatDate] Invalid date input:', date);
    return '';
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (isNaN(d.getTime())) return '';
```
</details>


