# Review: `src/app/api/files/[id]/download/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 73-78

**Fragile buffer type conversion**: The fallback `Buffer.from(await new Response(buffer as ReadableStream).arrayBuffer())` is a misuse of the Response API. If `getObject` returns anything other than a `Buffer` or a `ReadableStream` (e.g., a plain `ArrayBuffer`, `Blob`, or a custom object), this will throw a runtime TypeError. The `as ReadableStream` cast also suppresses TypeScript errors, masking the real type mismatch. Consider having `getObject` return a consistent type (always `Buffer`), or use a proper type guard that handles all expected return types explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        const raw = await provider.getObject({
          objectKey: file.objectKey,
          bucket: file.bucket || undefined,
        });

        let bufferData: Buffer;
        if (raw instanceof Buffer) {
          bufferData = raw;
        } else if (raw instanceof ArrayBuffer) {
          bufferData = Buffer.from(raw);
        } else if (raw instanceof Uint8Array) {
          bufferData = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
        } else {
          // Unexpected type — log and fail gracefully
          console.error('Unexpected getObject return type:', typeof raw);
          return NextResponse.json(
            { error: 'Internal server error', detail: 'Unexpected storage response' },
            { status: 500 }
          );
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const buffer = await provider.getObject({
          objectKey: file.objectKey,
          bucket: file.bucket || undefined,
        });

        const bufferData = buffer instanceof Buffer ? buffer : Buffer.from(await new Response(buffer as ReadableStream).arrayBuffer());
```
</details>

---

**⚡ Performance** · lines 73-92

**Memory exhaustion for large files**: The entire file is read into a `Buffer` in memory (line 78) and then copied into a `Uint8Array` (line 88) before being sent. For large files (e.g., multi-GB), this can exhaust server memory and crash the process. Use streaming via `ReadableStream` to pipe the file content directly to the response without buffering the entire file.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Log access
        await storageServer.getDownloadUrl(id, session.user.id);

        // Stream the file to avoid buffering large files in memory
        const readable = await provider.getReadableStream({
          objectKey: file.objectKey,
          bucket: file.bucket || undefined,
        });

        return new NextResponse(readable, {
          status: 200,
          headers: {
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
            'Content-Length': String(file.size),
            'Cache-Control': 'private, no-cache',
          },
        });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const buffer = await provider.getObject({
          objectKey: file.objectKey,
          bucket: file.bucket || undefined,
        });

        const bufferData = buffer instanceof Buffer ? buffer : Buffer.from(await new Response(buffer as ReadableStream).arrayBuffer());

        // Log access
        await storageServer.getDownloadUrl(id, session.user.id);

        // Return file with proper headers (convert Buffer to Uint8Array)
        return new NextResponse(new Uint8Array(bufferData), {
          status: 200,
          headers: {
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
            'Content-Length': String(file.size),
            'Cache-Control': 'private, no-cache',
          },
        });
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 113-126

**Error classification by string matching**: Using `error.message.includes('NOT_FOUND')` and `error.message.includes('PERMISSION')` is fragile. If any unrelated error happens to contain these substrings (e.g., a database error message mentioning a missing column), it would be misclassified as a 404 or 403. Use custom error classes (e.g., `NotFoundError`, `PermissionError`) with `instanceof` checks instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Not found', detail: 'File not found' },
        { status: 404 }
      );
    }
    if (error instanceof PermissionError) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Access denied' },
        { status: 403 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (error instanceof Error) {
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Access denied' },
          { status: 403 }
        );
      }
    }
```
</details>

---

**🐛 Bug** · line 89

**Missing null check for `file.size`**: If `file.size` is `null` or `undefined` (e.g., due to a database migration issue or incomplete record), `String(file.size)` produces the literal string `"null"` or `"undefined"` as the `Content-Length` header, which is invalid and may cause client-side download failures. Provide a fallback or omit the header when size is unavailable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
            ...(file.size != null ? { 'Content-Length': String(file.size) } : {}),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
            'Content-Length': String(file.size),
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 88

**Missing RFC 5987 filename encoding**: The `Content-Disposition` header uses `filename="..."` with `encodeURIComponent`, but for non-ASCII filenames, the `filename*` parameter (RFC 5987) should be used to ensure proper decoding across browsers. The current approach may produce garbled filenames for international characters.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
```
</details>


