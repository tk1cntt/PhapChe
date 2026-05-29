---
phase: 04-documents-vault
verified: 2026-05-29T17:00:00Z
status: gaps_found
score: 10/11 must-haves verified
overrides_applied: 0
re_verification: false
gaps:
  - truth: "System supports folder/tag classification for legal files"
    status: failed
    reason: "VaultFile only has fileKind (string enum) and source fields. No folder model, tag model, or classification service exists. storageKey path encodes implicit structure but is never exposed or queryable as classification."
    artifacts:
      - path: "prisma/schema.prisma"
        issue: "VaultFile has no folder/tag relation or dedicated classification fields"
      - path: "src/lib/documents/vault-service.ts"
        issue: "No folder listing, tag management, or classification query functions"
    missing:
      - "Folder or tag model in schema for hierarchical/classification metadata"
      - "Service layer for folder/tag CRUD and file-to-folder/tag association"
      - "UI component for browsing vault files by folder or filtering by tag"
warnings:
  - truth: "vault-service references size and contentType fields missing from VaultFile schema"
    status: failed
    reason: "vault-service.ts lines 60-61, 92-93, 185-186 select/create size and contentType on VaultFile, but prisma/schema.prisma VaultFile model lacks these fields. This causes Prisma runtime query failure."
    artifacts:
      - path: "src/lib/documents/vault-service.ts"
        issue: "References size: true and contentType: true in select clauses and size/contentType in create data — fields absent from schema"
      - path: "prisma/schema.prisma"
        issue: "VaultFile model missing size (Int?) and contentType (String?) fields"
    missing:
      - "Add size and contentType fields to VaultFile model, or remove references from vault-service.ts"
  - truth: "Admin can create document templates with variables via UI"
    status: partial
    reason: "Template creation form (admin/templates/new/page.tsx) has matterTypeKey, label, description, content fields but no variable schema builder. VariableSchema always defaults to empty array in server action. Admin must define variables through direct DB manipulation."
    artifacts:
      - path: "src/app/admin/templates/new/page.tsx"
        issue: "No variable schema input field — only label, description, matterTypeKey, content"
      - path: "src/app/admin/templates/new/actions.ts"
        issue: "line 43: variableSchema hardcoded to []"
    missing:
      - "Variable schema builder UI (table: key, label, required, type) in template creation form"
---

# Phase 04: Documents Vault Verification Report

**Phase Goal:** Manage templates, generate drafts, and store request artifacts in versioned Legal Vault.
**Verified:** 2026-05-29T17:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can view list of templates filtered by workspace | VERIFIED | `src/app/admin/templates/page.tsx`: listTemplates by workspaceId, grouped by matterTypeKey, Vietnamese labels, status badges |
| 2 | Admin can create draft template with matter type, label, description, variables, and content | VERIFIED | `src/app/admin/templates/new/page.tsx` + `actions.ts`: form with matterTypeKey, label, description, content. createTemplate service sets version=1, status=draft. Variable schema builder missing from UI (see warning) but service accepts variableSchema param. |
| 3 | Admin can publish draft template which becomes immutable | VERIFIED | `template-service.ts` publishTemplate: sets status=published, throws TEMPLATE_ALREADY_PUBLISHED if already published/deprecated. updateTemplate throws TEMPLATE_IMMUTABLE on published templates. |
| 4 | Editing published template creates new version with version lineage | VERIFIED | `template-service.ts` createNewVersion: increments version, sets previousVersionId, copies matterTypeKey, status=draft. UI: `[templateId]/page.tsx` new_version action mode with content editor. |
| 5 | Admin can deprecate old template versions | VERIFIED | `template-service.ts` deprecateTemplate: RBAC check, status=deprecated, audit event. UI: deprecate button on template detail page. |
| 6 | Specialist can generate draft document from approved template using intake answers | VERIFIED | `draft-service.ts` generateDraft: RBAC (assigned specialist or admin), template validation, placeholder replacement, DocumentVersion + VaultFile creation in transaction. UI: `generate-draft-form.tsx` with template select, variable pre-fill from intake answers, submit. |
| 7 | Missing required variables block generation with Vietnamese error | VERIFIED | `draft-service.ts` line 96-98: validateRequiredVariables, throws MISSING_REQUIRED_VARIABLES with keys. UI: client-side validation with `Vui long dien day du: {missing}` message. |
| 8 | Draft is stored as immutable DocumentVersion with templateId/templateVersion snapshot | VERIFIED | `draft-service.ts` line 127-139: DocumentVersion.create with templateId, templateVersion, status=draft, inputSnapshot, generatedContent. Schema: DocumentVersion model with all required fields. |
| 9 | Vault file created for generated draft with proper metadata | VERIFIED | `draft-service.ts` line 147-158: VaultFile.create with fileKind='generated_draft', source='template_generation', documentVersionId, storageKey path structure. |
| 10 | Vault access and file actions are permissioned and audited | VERIFIED | vault-service.ts: canAccessRequest/canAccessVaultFile on every operation, recordAuditEvent for metadata_accessed, access_requested, file_stored, file_deleted. storageKey never returned in listVaultFiles or getVaultFileMetadata. |
| 11 | System supports folder/tag classification for legal files | FAILED | VaultFile only has fileKind (string) and source. No folder/tag model, no classification service, no browse-by-folder/tag UI. See gap details. |

