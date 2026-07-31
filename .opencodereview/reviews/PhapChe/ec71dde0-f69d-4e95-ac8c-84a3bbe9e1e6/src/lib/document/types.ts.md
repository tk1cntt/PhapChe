# Review: `src/lib/document/types.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 2

---

## 🟡 Medium (1)

**🐛 Bug** · lines 36-37

Ambiguous sentinel value for `maxLength`: the interface comment says `undefined` means no limit, but `DEFAULT_OPTIONS` uses `0` as the sentinel for "no limit". If a caller explicitly passes `maxLength: 0`, it is ambiguous whether the intent is "truncate to 0 characters (empty output)" or "no limit". The implementation downstream likely treats `0` as no-limit, which would silently ignore a legitimate zero-length request.

**Suggestion**: Use only `undefined` (or a dedicated sentinel like `-1`) to represent "no limit", and keep `0` as a valid value meaning "truncate to empty". Update `DEFAULT_OPTIONS` accordingly (e.g., `maxLength: undefined` or omit the property entirely).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /** Giới hạn độ dài output (characters). Không giới hạn nếu undefined. Giá trị 0 sẽ truncate thành chuỗi rỗng. */
  maxLength?: number;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  /** Giới hạn độ dài output (characters). Không giới hạn nếu undefined. */
  maxLength?: number;
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 53-54

The `detected.errors` field is named "errors" but the description says "Cảnh báo" (warnings). This naming inconsistency may confuse consumers — if the array contains non-fatal warnings, naming it `warnings` would be more accurate and self-documenting.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    /** Cảnh báo từ quá trình detect */
    warnings: string[];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    /** Cảnh báo từ quá trình detect */
    errors: string[];
```
</details>


