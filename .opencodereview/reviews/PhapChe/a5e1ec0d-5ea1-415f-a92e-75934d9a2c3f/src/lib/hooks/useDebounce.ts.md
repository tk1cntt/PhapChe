# Review: `src/lib/hooks/useDebounce.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 1

---

## 🟡 Medium (1)

**🐛 Bug** · lines 50-57

Pending timeout not cleared when `delay` changes. If a timeout is pending and `delay` changes (e.g., from 300ms to 500ms), the old timeout will fire after the old delay, causing unexpected behavior. This is inconsistent with `useDebounce` above, which correctly clears and resets the timeout on delay changes. The cleanup effect (line 52) should also depend on `delay` to clear any pending timeout.

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


