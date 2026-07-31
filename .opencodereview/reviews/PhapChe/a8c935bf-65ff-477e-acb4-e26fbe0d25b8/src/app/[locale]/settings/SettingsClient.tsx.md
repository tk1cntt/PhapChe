# Review: `src/app/[locale]/settings/SettingsClient.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 70-73

Unhandled promise rejection: `handleSaveProfile` re-throws the error after logging, but the caller (`ProfileSection`) may not catch it, leading to an unhandled promise rejection. This can crash the page or leave the UI in an inconsistent state. Remove the re-throw or ensure the error is surfaced to the user via a state-based error message instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (error) {
      console.error('Save profile failed:', error);
      // Surface error to user instead of re-throwing
      setSaveError(error instanceof Error ? error.message : 'Save failed');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch (error) {
      console.error('Save profile failed:', error);
      throw error;
    }
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 68-69

Missing cleanup for `setTimeout`: the timer that resets `profileSaved` after 3 seconds is not cleared on unmount. If the component unmounts before the timeout fires, React will warn about a state update on an unmounted component. Use `useEffect` with a cleanup function to clear the timeout.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      setProfileSaved(true);
      const timer = setTimeout(() => setProfileSaved(false), 3000);
      return () => clearTimeout(timer);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
```
</details>

---

**🔒 Security** · lines 57-61

The PUT request to `/api/settings/profile` does not include a CSRF protection token (e.g., a header like `X-CSRF-Token`). If the API endpoint relies on client-side CSRF tokens, this request is vulnerable to cross-site request forgery. Verify the endpoint's CSRF strategy and add a token header if needed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(data),
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
```
</details>

---

**🐛 Bug** · lines 68-69

Correction to previous comment: the `return () => clearTimeout(timer)` fix won't work inside an async event handler (it's not a React effect). The proper fix is to store the timer ID in a `useRef` and clear it in a `useEffect` cleanup, or use a ref-based flag to guard the state update. Example:

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Inside handleSaveProfile:
  clearTimeout(timerRef.current);
  setProfileSaved(true);
  timerRef.current = setTimeout(() => setProfileSaved(false), 3000);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
```
</details>


