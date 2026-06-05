# Phase 4: documents-vault - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29T00:00:00Z
**Phase:** 04-documents-vault
**Mode:** auto
**Areas discussed:** Template Governance, Draft Generation, Document Versioning, Legal Vault Storage, Security and Traceability

---

## Template Governance

| Option | Description | Selected |
|--------|-------------|----------|
| Versioned template records | Workspace/matter-type scoped templates with explicit statuses and immutable published versions | ✓ |
| Freeform editable templates | Simpler but risks old/changed template confusion | |

**Auto choice:** Versioned template records.
**Notes:** Matches project constraint: template governance must prevent using stale templates.

---

## Draft Generation

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic template variable replacement | Proves MVP path without AI/legal reasoning risk | ✓ |
| AI-assisted drafting | More powerful but out of MVP and conflicts with no AI lawyer constraint | |
| Rich DOCX/PDF rendering first | Better fidelity but overbuild before workflow proof | |

**Auto choice:** Deterministic template variable replacement.
**Notes:** Store input snapshot and template version for traceability.

---

## Document Versioning

| Option | Description | Selected |
|--------|-------------|----------|
| First-class immutable document versions | Supports review tied to exact version and vault history | ✓ |
| Overwrite Document row | Simpler but breaks traceability and review integrity | |

**Auto choice:** First-class immutable document versions.
**Notes:** Phase 5 review depends on exact version references.

---

## Legal Vault Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Private metadata-first vault | Reuse existing VaultFile pattern, enforce RBAC, add metadata/versioning | ✓ |
| Public URL storage | Easier demo but violates security constraints | |
| Full object storage integration now | Stronger production story but may overbuild MVP | |

**Auto choice:** Private metadata-first vault.
**Notes:** Signed URL boundary may be minimal/stubbed but storage keys must not leak as user-facing URLs.

---

## Security and Traceability

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side RBAC + audit + input snapshots | Aligns with project constraints and previous phases | ✓ |
| Frontend-only controls | Simpler but insecure | |

**Auto choice:** Server-side RBAC + audit + input snapshots.
**Notes:** Sensitive intake answers stay out of audit metadata.

---

## Claude's Discretion

- Exact Prisma model/enums can follow existing schema style.
- Exact route/component split can follow App Router patterns.
- Exact storage adapter can be local/stubbed if private boundary is preserved.

## Deferred Ideas

- Reviewer split-view checklist and approve/reject loop — Phase 5.
- Customer delivery/download UI — Phase 6.
- OCR/AI drafting/e-signature — v2.
