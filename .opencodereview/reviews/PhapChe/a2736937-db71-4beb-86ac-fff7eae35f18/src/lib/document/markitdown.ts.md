# Review: `src/lib/document/markitdown.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 4

---

## 🔴 Critical (1)

**🔒 Security** · lines 101-103

Path traversal vulnerability: `filePath` is passed directly to `execFile` without any validation that it resides within an allowed directory. If the caller passes a user-controlled path (e.g., `../../../etc/passwd`), MarkItDown could read and return arbitrary files from the filesystem. Add a runtime check to ensure the resolved absolute path is within an expected base directory (e.g., using `path.resolve` + `startsWith`). The docstring says "absolute path" but provides no enforcement.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Validate filePath is within the allowed directory to prevent path traversal
    const resolvedPath = path.resolve(filePath);
    const allowedDir = path.resolve(process.env.UPLOAD_DIR || '/tmp/uploads');
    if (!resolvedPath.startsWith(allowedDir + path.sep)) {
      return {
        markdown: '',
        success: false,
        error: `File path is outside allowed directory: ${filePath}`,
      };
    }

    const { stdout } = await execFileAsync(
      'markitdown',
      ['--no-plugins', resolvedPath],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { stdout } = await execFileAsync(
      'markitdown',
      ['--no-plugins', filePath],
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 141-146

Buffer overflow produces confusing error message: When `maxBuffer` (10MB) is exceeded, `execFile` throws an error with code `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`. The current generic catch handler produces a message like `MarkItDown error for docx: stdout maxBuffer length exceeded`, which is confusing because it makes it sound like a MarkItDown bug rather than the output being too large. Consider distinguishing buffer overflow errors explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Distinguish buffer overflow from other errors
    if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      return {
        markdown: '',
        success: false,
        error: `MarkItDown output exceeds 10MB buffer limit for ${converter} file`,
        converter,
      };
    }

    return {
      markdown: '',
      success: false,
      error: `MarkItDown error for ${converter}: ${error.message}`,
      converter,
    };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return {
      markdown: '',
      success: false,
      error: `MarkItDown error for ${converter}: ${error.message}`,
      converter,
    };
```
</details>

---

**🔧 Maintainability** · lines 144-145

Missing `stderr` in error message: When `execFile` fails, the error object may contain `stderr` with useful diagnostic information from the MarkItDown CLI. The current error message only includes `error.message`, which can make debugging difficult. Consider appending `error.stderr` to the error message when it is available.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      error: `MarkItDown error for ${converter}: ${error.message}${error.stderr ? ' — ' + String(error.stderr).trim() : ''}`,
      converter,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      error: `MarkItDown error for ${converter}: ${error.message}`,
      converter,
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 159-162

MIME type detection using `String.includes` could match unintended subtypes. For example, `includes('wordprocessingml')` would match `application/vnd.openxmlformats-officedocument.wordprocessingml.template.macroEnabled` (a macro-enabled template), which is not the same as a standard DOCX. While low risk in practice, consider using `===` or `startsWith` with the full MIME type string for more precise matching.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext.endsWith('.docx')) return 'docx';
  if (mime === 'application/pdf' || ext.endsWith('.pdf')) return 'pdf';
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || ext.endsWith('.xlsx')) return 'xlsx';
  if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || ext.endsWith('.pptx')) return 'pptx';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (mime.includes('wordprocessingml') || ext.endsWith('.docx')) return 'docx';
  if (mime === 'application/pdf' || ext.endsWith('.pdf')) return 'pdf';
  if (mime.includes('spreadsheetml') || ext.endsWith('.xlsx')) return 'xlsx';
  if (mime.includes('presentationml') || ext.endsWith('.pptx')) return 'pptx';
```
</details>


