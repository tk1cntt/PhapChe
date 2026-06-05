---
phase: 06-delivery
plan: 05
subsystem: delivery-secure-downloads
tags: [delivery, vault, security, hmac, signed-url]
dependency_graph:
  requires: [06-01, 06-02, 06-03, 06-04]
  provides: [DLV-02-secure-downloads]
  affects: [src/lib/documents/vault-service.ts, src/app/api/vault/[vaultFileId]/download/route.ts]
tech_stack:
  added: []
  patterns: [HMAC signed URL, timingSafeEqual verification, no-store download response]
key_files:
  created:
    - .planning/phases/06-delivery/06-05-SUMMARY.md
  modified:
    - src/lib/documents/vault-service.ts
    - src/lib/documents/vault-service.test.ts
    - src/lib/delivery/delivery-service.test.ts
    - src/app/api/vault/[vaultFileId]/download/route.ts
decisions:
  - Bare customer download links redirect server-side to signed HMAC URL to keep UI simple and avoid exposing storage internals.
metrics:
  completed_at: 2026-05-31T15:16:51Z
  duration_minutes: 15
  tasks_completed: 2
---

# Phase 06 Plan 05: Secure Download Gap Closure Summary

## One-liner

Vault downloads now use 15-minute HMAC-signed URLs and route-side verification before private file access.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Add HMAC signed vault access URLs | e767b27 | `src/lib/documents/vault-service.ts`, `src/lib/documents/vault-service.test.ts`, `src/lib/delivery/delivery-service.test.ts` |
| 2 | Verify signature in download route and fix bare customer link | ebf6eb5 | `src/app/api/vault/[vaultFileId]/download/route.ts` |

## What Changed

- Added HMAC signing for `vaultFileId.userId.expires` using `VAULT_DOWNLOAD_SECRET`, then `NEXTAUTH_SECRET`, then dev fallback.
- Added `verifyVaultFileAccessSignature()` with malformed-signature safety and `timingSafeEqual`.
- Updated access URL shape to include `expires`, `userId`, and `signature` only.
- Updated download route to redirect missing signed query fields to a fresh signed URL.
- Updated download route to reject wrong-user and tampered links with 403 before payload/file read.
- Preserved expired-link 410 behavior and `Cache-Control: no-store`.

## Verification

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | Failed | Pre-existing unrelated TypeScript errors in admin templates, intake, reviewer, draft service, foundation/upload tests. No new plan-file type error identified. |
| `npx tsx --test src/lib/documents/vault-service.test.ts` | Blocked | Existing platform mismatch: installed `@esbuild/win32-x64`, WSL needs `@esbuild/linux-x64`. |
| `npx tsx --test src/lib/delivery/delivery-service.test.ts` | Blocked | Same esbuild platform mismatch. |

## Deviations from Plan

### Auto-fixed Issues

None beyond planned gap closure.

### Deferred Issues

- Repository typecheck has pre-existing unrelated errors outside plan scope.
- Node test execution blocked by existing Windows/WSL esbuild binary mismatch under `/mnt/d/PhapChe/node_modules`.

## Known Stubs

None in production files changed for this plan. Test fixtures intentionally include `storageKey`, `generatedContent`, `inputSnapshot`, reviewer, and checklist strings to assert sensitive data is not exposed.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: signed-download-query | `src/lib/documents/vault-service.ts` | New HMAC signature boundary for customer browser download parameters, covered by plan threat model T-06-05-01 through T-06-05-05. |
| threat_flag: download-route-verification | `src/app/api/vault/[vaultFileId]/download/route.ts` | Route now validates signed query before vault payload and file read, covered by plan threat model. |

## Self-Check: PASSED

- Commit `e767b27` exists for Task 1.
- Commit `ebf6eb5` exists for Task 2.
- Summary file exists at `.planning/phases/06-delivery/06-05-SUMMARY.md`.
- Shared orchestrator artifacts `STATE.md` and `ROADMAP.md` not modified by this executor.
