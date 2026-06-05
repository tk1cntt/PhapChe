# Phase 10: ux-hardening - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Source:** `/gsd-audit-milestone` gap closure

<domain>
## Phase Boundary

Close DLV-02 UX degradation (customer download redirect), fix `listDocumentVersions` Prisma duplicate `document` key, and surface deliver/close feedback to specialist.

This phase does not change review service layer (Phase 08), folder/tag classification (Phase 09), or any backend workflow rules.

</domain>

<decisions>
## Implementation Decisions

### listDocumentVersions Fix (BLOCKER)
- **D-01:** `src/lib/documents/draft-service.ts` `listDocumentVersions` (around line 199-220) has two `document: { ... }` blocks in the Prisma `select`. Merge into a single block. This unblocks the specialist workbench.
- **D-02:** Add regression test that calls `listDocumentVersions` with a real or mocked Prisma client and asserts it does not throw on duplicate key.

### Customer Download UX (DLV-02)
- **D-03:** `src/app/customer/requests/[requestId]/page.tsx` renders download link as `/api/vault/${document.vaultFileId}/download` with a bare path. Change to inline the signed URL from `requestVaultFileAccess()` so the browser makes a single request without redirect.
- **D-04:** Signed URL TTL remains 15 minutes per Phase 06 CONTEXT D-08.
- **D-05:** Add regression test covering the customer download path with a valid signed URL.

### Deliver/Close Feedback
- **D-06:** `src/app/specialist/requests/[requestId]/page.tsx` does not render `markDeliveredAction`/`closeDeliveredAction` result. Consume the `{ ok, message }` state and render success/failure messages using existing `Badge` or inline copy.
- **D-07:** Success message uses Vietnamese copy: "Đã giao tài liệu thành công" / "Đã đóng hồ sơ".
- **D-08:** Failure message uses Vietnamese copy: the error message from the action result.

### Claude's Discretion
- Exact UI for action result feedback (inline alert, banner, badge) may follow existing patterns.
- Exact test harness for regression tests may use `tsx` scripts consistent with existing service tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — DLV-02, DLV-05 (UX feedback).
- `.planning/ROADMAP.md` — Phase 10 goal, success criteria.

### Audit source
- `.planning/v1.0-MILESTONE-AUDIT.md` — G-2 (listDocumentVersions bug), G-4 (customer download UX), G-5 (silent deliver/close feedback).

### Existing implementation anchors
- `src/lib/documents/draft-service.ts` — `listDocumentVersions` (bug location).
- `src/lib/documents/vault-service.ts` — `requestVaultFileAccess()` returns signed URL.
- `src/app/customer/requests/[requestId]/page.tsx` — Customer delivery page with bare download link.
- `src/app/specialist/requests/[requestId]/page.tsx` — Specialist page with deliver/close forms.
- `src/app/specialist/requests/[requestId]/actions.ts` — `markDeliveredAction`, `closeDeliveredAction` returning `{ ok, message }`.
- `src/app/admin/components/ui.tsx` — Badge, Button for feedback rendering.

</canonical_refs>

<deferred>
## Deferred Ideas

- Email provider real integration (currently stub) — v2 production.
- Delivery notification queue/worker — v2 infra.
- Customer in-app notification center — v2 customer UX.

</deferred>

---

*Phase: 10-ux-hardening*
*Context gathered: 2026-06-02*
