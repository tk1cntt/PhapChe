# Review: `src/lib/documents/classification-service.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 7-9

The `isAdmin` function will throw a TypeError when `session` is `null` or `undefined`. The optional chaining `?.` only protects the `session` access — `session?.roles` evaluates to `undefined` when `session` is nullish, and then `.includes(...)` is called on `undefined`, causing a runtime crash. This means calling `isAdmin(null)` or `isAdmin(undefined)` throws instead of returning `false`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function isAdmin(session: AppSession | null | undefined) {
  return session?.roles?.includes('coordinator_admin') || session?.roles?.includes('super_admin') || false;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function isAdmin(session: AppSession | null | undefined) {
  return session?.roles.includes('coordinator_admin') || session?.roles.includes('super_admin') || false;
}
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 185-194

`untagFile` does not verify that the tag's workspace matches the vault file's workspace. By contrast, `tagFile` and `moveFileToFolder` both check `workspaceId` consistency between the two entities. A tag from a different workspace could be referenced in the `vaultFileTag` junction table, and this function would silently allow untagging it without a workspace-mismatch guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [vaultFile, tag, existing] = await Promise.all([
    prisma.vaultFile.findUnique({
      where: { id: input.vaultFileId },
      select: { id: true, workspaceId: true },
    }),
    prisma.tag.findUnique({
      where: { id: input.tagId },
      select: { id: true, workspaceId: true },
    }),
    prisma.vaultFileTag.findUnique({
      where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
    }),
  ]);
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');
  if (!tag) throw new Error('TAG_NOT_FOUND');
  if (vaultFile.workspaceId !== tag.workspaceId) throw new Error('WORKSPACE_MISMATCH');
  if (!existing) throw new Error('VAULT_FILE_TAG_NOT_FOUND');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: input.vaultFileId },
    select: { id: true, workspaceId: true },
  });
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  const existing = await prisma.vaultFileTag.findUnique({
    where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
  });
  if (!existing) throw new Error('VAULT_FILE_TAG_NOT_FOUND');
```
</details>


## 🔵 Low (3)

**⚡ Performance** · lines 185-194

The two queries in `untagFile` — fetching the vault file and checking for the existing VaultFileTag — are independent of each other and could be executed in parallel with `Promise.all` for better performance, similar to the pattern used in `moveFileToFolder` and `tagFile`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [vaultFile, existing] = await Promise.all([
    prisma.vaultFile.findUnique({
      where: { id: input.vaultFileId },
      select: { id: true, workspaceId: true },
    }),
    prisma.vaultFileTag.findUnique({
      where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
    }),
  ]);
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');
  if (!existing) throw new Error('VAULT_FILE_TAG_NOT_FOUND');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: input.vaultFileId },
    select: { id: true, workspaceId: true },
  });
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  const existing = await prisma.vaultFileTag.findUnique({
    where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
  });
  if (!existing) throw new Error('VAULT_FILE_TAG_NOT_FOUND');
```
</details>

---

**🔧 Maintainability** · line 74

The variable name `folderNameVi` appears to be a typo or leftover suffix (possibly 'Vi' for Vietnamese). It should be `folderName` for clarity and consistency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const folderName = (folder?.name as string) ?? '';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const folderNameVi = (folder?.name as string) ?? '';
```
</details>

---

**🔧 Maintainability** · line 94

The variable `folderNameVi` is used in the `metadataSummary` string interpolation inside `recordAuditEvent`. Its name suggests a Vietnamese-specific suffix, which is confusing. The variable name inside the interpolation should match the renamed variable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        metadataSummary: `folderId=${input.folderId}; folderName=${folderName}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        metadataSummary: `folderId=${input.folderId}; folderName=${folderNameVi}`,
```
</details>


