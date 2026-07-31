# Review: `src/app/api/vault/[vaultFileId]/download/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (2)

**🔒 Security** · lines 36-40

Sensitive data exposure: `storageKey` is an internal storage identifier (e.g., S3 object key) and should never be returned to the client. This leaks internal infrastructure details and could aid attackers. Remove it from the response or replace it with a pre-signed URL that is generated server-side.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return NextResponse.json({
      message: 'Download endpoint',
      filename: vaultFile.filename,
      // TODO: generate a signed URL in production instead of exposing storageKey
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({
      message: 'Download endpoint',
      filename: vaultFile.filename,
      storageKey: vaultFile.storageKey,
    });
```
</details>

---

**🐛 Bug** · lines 13-14

Soft-delete bypass: The query does not filter out files where `deletedAt` is not null, meaning users can download soft-deleted files. Add a `where` condition `deletedAt: null` to exclude logically deleted records.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const vaultFile = await prisma.vaultFile.findUnique({
      where: { id: vaultFileId, deletedAt: null },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const vaultFile = await prisma.vaultFile.findUnique({
      where: { id: vaultFileId },
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 15-22

Three fields — `id`, `contentType`, and `size` — are selected from the database but never used in the response or access-control logic. Pruning unused selections reduces unnecessary data transfer from the database.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      select: {
        filename: true,
        storageKey: true,
        workspaceId: true,
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      select: {
        id: true,
        filename: true,
        storageKey: true,
        contentType: true,
        size: true,
        workspaceId: true,
      },
```
</details>

---

**🔧 Maintainability** · lines 5-8

The `request` parameter is accepted but never used. Prefix it with an underscore (`_request`) to signal intentional non-use and avoid linting warnings / confusion for future readers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> }
) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> }
) {
```
</details>


