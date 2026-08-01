# Review: `src/lib/storage/types.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 3

---

## 🟡 Medium (1)

**🔒 Security** · lines 135-142

**Security: Sensitive credentials in plain-text config.** The `StorageConfig.s3` interface stores `accessKeyId` and `secretAccessKey` as plain strings. If this config object is ever logged, serialized (e.g., `JSON.stringify`), or included in error traces, AWS credentials will be leaked. Consider marking these fields as `readonly` and using a dedicated secret type (e.g., wrapping in a class that masks `toString()`/`toJSON()`) or loading them from a secrets manager at runtime instead of holding them in a plain config object.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  s3?: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    /** @deprecated Prefer loading from secrets manager; avoid logging this value. */
    secretAccessKey: string;
    forcePathStyle?: boolean;
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  s3?: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
  };
```
</details>


## 🔵 Low (2)

**🔒 Security** · lines 282-287

**Security: Internal object key leaked in error message.** The `FileNotFoundError` constructor interpolates the raw `objectKey` directly into the error message. If this message is surfaced to end users (e.g., returned in an API response), it exposes internal storage paths, which aids attackers in understanding the storage layout. Consider using a generic message for the user-facing layer and logging the key separately for debugging.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export class FileNotFoundError extends StorageError {
  constructor(objectKey: string) {
    super(`File not found: ${objectKey}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
    // Store the key separately for internal logging; avoid exposing it in user-facing responses.
    this.objectKey = objectKey;
  }
  public readonly objectKey: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export class FileNotFoundError extends StorageError {
  constructor(objectKey: string) {
    super(`File not found: ${objectKey}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
  }
}
```
</details>

---

**🔧 Maintainability** · lines 63-70

**Maintainability: Implicit dependency on Node.js `Buffer` type.** The interfaces `UploadFileInput` (field `buffer`) and `UploadFileServiceInput` (field `file`) use the `Buffer` type, and `StorageProvider.getObject` returns `Promise<Buffer | ReadableStream>`. `Buffer` is a Node.js global that requires `@types/node` to be installed. This makes the storage abstraction implicitly tied to Node.js, limiting portability to edge runtimes or browsers. If cross-runtime support is desired, consider using `Uint8Array` (which `Buffer` extends) or documenting the Node.js dependency explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface UploadFileInput {
  objectKey: string;
  /** Node.js Buffer. Requires @types/node. Consider Uint8Array for cross-runtime compatibility. */
  buffer?: Buffer;
  stream?: ReadableStream;
  mimeType: string;
  originalName: string;
  metadata?: Record<string, string>;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface UploadFileInput {
  objectKey: string;
  buffer?: Buffer;
  stream?: ReadableStream;
  mimeType: string;
  originalName: string;
  metadata?: Record<string, string>;
}
```
</details>


