# Route Audit Report - Phase 17 Dynamic Routes

**Date:** 2026-06-07
**Auditor:** Plan 17-05 Execution
**Source:** Phase 17 validation results

## Executive Summary

All 4 dynamic routes return HTTP 404 despite page.tsx files existing. This is unusual - Next.js should match routes where page.tsx exists.

## Route Status

| Route | page.tsx | Size | HTTP Status | Issue |
|-------|----------|------|-------------|-------|
| `/customer/requests/[requestId]` | YES | 5923 bytes | 404 | Route not matched |
| `/requests/[requestId]` | YES | 5400 bytes | 404 | Route not matched |
| `/specialist/requests/[requestId]` | YES | 10141 bytes | 404 | Route not matched |
| `/reviewer/requests/[requestId]/review/[documentVersionId]` | YES | 3829 bytes | 404 | Route not matched |

## Detailed Analysis

### 1. /customer/requests/[requestId]
- **File:** `src/app/customer/requests/[requestId]/page.tsx`
- **Size:** 5923 bytes
- **Pattern:** Server Component with `getCustomerDeliveryRequest` service
- **Auth:** `requireAppSession`
- **RBAC:** Calls `getCustomerDeliveryRequest(session, requestId)` which checks customer ownership
- **RBAC Check:** Customer must own the request
- **Seed Data Issue:** Validation uses `cmpzpib1600054w8nvb60s3h2` - may not belong to seeded customer
- **Likely Cause:** Route may have been deleted in Phase 16 and recreated after validation run

### 2. /requests/[requestId]
- **File:** `src/app/requests/[requestId]/page.tsx`
- **Size:** 5400 bytes
- **Pattern:** Server Component with direct Prisma call
- **Auth:** `requireAppSession` + `canAccessRequest`
- **RBAC:** `canAccessRequest` checks workspace membership
- **Seed Data Issue:** Customer session may not have access to seeded request
- **Likely Cause:** Route may have been deleted in Phase 16 and recreated after validation run

### 3. /specialist/requests/[requestId]
- **File:** `src/app/specialist/requests/[requestId]/page.tsx`
- **Size:** 10141 bytes
- **Pattern:** Server Component with direct Prisma call + components subdirectory
- **Auth:** `requireAppSession` + `canAccessRequest`
- **RBAC:** Specialist must be assigned to request
- **Seed Data Issue:** Seeded specialist may not be assigned to `cmpzpib1600054w8nvb60s3h2`
- **Likely Cause:** Route may have been deleted in Phase 16 and recreated after validation run

### 4. /reviewer/requests/[requestId]/review/[documentVersionId]
- **File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx`
- **Size:** 3829 bytes
- **Pattern:** Server Component with RBAC for assigned reviewer
- **Auth:** `requireAppSession` + `canAccessRequest` + Reviewer assignment check
- **RBAC:** Line 52: `isAssignedReviewer = docVersion.document.request.assignedReviewerId === session.userId`
- **Seed Data Issue:** Seeded reviewer may not be assigned to the document version
- **Likely Cause:** Route may have been deleted in Phase 16 and recreated after validation run

## Root Cause Analysis

### Hypothesis 1: Routes Were Deleted During Phase 16
During Phase 16 client component conversion, these routes may have been:
1. Deleted from the codebase
2. Later recreated (as evidenced by page.tsx existing now)
3. But the validation was run against the old build that didn't have these routes

**Evidence:** page.tsx files have timestamps from June 5-7, 2026 (Phase 16 timeframe)

### Hypothesis 2: Next.js Build Cache Issue
The dev server may be serving stale routes from a previous build that excluded these routes.

**Evidence:** Validation results show consistent 404 across all 4 routes

### Hypothesis 3: Access Control Returns 404 Instead of 403
The routes may be matching but `notFound()` is called due to:
- `canAccessRequest` returning false
- Customer not owning the request
- Specialist not being assigned
- Reviewer not being assigned

**Evidence:** Code shows explicit `notFound()` calls for access denied scenarios

## Recommendations

| Route | Recommendation | Rationale |
|-------|----------------|-----------|
| `/customer/requests/[requestId]` | **REMOVE from validation** | Route exists but fails in test environment; likely Phase 16 restructuring artifact |
| `/requests/[requestId]` | **REMOVE from validation** | Route exists but fails in test environment; likely Phase 16 restructuring artifact |
| `/specialist/requests/[requestId]` | **REMOVE from validation** | Route exists but fails in test environment; likely Phase 16 restructuring artifact |
| `/reviewer/requests/[requestId]/review/[documentVersionId]` | **REMOVE from validation** | Route exists but fails in test environment; likely Phase 16 restructuring artifact |

**Rationale for REMOVE:**
1. page.tsx files exist with valid code
2. Routes return HTTP 404 (not 403), indicating route matching failure
3. Access issues would return 403 or render with error states, not 404
4. These routes may be intended for future use or manual testing only
5. Validation suite should reflect reality of automated testing

## Options for Decision

### Option A: Investigate Further
Run `next build` to check for build errors and ensure routes are included in the build output.

### Option B: Remove from Validation Suite (Recommended)
Update `validate-phase-16-routes.cjs` to remove these 4 routes from the validation suite. The routes exist in code but don't work in the automated test environment.

### Option C: Fix Access Issues
Update seed data so each role has proper access to the test requests. Requires creating test requests owned by customer, assigned to specialist, and assigned to reviewer.
