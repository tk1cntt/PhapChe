# Phase 09: folder-tag - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 4 new files + 1 schema migration
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` (Folder, Tag, joins) | model | schema/CRUD | `DocumentTemplate` self-relation, `Document` workspace-scope | exact |
| `src/lib/documents/classification-service.ts` | service | CRUD + audit | `src/lib/documents/template-service.ts` | exact |
| `src/app/admin/vault/page.tsx` | page (server) | request-response | `src/app/admin/templates/page.tsx` | exact |
| `src/app/admin/vault/actions.ts` | server-action | request-response | `src/app/admin/templates/[templateId]/actions.ts` | exact |
| `src/lib/documents/classification-service.test.ts` | test | test/e2e | `src/lib/documents/template-service.test.ts` | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model additions)

**Analog:** `DocumentTemplate` (workspace-scoped + self-relation via `previousVersionId`).

**Workspace-scoped model pattern** (lines 322-342 of `prisma/schema.prisma`):
```prisma
model DocumentTemplate {
  id                String         @id @default(cuid())
  workspaceId       String
  matterTypeKey     String
  version           Int            @default(1)
  status            TemplateStatus @default(draft)
  label             String
  description       String?
  variableSchema    Json           @default("[]")
  content           String
  previousVersionId String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  workspace         Workspace      @relation(fields: [workspaceId], references: [id])
  previousVersion   DocumentTemplate? @relation("TemplateVersion", fields: [previousVersionId], references: [id])
  nextVersions      DocumentTemplate[] @relation("TemplateVersion")

  @@unique([workspaceId, matterTypeKey, version])
  @@index([workspaceId, matterTypeKey])
  @@index([workspaceId, status])
}
```

**Workspace relation registration** (lines 80-86 of `prisma/schema.prisma`):
```prisma
model Workspace {
  // ...
  memberships WorkspaceMembership[]
  requests    LegalRequest[]
  matterTypes          MatterType[]
  routingCapabilities  RoutingCapability[]
  documents            Document[]
  reviews              Review[]
  vaultFiles           VaultFile[]
  auditEvents          AuditEvent[]
  documentTemplates     DocumentTemplate[]
}
```
Add `folders`, `tags`, `vaultFileFolders`, `vaultFileTags` to `Workspace` model.

**AuditTargetType enum** (lines 37-49): may add `FOLDER`, `TAG`, `VAULT_FILE_FOLDER`, `VAULT_FILE_TAG` (only if classification joins need separate target type — otherwise reuse `VAULT_FILE` and store targetId of vault file).

**Self-relation with parent/child pattern** — the project uses the same pattern for `DocumentTemplate.previousVersionId`. For `Folder.parentId`:
```prisma
model Folder {
  id           String   @id @default(cuid())
  workspaceId  String
  name         String
  parentId     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  parent       Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children     Folder[] @relation("FolderHierarchy")
  vaultFileFolders VaultFileFolder[]

  @@index([workspaceId])
  @@index([parentId])
}
```

**Join-table pattern** — Prisma's compound unique via `@@unique([vaultFileId, folderId])`. Workspace relation not strictly required on the join table since both endpoints already carry `workspaceId`; the service layer enforces workspace consistency.

**VaultFile back-relation** (lines 344-368): add `vaultFileFolders VaultFileFolder[]` and `vaultFileTags VaultFileTag[]` to `VaultFile`.

---

### `src/lib/documents/classification-service.ts` (service, CRUD + audit)

**Analog:** `src/lib/documents/template-service.ts`

**Imports pattern** (lines 1-5):
```typescript
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import type { TemplateStatus } from '@prisma/client';
```

**Admin RBAC check pattern** (lines 7-9):
```typescript
function isAdmin(session: AppSession | null | undefined) {
  return session?.roles.includes('coordinator_admin') || session?.roles.includes('super_admin') || false;
}
```
Reuse this `isAdmin` helper directly in classification-service — D-06 requires coordinator_admin or super_admin.

**Workspace access guard pattern** (lines 42-43 of template-service.ts):
```typescript
export async function listTemplates(session: AppSession, workspaceId: string, matterTypeKey?: string) {
  if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');
  // ...
}
```
Apply same guard to `listFolders`, `listTags`, `listFileClassifications`.

**Mutate-and-audit pattern** (lines 73-97 of template-service.ts, `createTemplate`):
```typescript
const template = await prisma.documentTemplate.create({ data: { /* ... */ } });

await recordAuditEvent({
  actorId: session.userId,
  workspaceId: input.workspaceId,
  action: 'template.created',
  targetType: 'DOCUMENT',
  targetId: template.id,
  correlationId: `template-create-${template.id}`,
  metadataSummary: `matterType=${input.matterTypeKey}; version=1; status=draft`,
});

