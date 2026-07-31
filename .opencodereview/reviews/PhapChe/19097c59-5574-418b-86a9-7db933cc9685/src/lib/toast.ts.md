# Review: `src/lib/toast.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 4-21

The SSR guard `typeof window !== 'undefined'` is repeated in all 4 functions. Consider extracting this into a shared helper (e.g., `isBrowser()`) to improve maintainability and reduce duplication. If the guard logic needs to change (e.g., adding `document` checks), it currently requires updating 4 separate locations.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function isBrowser() {
  return typeof window !== 'undefined';
}

/** Hiển thị toast thông báo thành công */
export function toastSuccess(message: string) {
  if (isBrowser()) toast.success(message);
}

/** Hiển thị toast thông báo lỗi */
export function toastError(message: string) {
  if (isBrowser()) toast.error(message);
}

/** Hiển thị toast thông báo thông tin */
export function toastInfo(message: string) {
  if (isBrowser()) toast(message);
}

/** Hiển thị toast thông báo cảnh báo */
export function toastWarning(message: string) {
  if (isBrowser()) toast(message, { icon: '⚠️' });
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function toastSuccess(message: string) {
  if (typeof window !== 'undefined') toast.success(message);
}

/** Hiển thị toast thông báo lỗi */
export function toastError(message: string) {
  if (typeof window !== 'undefined') toast.error(message);
}

/** Hiển thị toast thông báo thông tin */
export function toastInfo(message: string) {
  if (typeof window !== 'undefined') toast(message);
}

/** Hiển thị toast thông báo cảnh báo */
export function toastWarning(message: string) {
  if (typeof window !== 'undefined') toast(message, { icon: '⚠️' });
}
```
</details>


