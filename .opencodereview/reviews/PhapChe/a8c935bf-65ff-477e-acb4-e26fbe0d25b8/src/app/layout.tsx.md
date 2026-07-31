# Review: `src/app/layout.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (1)

**🐛 Bug** · lines 25-32

**Provider nesting order**: `ThemeProvider` wraps `ErrorBoundaryWrapper`. If `ThemeProvider` throws during render, the error boundary will not catch it, resulting in an unhandled crash with no fallback UI. Move `ErrorBoundaryWrapper` to be the outermost provider so it can catch errors from all nested providers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        <ErrorBoundaryWrapper>
          <ThemeProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
            <Toaster position="top-right" />
          </ThemeProvider>
        </ErrorBoundaryWrapper>
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        <ThemeProvider>
        <ErrorBoundaryWrapper>
            <QueryProvider>
              {children}
              <Toaster position="top-right" />
            </QueryProvider>
        </ErrorBoundaryWrapper>
        </ThemeProvider>
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 27-30

**Toaster inside QueryProvider**: `<Toaster>` is rendered inside `<QueryProvider>`. If the query client fails to initialize, the toast notification system becomes unavailable, which could mute important error messages shown to users. Move `<Toaster>` outside `QueryProvider` so it remains functional even when query-related errors occur.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
            <QueryProvider>
              {children}
            </QueryProvider>
            <Toaster position="top-right" />
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
            <QueryProvider>
              {children}
              <Toaster position="top-right" />
            </QueryProvider>
```
</details>

---

**🔧 Maintainability** · lines 12-15

**Hardcoded metadata**: The `description` is a hardcoded Vietnamese string (`'Nền tảng pháp lý cho SME'`). If the application needs to support multiple languages, this metadata should be dynamic or use a localization strategy. Consider using a constants file or i18n solution for metadata content.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider extracting to a shared constants/locale file if i18n is needed
export const metadata: Metadata = {
  title: "GitNexus Legal",
  description: "Nền tảng pháp lý cho SME",
};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const metadata: Metadata = {
  title: "GitNexus Legal",
  description: "Nền tảng pháp lý cho SME",
};
```
</details>