return template;
```
Replicate for `createFolder` (action: `folder.created`, targetType: `VAULT_FILE` or new enum), `createTag`, `moveFileToFolder`, `tagFile`, `untagFile`.

**Transactional create pattern** (lines 229-261 of vault-service.ts, `storeVaultFile`):
```typescript
const vaultFile = await prisma.$transaction(async (tx) => {
  const created = await tx.vaultFile.create({ data: { /* ... */ } });
  await recordAuditEvent({ /* ... */ }, tx);
  return created;
});
```
Use for `moveFileToFolder` / `tagFile` / `untagFile` so the join-table mutation and the audit event commit together.

**Metadata summary safety** — never include file content, storageKey, or PII in `metadataSummary` (500-char limit enforced by `recordAuditEvent`). The vault-service test asserts this:
```typescript
assert.doesNotMatch(audit?.metadataSummary ?? '', /storageKey/);
```

**Error string convention** — `throw new Error('FORBIDDEN')` for RBAC denials, `'FOLDER_NOT_FOUND'`, `'TAG_NOT_FOUND'`, `'VAULT_FILE_NOT_FOUND'`, `'WORKSPACE_NOT_FOUND'`. Match vault-service and template-service string conventions.

---

### `src/app/admin/vault/page.tsx` (server page, request-response)

**Analog:** `src/app/admin/templates/page.tsx`

**Imports + session guard pattern** (lines 1-7, 33-41 of templates/page.tsx):
```typescript
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
import { listTemplates } from '@/lib/documents/template-service';
import { requireAppSession } from '@/lib/security/session';

export default async function TemplatesPage() {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const workspaceId = session.activeWorkspaceId;
  const templates = await listTemplates(session, workspaceId);
  // ...
}
```
Apply identical guard for `/admin/vault`. Pull `listFolders`, `listTags`, and `listFileClassifications` (the latter scoped to `workspaceId` from `session.activeWorkspaceId`).

**PageHeader + Card + Table composition** (lines 51-65, 73-106 of templates/page.tsx):
```tsx
<AdminShell>
  <PageHeader
    title="Quản lý mẫu tài liệu"
    description="Tạo, chỉnh sửa và phiên bản hóa mẫu tài liệu pháp lý"
    action={<Link href="/admin/templates/new"><Button>+ Tạo mẫu mới</Button></Link>}
  />

  {templates.length === 0 ? (
    <Card>
      <p className="py-8 text-center text-[14px] text-[#64748B]">Chưa có mẫu tài liệu nào. Tạo mẫu đầu tiên.</p>
    </Card>
  ) : (
    <Table headers={['Phiên bản', 'Trạng thái', /* ... */]}>
      {items.map((template) => (
        <tr key={template.id} className="hover:bg-[#F1F5F9]">
          {/* cells */}
        </tr>
      ))}
    </Table>
  )}
</AdminShell>
```
Use the same pattern. For the two-column grid (folders/tags) use `grid grid-cols-1 lg:grid-cols-2 gap-8` per UI-SPEC §Layout Primitives.

**Format date helper** (lines 29-31 of templates/page.tsx):
```typescript
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
```

**Vietnamese labels / Badge tone maps** (lines 8-27 of templates/page.tsx): keep the same `LABEL` / `TONE` const map idiom for status/role rendering.

**AdminShell navigation** — `src/app/admin/components/admin-shell.tsx` `navItems` (lines 4-10):
```typescript
const navItems = [
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/workspaces', label: 'Workspace' },
  { href: '/admin/requests', label: 'Hồ sơ yêu cầu' },
  { href: '/admin/ops', label: 'Vận hành' },
  { href: '/admin/audit', label: 'Audit' },
];
```
Add `{ href: '/admin/vault', label: 'Phân loại vault' }` so the new page appears in the sidebar and mobile nav.

---

### `src/app/admin/vault/actions.ts` (server action, request-response)

**Analog:** `src/app/admin/templates/[templateId]/actions.ts`

**Imports + guard pattern** (lines 1-6, 8-13 of templates/[templateId]/actions.ts):
```typescript
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { updateTemplate, /* ... */ } from '@/lib/documents/template-service';

export async function updateTemplateAction(formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { error: 'FORBIDDEN' };
  }
  // ...
}
```
Same `requireAppSession` + role check, same return shape `{ error, success }`.

**FormData extraction + validation pattern** (lines 15-22 of templates/[templateId]/actions.ts):
```typescript
const templateId = formData.get('templateId')?.toString();
const label = formData.get('label')?.toString().trim();
// ...
if (!templateId) return { error: 'TEMPLATE_ID_REQUIRED' };
if (!label) return { error: 'LABEL_REQUIRED' };
```

**Service call + revalidate pattern** (lines 24-33 of templates/[templateId]/actions.ts):
```typescript
try {
  await updateTemplate(session, templateId, { label, description, content });
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${templateId}`);
} catch (err) {
  return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
}
return { success: true };
```
For folder/tag actions, revalidate `/admin/vault` after every mutation.

**useFormState-compatible action pattern** (lines 18-65 of templates/new/actions.ts):
```typescript
export type CreateTemplateState = {
  errors?: { label?: string; /* ... */ };
  message?: string;
};

export async function createTemplateAction(prevState: CreateTemplateState, formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { message: 'FORBIDDEN' };
  }
  // ... validation
  if (Object.keys(errors).length > 0) return { errors };
  // ... service call
}
```
Use this shape (`{ errors, message }`) for the create-folder and create-tag forms so the planner can pair them with `useFormState` in client components.

---

### `src/lib/documents/classification-service.test.ts` (test, e2e)

**Analog:** `src/lib/documents/template-service.test.ts`

**Test structure** (lines 1-15):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import type { AppSession } from '@/lib/security/session';
import { /* functions under test */ } from './classification-service';

const E2E_PREFIX = 'classification_service_e2e';
```

**Database safety check** (lines 27-35 of template-service.test.ts) — copy verbatim to refuse unsafe `DATABASE_URL`:
```typescript
function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for classification service test');

  const url = new URL(databaseUrl);
  const hostname = url.hostname.toLowerCase();
  const databaseName = url.pathname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run classification service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}
