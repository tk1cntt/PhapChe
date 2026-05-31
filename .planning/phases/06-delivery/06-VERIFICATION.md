---
phase: 06-delivery
verified: 2026-05-31T00:00:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Downloads use short-lived signed links."
    status: failed
    reason: "Download TTL is controlled only by unsigned client query parameter `expires`; user can extend URL by editing query string. Route also regenerates access before validating query, so server does not enforce original 15-minute TTL."
    artifacts:
      - path: "src/lib/documents/vault-service.ts"
        issue: "`requestVaultFileAccess()` returns `/api/vault/${vaultFileId}/download?expires=${expiresAt.getTime()}` without HMAC/signature/server token."
      - path: "src/app/api/vault/[vaultFileId]/download/route.ts"
        issue: "Route checks only `expires < Date.now()` and has no signature/token verification."
    missing:
      - "Sign `vaultFileId` + `expires` with server secret or persist one-time/TTL token server-side."
      - "Verify signature/token in download route before streaming file."
  - truth: "Customer can download final documents through the customer page."
    status: failed
    reason: "Customer page renders bare download link without `expires`; route treats missing `expires` as `0` and returns 410."
    artifacts:
      - path: "src/app/customer/requests/[requestId]/page.tsx"
        issue: "Download href is `/api/vault/${document.vaultFileId}/download` with no signed expiry/token."
      - path: "src/app/api/vault/[vaultFileId]/download/route.ts"
        issue: "Route calls `requestVaultFileAccess()` but does not redirect to generated `accessUrl` when same path; then validates original missing query."
    missing:
      - "Generate signed link for customer page, or make route redirect when query lacks valid signed expiry/token."
      - "Add regression covering bare customer link returns usable redirect/download, not 410."
  - truth: "Internal deliver/close actions report failure to user."
    status: partial
    reason: "Server actions catch errors and discard planned messages with `void`, so failed delivery/closure is silent. This does not block state-machine safety but blocks usable close/delivery feedback."
    artifacts:
      - path: "src/app/specialist/requests/[requestId]/actions.ts"
        issue: "`markDeliveredAction()` and `closeDeliveredAction()` catch all errors and only execute `void deliveryErrorMessage` / `void closeErrorMessage`; forms receive no result."
    missing:
      - "Return action state/result and render it, or let error bubble to boundary."
human_verification:
  - test: "Customer opens `/customer/requests/[requestId]` for own delivered request with final document."
    expected: "Only final documents appear; no drafts/internal notes/reviewer comments/storage keys appear."
    why_human: "Visual route behavior and real session data need browser/session validation."
  - test: "Specialist marks approved request delivered, then closes delivered request with reason."
    expected: "Status changes approved -> delivered -> closed; notification/audit exists; UI gives clear success/failure feedback after fix."
    why_human: "End-to-end form UX and email/audit observability need running app/session."
---

# Phase 6: delivery Verification Report

**Phase Goal:** Deliver approved final documents securely to customers and close requests.
**Verified:** 2026-05-31T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Customer sees only approved final documents for own requests. | VERIFIED | `getCustomerDeliveryRequest()` checks `canAccessRequest`, `workspaceId`, `createdById`; selects `DocumentVersion.status: 'final'`; customer page uses that DTO only. |
| 2 | Downloads use short-lived signed links. | FAILED | TTL exists but is unsigned: `accessUrl` uses only `?expires=...`; route validates only numeric `expires`, no HMAC/server token. |
| 3 | Internal notes, reviewer comments, and drafts stay hidden from customer. | VERIFIED | Customer service uses whitelist fields and customer page has no `storageKey`, `generatedContent`, `inputSnapshot`, `reviewer`, or `checklist` strings. |
| 4 | Customer receives ready notification. | VERIFIED | `markRequestDelivered()` transitions to `delivered`, then calls `sendDeliveryReadyEmail()`; notification body includes request title, filenames, portal URL, and 15-minute warning. Stub provider accepted by plan/context. |
| 5 | Request can be closed after delivery with audit trail. | VERIFIED | `closeDeliveredRequest()` requires non-empty reason, expected status `delivered`, final docs, authorized actor, then calls `transitionRequestStatus(... toStatus: 'closed', reason)`, which writes workflow transition and `request.status_changed` audit. |
| 6 | Customer can download final documents through the customer page. | FAILED | Page links to `/api/vault/${document.vaultFileId}/download` without `expires`; route returns 410 when query missing. |
| 7 | Internal deliver/close actions report failure to user. | PARTIAL | Actions call backend services, but catch errors and discard messages, causing silent failure. |

