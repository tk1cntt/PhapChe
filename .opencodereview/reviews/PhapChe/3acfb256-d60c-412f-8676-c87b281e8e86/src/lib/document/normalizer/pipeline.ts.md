# Review: `src/lib/document/normalizer/pipeline.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 60-73

Cache key is derived only from raw content (SHA-256), ignoring normalization options. If the same raw content is normalized with different options (e.g., trimTrailing: true vs false, or different phases), the cache will return the stale result from the first invocation, producing incorrect output.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Cache lookup — include relevant options in the key
  const cacheKey = sha256(raw + JSON.stringify({
    phases: opts.phases,
    trimTrailing: opts.trimTrailing,
    collapseBlankLines: opts.collapseBlankLines,
    normalizeUnicode: opts.normalizeUnicode,
    detectArticles: opts.detectArticles,
    detectSections: opts.detectSections,
    detectSubItems: opts.detectSubItems,
    normalizeLists: opts.normalizeLists,
    maxLength: opts.maxLength,
  }));
  const cached = normalizeCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Cache lookup
  const hash = sha256(raw);
  const cached = normalizeCache.get(hash);
  if (cached !== null) {
    return {
      content: cached,
      detected: { articles: [], sections: [], errors: [] },
      stats: {
        originalChars,
        normalizedChars: cached.length,
        estimatedTokens: estimateTokens(cached.length),
      },
    };
  }
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 63-73

Cached result returns hardcoded empty detected arrays. The detection data (articles, sections, errors) from phase2Detect is lost on cache hits. Callers expecting detection metadata will get inconsistent results depending on whether the cache was warm or cold. The cache should store and return the full NormalizeResult, not just the content string.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (cached !== null) {
    return {
      ...cached,
      stats: {
        ...cached.stats,
        originalChars,
      },
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (cached !== null) {
    return {
      content: cached,
      detected: { articles: [], sections: [], errors: [] },
      stats: {
        originalChars,
        normalizedChars: cached.length,
        estimatedTokens: estimateTokens(cached.length),
      },
    };
  }
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 121-122

The truncation error message uses `result.length` after the string has already been truncated, so it reports the truncated length (maxLen + suffix length) instead of the original pre-truncation length. The original length should be captured before the slice.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const preTruncationLength = result.length;
    result = result.slice(0, maxLen) + '\n\n... [đã cắt bớt]';
    detectErrors.push(`Content truncated from ${preTruncationLength} to ${maxLen} characters`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    result = result.slice(0, maxLen) + '\n\n... [đã cắt bớt]';
    detectErrors.push(`Content truncated from ${result.length} to ${maxLen} characters`);
```
</details>

---

**🔧 Maintainability** · lines 78-116

None of the three phase functions are wrapped in try/catch. If any phase throws an exception (e.g., due to malformed input or an internal bug), the entire pipeline crashes and no partial result is cached. Consider wrapping each phase in try/catch to gracefully degrade and report errors via `detectErrors` instead of throwing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Phase 1: Clean
  let result = raw;
  if (activePhases.has('clean')) {
    try {
      result = phase1Clean(raw, {
        lineEndings: true,
        noise: true,
        trailing: opts.trimTrailing,
        blankLines: opts.collapseBlankLines,
        unicode: opts.normalizeUnicode,
        controlChars: true,
      });
    } catch (e) {
      detectErrors.push(`Phase 1 (clean) failed: ${(e as Error).message}`);
    }
  }

  // Phase 2: Detect
  let articles: string[] = [];
  let sections: string[] = [];
  const detectErrors: string[] = [];

  if (activePhases.has('detect')) {
    try {
      const detectResult = phase2Detect(result, {
        articles: opts.detectArticles,
        sections: opts.detectSections,
        subItems: opts.detectSubItems,
        lists: opts.normalizeLists,
        allCapsHeadings: true,
      });
      result = detectResult.transformed;
      articles = detectResult.articles;
      sections = detectResult.sections;
    } catch (e) {
      detectErrors.push(`Phase 2 (detect) failed: ${(e as Error).message}`);
    }
  }

  // Phase 3: Format
  if (activePhases.has('format')) {
    try {
      result = phase3Format(result, {
        headingHierarchy: true,
        listMarkers: true,
        blankLineSpacing: true,
        htmlEntities: true,
      });
    } catch (e) {
      detectErrors.push(`Phase 3 (format) failed: ${(e as Error).message}`);
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Phase 1: Clean
  let result = activePhases.has('clean')
    ? phase1Clean(raw, {
        lineEndings: true,
        noise: true,
        trailing: opts.trimTrailing,
        blankLines: opts.collapseBlankLines,
        unicode: opts.normalizeUnicode,
        controlChars: true,
      })
    : raw;

  // Phase 2: Detect
  let articles: string[] = [];
  let sections: string[] = [];
  const detectErrors: string[] = [];

  if (activePhases.has('detect')) {
    const detectResult = phase2Detect(result, {
      articles: opts.detectArticles,
      sections: opts.detectSections,
      subItems: opts.detectSubItems,
      lists: opts.normalizeLists,
      allCapsHeadings: true,
    });
    result = detectResult.transformed;
    articles = detectResult.articles;
    sections = detectResult.sections;
  }

  // Phase 3: Format
  if (activePhases.has('format')) {
    result = phase3Format(result, {
      headingHierarchy: true,
      listMarkers: true,
      blankLineSpacing: true,
      htmlEntities: true,
    });
  }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 121

The truncation suffix is hardcoded in Vietnamese. If the application supports multiple locales or is consumed by non-Vietnamese users, this message will be unintelligible. Consider externalizing this string or using a locale-agnostic indicator.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    result = result.slice(0, maxLen) + '\n\n... [truncated]';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    result = result.slice(0, maxLen) + '\n\n... [đã cắt bớt]';
```
</details>


