# Review: `src/app/api/admin/requests/[id]/files/[fileId]/preview/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 10

---

## 🔴 Critical (1)

**🔒 Security** · lines 447-464

**Path traversal check is performed AFTER `existsSync(fullPath)`.**

Line 451 calls `existsSync(fullPath)` before the `..` check on line 462. An attacker can craft an `objectKey` like `../../../etc/passwd` and the `existsSync` call will probe the real filesystem before the traversal guard rejects it. This is an information disclosure vector (timing/error observability) and violates the principle of validating before any FS access.

Move the `objectKey.includes('..')` check before `existsSync` (as done correctly in the DOCX and PDF handlers).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      try {
        // Kiểm tra path traversal
        if (objectKey.includes('..')) {
          return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }

        const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
        const fullPath = join(storageRoot, objectKey);

        if (!existsSync(fullPath)) {
          return NextResponse.json({
            content: `[File không tồn tại trong storage: ${objectKey}]`,
            mimeType,
            title,
            isBinary: false,
            previewFormat: 'text',
          });
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      try {
        const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
        const fullPath = join(storageRoot, objectKey);

        if (!existsSync(fullPath)) {
          return NextResponse.json({
            content: `[File không tồn tại trong storage: ${objectKey}]`,
            mimeType,
            title,
            isBinary: false,
            previewFormat: 'text',
          });
        }

        // Kiểm tra path traversal
        if (objectKey.includes('..')) {
          return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 475-486

**`content` variable is computed but never used; `truncated` is returned instead.**

For markdown files, `normalizeMarkdown` is called on `truncated` and stored in `content`, but the response returns `content: truncated` (raw, unnormalized). The normalization result is silently discarded. This means markdown previews are never normalized.

Return `content` instead of `truncated`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Normalize text content
        const isMarkdown = /\.(md|markdown)$/i.test(title);
        const content = isMarkdown
          ? normalizeMarkdown(truncated, {
              detectArticles: true,
              detectSections: true,
              detectSubItems: true,
            }).content
          : truncated;

        return NextResponse.json({
          content,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        // Normalize text content
        const isMarkdown = /\.(md|markdown)$/i.test(title);
        const content = isMarkdown
          ? normalizeMarkdown(truncated, {
              detectArticles: true,
              detectSections: true,
              detectSubItems: true,
            }).content
          : truncated;

        return NextResponse.json({
          content: truncated,
```
</details>


## 🟡 Medium (7)

**🔧 Maintainability** · lines 25-27

**Dead code: `TEXT_EXTENSIONS` and `OFFICE_XML_EXTENSIONS` are declared but never used.**

These two regex constants are never referenced anywhere in the file. The file uses `isBinaryPreview`, `isOfficeXml`, and `isPdf` helper functions instead of these regexes directly. Remove unused constants to avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const BINARY_EXTENSIONS = /\.(doc|pptx|ppt|xls|zip|rar|7z|png|jpg|jpeg|gif|bmp|webp|mp3|mp4|avi|mov|mkv|exe|dll)$/i;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const BINARY_EXTENSIONS = /\.(doc|pptx|ppt|xls|zip|rar|7z|png|jpg|jpeg|gif|bmp|webp|mp3|mp4|avi|mov|mkv|exe|dll)$/i;
const TEXT_EXTENSIONS = /\.(txt|md|json|xml|html|css|js|ts|jsx|tsx|yaml|yml|csv|log|sql|env)$/i;
const OFFICE_XML_EXTENSIONS = /\.(docx|xlsx)$/i;
```
</details>

---

**🔧 Maintainability** · line 21

**Dead import: `isMarkItDownAvailable` is imported but never used anywhere in this file.**

Remove it to keep the import clean and avoid confusion about whether MarkItDown availability is checked.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { normalizeMarkdown, convertWithMarkItDown } from '@/lib/document';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { normalizeMarkdown, convertWithMarkItDown, isMarkItDownAvailable } from '@/lib/document';
```
</details>

---

**⚡ Performance** · lines 318-321

**No file size check before `readFile` — potential DoS via memory exhaustion.**

For DOCX, XLSX, PDF, and text file handlers, the entire file buffer is loaded into memory with `readFile(fullPath)` without any size limit. An attacker could upload a multi-gigabyte file to exhaust server memory. Add a size check (e.g., via `stat` or `existsSync` + file size) before reading, and reject files exceeding a reasonable limit (e.g., 50MB).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          const stats = await stat(fullPath);
          const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
          if (stats.size > MAX_FILE_SIZE) {
            return NextResponse.json({
              content: `[File quá lớn để preview (${(stats.size / 1024 / 1024).toFixed(1)}MB). Vui lòng tải xuống.]`,
              mimeType,
              title,
              isBinary: false,
              previewFormat: 'text',
            });
          }
          const buffer = await readFile(fullPath);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          const buffer = await readFile(fullPath);
          let content: string;
          let usedMarkItDown = false;
          if (officeType === 'docx') {
```
</details>

---

**🔧 Maintainability** · lines 333-336

**`MAX_PREVIEW = 100_000` is hardcoded in three separate blocks (DOCX, PDF, and text file handlers).**

If the limit needs to change, all three must be updated consistently. Extract it to a module-level constant and consider making it configurable via an environment variable for operational flexibility.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const MAX_PREVIEW = parseInt(process.env.PREVIEW_MAX_CHARS || '100000', 10);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const MAX_PREVIEW = 100_000;
        const truncated = content.length > MAX_PREVIEW
          ? content.slice(0, MAX_PREVIEW) + '\n\n... [đã cắt bớt để hiển thị, tải file gốc để xem đầy đủ]'
          : content;
```
</details>

---

**🐛 Bug** · lines 106-115

**Temp file leak: if `convertWithMarkItDown` throws, `cleanupTempFile` is never called.**

If `convertWithMarkItDown` throws an exception (line ~100), the code jumps to the outer `catch` block, skipping `cleanupTempFile` on line 104 entirely. The temp file created by `createTempFile` on line 97 is left on disk. This will accumulate orphaned temp files in the storage directory over time.

Wrap the conversion and cleanup in a `try/finally` to guarantee cleanup.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const tempPath = await createTempFile(buffer, extension);

    try {
      const result = await convertWithMarkItDown(
        tempPath,
        mimeType ?? '',
        filename,
      );
      // ... rest of logic
    } finally {
      // Cleanup temp file regardless of outcome
      await cleanupTempFile(tempPath);
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const tempPath = await createTempFile(buffer, extension);

    const result = await convertWithMarkItDown(
      tempPath,
      mimeType ?? '',
      filename,
    );

    // Cleanup temp file regardless of outcome
    await cleanupTempFile(tempPath);
```
</details>

---

**🐛 Bug** · lines 207-210

**`extractXlsxText` uses naive CSV splitting that breaks on cells containing commas.**

`XLSX.utils.sheet_to_csv` produces properly quoted CSV, but `line.split(',')` on line 192 does not handle quoted fields with embedded commas. A cell value like `"Hello, World"` will be split into two columns. Use a proper CSV parser or `XLSX.utils.sheet_to_json` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',' });
    const rows = csv.trim().split('\n').map((line) =>
      line.split(',').map((c) => c.trim())
    );
```
</details>

---

**🔒 Security** · lines 303-305

**Path traversal check uses `includes('..')` which is insufficient.**

`objectKey.includes('..')` only catches the literal `..` substring. It does not protect against:
- Encoded traversal: `%2e%2e` or `%252e%252e` (double URL encoding)
- Null byte injection: `../../etc/passwd%00.jpg`
- Absolute paths starting with `/`

While `join()` normalizes relative paths, an already-decoded `..` in the `objectKey` from the database is still the primary concern. Consider also rejecting absolute paths (`objectKey.startsWith('/')`) and using `path.resolve` + checking the resolved path stays within the storage root.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        if (objectKey.includes('..') || objectKey.startsWith('/')) {
          return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }
        const resolvedPath = resolve(storageRoot, objectKey);
        if (!resolvedPath.startsWith(resolve(storageRoot))) {
          return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        if (objectKey.includes('..')) {
          return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
        }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 319-328

**Dead variable: `usedMarkItDown` is assigned but never read.**

In both the DOCX handler (line ~310) and PDF handler (line ~380), the `usedMarkItDown` variable is set from `result.usedMarkitdown` but never referenced in the response or any subsequent logic. Either include it in the response for analytics/debugging or remove the variable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          let content: string;
          if (officeType === 'docx') {
            // Try MarkItDown first, fallback to mammoth extractRawText
            const result = await convertWithMarkItDownOrFallback(
              buffer, mimeType, title, 'docx',
              () => extractDocxText(buffer),
            );
            content = result.content;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          let content: string;
          let usedMarkItDown = false;
          if (officeType === 'docx') {
            // Try MarkItDown first, fallback to mammoth extractRawText
            const result = await convertWithMarkItDownOrFallback(
              buffer, mimeType, title, 'docx',
              () => extractDocxText(buffer),
            );
            content = result.content;
            usedMarkItDown = result.usedMarkitdown;
```
</details>


