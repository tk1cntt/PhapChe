# Review: `src/lib/hooks/useDebounce.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🟡 Medium (2)

**🐛 Bug** · line 32

**Incorrect timer type for browser environment**: `timeoutRef` is typed as `NodeJS.Timeout | null`, but this file is marked `'use client'` and runs in the browser. In browser environments, `setTimeout` returns a `number`, not a `NodeJS.Timeout`. This type mismatch can cause TypeScript compilation issues when `@types/node` is not available, and `clearTimeout(timeoutRef.current)` on line 53 may fail at runtime if the type assumptions are wrong.

**Fix**: Use `ReturnType<typeof setTimeout>` for a platform-agnostic type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
```
</details>

---

**🐛 Bug** · lines 35-38

**Potential stale callback invocation**: `callbackRef` is updated inside a `useEffect` (line 38), which runs after render. If the `setTimeout` callback fires before the effect runs (e.g., during concurrent rendering, suspense boundaries, or if the delay is 0), `callbackRef.current` will still hold the old callback, invoking stale logic with the latest arguments.

**Fix**: Update the ref directly during render instead of inside a `useEffect`. This is the recommended pattern from React docs for tracking latest values and avoids the stale-ref window entirely.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Update callback ref synchronously during render to avoid stale closures
  callbackRef.current = callback;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 50-57

**Stale timeout when `delay` changes**: When `delay` changes, `useCallback` produces a new `debouncedCallback`, but any previously scheduled timeout (set with the old delay) remains in `timeoutRef.current` and will fire with the old delay if the new callback is never called. This can lead to unexpected debounced invocations at the wrong timing.

**Fix**: Add a `useEffect` that clears the timeout when `delay` changes, or include cleanup logic tied to `delay` in the existing cleanup effect.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Cleanup on unmount or when delay changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
```
</details>