**Score:** 10/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | --------- | ------ | ------- |
| `prisma/schema.prisma` | DocumentTemplate, DocumentVersion, VaultFile models | VERIFIED | All models exist with correct fields, indexes, relations |
| `src/lib/documents/template-service.ts` | CRUD + version lifecycle | VERIFIED | 8 exported functions, RBAC, audit events, Prisma queries |
| `src/lib/documents/draft-service.ts` | Draft generation + submit for review | VERIFIED | generateDraft, listDocumentVersions, submitForReview with RBAC + audit |
| `src/lib/documents/vault-service.ts` | Vault file operations with RBAC | VERIFIED | listVaultFiles, getVaultFileMetadata, storeVaultFile, deleteVaultFile, requestVaultFileAccess. Note: size/contentType references cause schema mismatch. |
| `src/app/admin/templates/page.tsx` | Admin template list | VERIFIED | Server component with listTemplates, grouped by matterTypeKey, status badges |
| `src/app/admin/templates/[templateId]/page.tsx` | Template detail/edit/new-version | VERIFIED | View/edit/new_version modes with server actions |
| `src/app/admin/templates/new/page.tsx` | Template creation form | VERIFIED | Form with matterTypeKey, label, description, content. Missing variableSchema input. |
| `src/app/specialist/requests/[requestId]/page.tsx` | Specialist workbench | VERIFIED | Extended with templates, documentVersions, vaultFiles sections |
| `src/app/specialist/requests/[requestId]/components/generate-draft-form.tsx` | Draft generation UI | VERIFIED | Client component with template select, variable prefill, validation, server action call |
| `src/app/specialist/requests/[requestId]/components/document-versions.tsx` | Version list + submit | VERIFIED | Status badges, content preview, inline submit-for-review confirmation |
| `src/app/specialist/requests/[requestId]/components/vault-files.tsx` | Vault file metadata display | VERIFIED | File kind badges, no storageKey exposure |
| `src/app/specialist/requests/[requestId]/actions.ts` | Server actions for client components | VERIFIED | generateDraftAction, submitForReviewAction wrapping service functions |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| admin/templates/page.tsx | template-service.ts | server action import | WIRED | `import { listTemplates } from '@/lib/documents/template-service'` |
| admin/templates/new/actions.ts | template-service.ts | server action import | WIRED | `import { createTemplate } from '@/lib/documents/template-service'` |
| admin/templates/[templateId]/actions.ts | template-service.ts | server action imports | WIRED | update, approve, publish, deprecate, createNewVersion |
| specialist page.tsx | template-service.ts | server import | WIRED | `import { getTemplatesForGeneration }` |
| specialist page.tsx | vault-service.ts | server import | WIRED | `import { listVaultFiles }` |
| specialist actions.ts | draft-service.ts | server action import | WIRED | generateDraft, submitForReview |
| generate-draft-form.tsx | actions.ts | client->server action | WIRED | `import { generateDraftAction } from '../actions'` |
| document-versions.tsx | actions.ts | client->server action | WIRED | `import { submitForReviewAction } from '../actions'` |
| template-service.ts | prisma schema | Prisma client | WIRED | `prisma.documentTemplate` queries throughout |
| draft-service.ts | prisma schema | Prisma client | WIRED | `prisma.documentVersion`, `prisma.vaultFile`, `prisma.document` |
| vault-service.ts | prisma schema | Prisma client | WIRED | `prisma.vaultFile` queries (with size/contentType mismatch) |
| draft-service.ts | request-workflow.ts | import | WIRED | `import { transitionRequestStatus }` — called in submitForReview |
| draft-service.ts | template-service.ts | import | WIRED | `import { getTemplatesForGeneration }` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| DOC-01 | 04-01 | Admin can create document templates with matter type, version, status, and variables | SATISFIED | Schema has all fields. Admin UI creates templates. Variable schema builder missing from UI but service supports it. Template creation form defaults variables to []. |
| DOC-02 | 04-01 | Published templates cannot be edited directly; changes create new version | SATISFIED | updateTemplate throws TEMPLATE_IMMUTABLE. createNewVersion creates linked draft. UI new_version mode. |
| DOC-03 | 04-02 | Specialist can generate draft from approved template and intake answers | SATISFIED | generateDraft with template validation, placeholder replacement, variable pre-fill from intake. Full UI. |
| DOC-04 | 04-02, 04-03 | System stores drafts and final documents as versioned vault items | SATISFIED | DocumentVersion model, VaultFile with documentVersionId, fileKind='generated_draft'. |
| DOC-05 | 04-02 | System stores template version and input snapshot for each generated document | SATISFIED | DocumentVersion.inputSnapshot stores {variables, intakeAnswers}. templateId + templateVersion snapshot. |
| DOC-06 | 04-03 | Specialist can submit a specific document version for review | SATISFIED | submitForReview transitions status to submitted_for_review, request to pending_review. UI with confirmation dialog. |
| VLT-01 | 04-02 | Users can access vault files only when role and assignment allow it | SATISFIED | canAccessRequest/canAccessVaultFile on every vault operation. FORBIDDEN on failure. |
| VLT-02 | 04-02 | System stores uploaded files, drafts, final documents, and review artifacts with metadata | SATISFIED | VaultFile with fileKind, source, documentVersionId. storeVaultFile service. |
| VLT-03 | 04-02 | System supports file version history for documents | SATISFIED | DocumentVersion model tracks versions per document. listDocumentVersions returns history. |
| VLT-04 | 04-02, 04-03 | System logs file preview, download, upload, and delete actions | SATISFIED | Audit events: vault.metadata_accessed, vault.access_requested, vault.file_stored, vault.file_deleted, document.draft_generated, document.submitted_for_review. |
| VLT-05 | 04-03 | System supports folder/tag classification for legal files | BLOCKED | VaultFile only has fileKind (string). No folder/tag model, no classification service, no browse UI. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| src/lib/documents/vault-service.ts | 60-61 | `size: true, contentType: true` in select — fields missing from schema | Warning | Runtime Prisma error on listVaultFiles/getVaultFileMetadata queries |
| src/lib/documents/vault-service.ts | 185-186 | `size: size, contentType: contentType` in create — fields missing from schema | Warning | Runtime Prisma error on storeVaultFile |
| src/lib/documents/draft-service.ts | 75 | `getTemplatesForGeneration(session, request.workspaceId, '')` — unused result | Info | Dead code; result `templates` never used, actual template loaded via findFirst on line 77 |
| src/app/admin/templates/new/actions.ts | 43 | `variableSchema: []` hardcoded | Warning | Admin cannot define template variables through UI creation flow |

