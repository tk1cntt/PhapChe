# Review: `src/app/api/files/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟡 Medium (3)

**🔒 Security** · line 44

`console.error(error)` logs the full error object including stack traces. In production, this could leak internal paths, database queries, or other sensitive implementation details to server logs. Use a structured logger that sanitizes error output, or log only `error.message`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    console.error('Get file error:', error instanceof Error ? error.message : error);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Get file error:', error);
```
</details>

---

**🔒 Security** · line 120

Same issue: `console.error(error)` leaks the full error object with stack traces to server logs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    console.error('Delete file error:', error instanceof Error ? error.message : error);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Delete file error:', error);
```
</details>

---

**⚡ Performance** · lines 85-116

The DELETE handler fetches the file record via `prisma.file.findUnique` (line 76) and then `storageServer.deleteFile` internally fetches the same file again (in `StorageService.deleteFile` at line 231). This doubles the database query. Consider passing the already-fetched file/workspace info directly to a lower-level delete method, or refactoring `storageServer.deleteFile` to accept an optional pre-fetched record.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Get file + membership in a single query to avoid redundant fetch later
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            memberships: {
              where: { userId: session.user.id, isActive: true },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Not found', detail: 'File not found' },
        { status: 404 }
      );
    }

    const membership = file.workspace.memberships[0];
    const canDelete = membership?.role === 'coordinator' || membership?.role === 'super_admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Only workspace admins can delete files' },
        { status: 403 }
      );
    }

    // Delete file — pass pre-fetched file info to avoid redundant DB lookup
    await storageServer.deleteFile(id, session.user.id);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get file to check workspace
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'Not found', detail: 'File not found' },
        { status: 404 }
      );
    }

    // Check user role - only coordinators and admins can delete
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: file.workspaceId,
        userId: session.user.id,
        isActive: true,
      },
    });

    const canDelete = membership?.role === 'coordinator' || membership?.role === 'super_admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Only workspace admins can delete files' },
        { status: 403 }
      );
    }

    // Delete file
    await storageServer.deleteFile(id, session.user.id);
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 25

The `request` parameter is declared but never used in the GET handler. This is dead code that can be misleading. If the parameter is not needed, prefix it with an underscore (`_request`) to signal intentional non-use, or remove it and adjust the function signature.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET(_request: NextRequest, { params }: RouteParams) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {
```
</details>

---

**🔧 Maintainability** · line 71

Same issue: `request` is declared but never used in the DELETE handler. Prefix with `_request` to signal intentional non-use.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function DELETE(request: NextRequest, { params }: RouteParams) {
```
</details>