```

**Seed + cleanup helpers** (lines 37-75 of template-service.test.ts) — pattern: create workspace, users with role memberships, return `AppSession` builders (`coordinatorSession`, `adminSession`); cleanup deletes models in reverse dependency order.

**Session builder pattern** (lines 153-163 of vault-service.test.ts):
```typescript
function coordinatorSession(seed: VaultSeed): AppSession {
  return { userId: seed.coordinatorId, activeWorkspaceId: seed.workspaceId, roles: ['coordinator_admin'] };
}
```

**RBAC negative test pattern** (lines 244-260 of vault-service.test.ts):
```typescript
test('RBAC - user without request access gets FORBIDDEN', async () => {
  // ...
  await assert.rejects(
    listVaultFiles(specialistSession(seed), seed.otherRequestId),
    /FORBIDDEN/,
  );
});
```

**Audit assertion pattern** (lines 204-211 of vault-service.test.ts):
```typescript
const audit = await prisma.auditEvent.findFirst({
  where: { action: 'vault.metadata_accessed', targetId: vaultFileId },
});
assert.ok(audit);
```

---

## Shared Patterns

### Authentication / Session
**Source:** `src/lib/security/session.ts` (`requireAppSession`)
**Apply to:** All server actions and admin pages.
```typescript
import { requireAppSession } from '@/lib/security/session';
const session = await requireAppSession();
if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
  redirect('/admin');
}
```

### Admin RBAC helper
**Source:** `src/lib/documents/template-service.ts` lines 7-9
**Apply to:** `classification-service.ts` — reuse `isAdmin(session)` for every mutator.
```typescript
function isAdmin(session: AppSession | null | undefined) {
  return session?.roles.includes('coordinator_admin') || session?.roles.includes('super_admin') || false;
}
```

### Audit recording
**Source:** `src/lib/audit/audit.ts` `recordAuditEvent`
**Apply to:** Every mutating service function.
- Required fields: `actorId`, `workspaceId`, `action`, `targetType`, `targetId`, `correlationId`.
- `metadataSummary` is a flat string, <=500 chars, no raw content / storageKey / PII.
- Pass `tx` as second arg when inside `prisma.$transaction` for atomic audit.

### Workspace access guard
**Source:** `src/lib/security/rbac.ts` `canAccessWorkspace`
**Apply to:** All read functions in classification-service.
```typescript
if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');
```

### Vault-file access guard
**Source:** `src/lib/security/rbac.ts` `canAccessVaultFile`
**Apply to:** `moveFileToFolder`, `tagFile`, `untagFile` — verify the caller can access the underlying vault file before mutating the join.
```typescript
if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');
```

### Admin UI primitives
**Source:** `src/app/admin/components/ui.tsx`
**Apply to:** `/admin/vault` page — `Card`, `Table`, `Badge` (tones: `neutral`/`info`/`accent`/`destructive`/`outline`), `Button` (variants: `primary`/`secondary`/`destructive`/`ghost`), `PageHeader` (title + description + optional action slot).
- Folder/tag chips use `Badge tone="outline"`.
- Primary CTAs ("Tạo thư mục mới", "Tạo thẻ mới") use `Button variant="primary"`.
- Vietnamese copy from `09-UI-SPEC.md` §Copywriting Contract.

### AdminShell + nav
**Source:** `src/app/admin/components/admin-shell.tsx`
**Apply to:** Add `{ href: '/admin/vault', label: 'Phân loại vault' }` to the `navItems` array. Server-side RBAC remains the source of truth — the nav entry is UX-only.

### Server action shape
**Source:** `src/app/admin/templates/[templateId]/actions.ts`
**Apply to:** All `/admin/vault` server actions.
- Return `{ error, success }` for direct `<form action={...}>` submissions.
- Return `{ errors, message }` for `useFormState`-compatible create flows.
- Always call `revalidatePath('/admin/vault')` after mutation.

## No Analog Found

None — every file in this phase has an exact analog in the existing codebase (template-service for the service, templates admin page for the UI, templates actions for server actions, template-service.test for the e2e tests, DocumentTemplate schema for self-relation/workspace scoping).

## Metadata

**Analog search scope:** `prisma/schema.prisma`, `src/lib/documents/`, `src/lib/security/`, `src/lib/audit/`, `src/app/admin/`
**Files scanned:** ~15 (admin pages, service modules, schema, tests)
**Pattern extraction date:** 2026-06-03