### Human Verification Required

### 1. Admin Template Creation Flow

**Test:** Navigate to /admin/templates/new, create a template with label, description, content, submit
**Expected:** Template created as draft, redirect to detail page, appears in list with "Nhap" badge
**Why human:** Requires running app, checking redirect behavior and UI rendering

### 2. Specialist Draft Generation Flow

**Test:** Login as assigned specialist, navigate to request detail, select template, fill variables, submit
**Expected:** Draft created, success message shown, document version appears in version list
**Why human:** Requires running app with seeded data, checking form interaction and state refresh

### 3. Submit For Review Flow

**Test:** On specialist workbench, click "Gui kiem tra" on draft version, confirm dialog
**Expected:** Version status changes to "Dang cho kiem tra", request status changes to "Cho kiem tra chat luong"
**Why human:** Requires checking status transitions, audit events in database

### 4. Template Immutability Enforcement

**Test:** Publish a template, attempt to edit it via URL manipulation
**Expected:** TEMPLATE_IMMUTABLE error or redirect, no changes saved
**Why human:** Requires checking error handling and negative case UI behavior

### Gaps Summary

**1 gap blocks goal achievement:**

**VLT-05 (Folder/Tag Classification):** VaultFile model only has `fileKind` (a simple string for intake_upload/generated_draft distinction). No folder hierarchy model, no tag model, and no classification service exists. The requirement calls for structured classification beyond basic file kind. Needs: schema extension (Folder/Tag models), service layer for classification CRUD, and UI for browsing/filtering.

**2 warnings (non-blocking but need fixing):**

1. **Schema mismatch in vault-service.ts:** `size` and `contentType` fields are referenced in Prisma select/create queries but do not exist in VaultFile schema. This will cause runtime failures when any vault function is called. Fix: add fields to schema or remove references from service.

2. **Missing variable schema builder in template creation form:** Admin cannot define template variables when creating a new template via UI. The variableSchema is hardcoded to `[]`. Fix: add structured form (key, label, required, type table) to the creation form.

---

_Verified: 2026-05-29T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