**Score:** 3/5 roadmap must-haves verified. Additional UI/action checks found 2 implementation gaps.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/lib/delivery/delivery-service.ts` | Customer-safe DTO, delivery/close orchestration | VERIFIED | Exports `getCustomerDeliveryRequest`, `markRequestDelivered`, `closeDeliveredRequest`; substantive and wired. |
| `src/lib/documents/vault-service.ts` | Signed URL abstraction | FAILED | Substantive and wired, but signing missing; URL expiry is client-editable. |
| `src/app/api/vault/[vaultFileId]/download/route.ts` | Server-side download route | FAILED | Exists and streams/returns file, but missing signature verification and bare link path returns 410. |
| `src/lib/delivery/notification-service.ts` | Email adapter/stub | VERIFIED | Validates inputs and renders safe Vietnamese stub email content. |
| `src/lib/workflow/request-workflow.ts` | Delivery/close transition authorization | VERIFIED | Coordinator/admin and assigned specialist can transition to `delivered`/`closed`; transition graph enforces approved -> delivered -> closed. |
| `src/app/customer/requests/[requestId]/page.tsx` | Customer delivery page | PARTIAL | Safe DTO and final-doc rendering verified; download href not usable because it lacks signed expiry/token. |
| `src/app/specialist/requests/[requestId]/actions.ts` | Server actions for deliver/close forms | PARTIAL | Calls services and avoids direct Prisma status mutation; error handling silently discards failures. |
| `src/app/specialist/requests/[requestId]/page.tsx` | Internal delivery/close form placement | VERIFIED | Status-gated forms use `formAction={markDeliveredAction}` and `formAction={closeDeliveredAction}`. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `customer page` | `delivery-service.ts` | `getCustomerDeliveryRequest` | WIRED | Import and call present. |
| `customer page` | `/api/vault/[vaultFileId]/download` | href | PARTIAL | Link present but lacks signed expiry/token; actual route returns 410 for missing `expires`. |
| `download route` | `vault-service.ts` | `requestVaultFileAccess` | PARTIAL | Call present, but generated same-path URL is ignored for redirect when original query missing. |
| `vault-service.ts` | `audit.ts` | `recordAuditEvent` | WIRED | `vault.access_requested` logs safe `vaultFileId`, `requestId`, `expiresAt`. |
| `delivery-service.ts` | `workflow/request-workflow.ts` | `transitionRequestStatus` | WIRED | Delivery and close both use backend state machine. |
| `delivery-service.ts` | `notification-service.ts` | `sendDeliveryReadyEmail` after delivery | WIRED | Notification call occurs after delivered transition. |
| `specialist actions` | `delivery-service.ts` | `markRequestDelivered` / `closeDeliveredRequest` | WIRED | Service calls present; failure feedback unwired. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `src/app/customer/requests/[requestId]/page.tsx` | `request.documents` | `getCustomerDeliveryRequest()` Prisma queries | Yes, final `DocumentVersion` + linked `VaultFile` | FLOWING |
| `src/app/api/vault/[vaultFileId]/download/route.ts` | `body` | `getVaultFileDownloadPayload()` + `readLocalVaultFile(storageKey)` | Partial; local fallback returns configured file or generic copy | PARTIAL |
| `src/app/specialist/requests/[requestId]/page.tsx` | `request.status` | Prisma `legalRequest.findUnique()` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Runnable route/API check | Not run | Server/session required; instruction says do not start services. | SKIPPED |
| Test suite | Not run | `package.json` has no `test` script per summaries; node test blocked by platform esbuild per summaries. | SKIPPED |
| Static security check: signed expiry | Static code read | No `signature`, `hmac`, `timingSafeEqual`, or token persistence in download path. | FAIL |
| Static usability check: customer href expiry | Static code read | Customer href lacks `expires`; route defaults missing expires to `0`. | FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DLV-01 | 06-01, 06-04 | Customer can view approved final documents for own requests. | SATISFIED | Customer page uses `getCustomerDeliveryRequest`; service filters by own `createdById`, active workspace, and final versions. |
| DLV-02 | 06-02, 06-04 | Customer can download final documents through short-lived signed links. | BLOCKED | Final-only access exists, but links are not signed and page link returns 410 without `expires`. |
| DLV-03 | 06-01, 06-02, 06-04 | System hides internal notes, reviewer-only comments, and unapproved drafts from customers. | SATISFIED | Customer route uses safe DTO; no sensitive fields selected/rendered; download route blocks customer non-final files. |
| DLV-04 | 06-03, 06-04 | System notifies customer when document is ready. | SATISFIED | `markRequestDelivered()` sends stub email after delivered transition; body has title, filenames, portal URL, TTL warning. |
| DLV-05 | 06-03, 06-04 | Coordinator or specialist can close request after final delivery. | SATISFIED | `closeDeliveredRequest()` validates delivered status, final docs, reason, role/assignment, then uses workflow transition with audit. |

No orphaned Phase 6 requirement IDs found in `REQUIREMENTS.md`; DLV-01 through DLV-05 all claimed in PLAN frontmatter and accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/lib/documents/vault-service.ts` | 171 | Unsigned `expires` query | Blocker | Client can extend TTL, so DLV-02 signed short-lived link not enforced. |
| `src/app/api/vault/[vaultFileId]/download/route.ts` | 39-42 | Missing query defaults to expired | Blocker | Customer page bare download link always gets 410. |
| `src/app/specialist/requests/[requestId]/actions.ts` | 58-60, 76-78 | Catch and discard error messages | Warning | Delivery/close form failures are silent. |

### Human Verification Required

1. Customer final-document page

**Test:** Log in as customer and open `/customer/requests/[requestId]` for own request with final document.
**Expected:** Only final documents appear; no drafts/internal notes/reviewer comments/storage keys.
**Why human:** Needs real session/browser route validation.

2. Delivery/closure workflow UX

**Test:** Log in as assigned specialist/coordinator, deliver approved request, then close delivered request with reason.
**Expected:** Status changes approved -> delivered -> closed; audit exists; notification path runs; UI shows clear result after error-feedback gap fixed.
**Why human:** Form UX and notification/audit observability need running app.

### Gaps Summary

Phase 06 mostly implements customer-safe final-document visibility, notification, and closure workflow. Goal not achieved because secure download delivery is broken in two ways: `expires` is unsigned/client-editable, and customer page links omit `expires`, causing 410. Code review CR-01 and WR-01 are real implementation gaps. WR-02 also real: deliver/close server actions swallow failures.

---

_Verified: 2026-05-31T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
