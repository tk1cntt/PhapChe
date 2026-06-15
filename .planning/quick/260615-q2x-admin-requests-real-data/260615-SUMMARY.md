---
gsd_type: quick
quick_id: 260615-q2x
slug: admin-requests-real-data
status: complete
date: 2026-06-15
commit: 5794a4d
---

# Quick Task 260615-q2x Summary

## Status: Complete ✓

## Description
Update trang http://localhost:3001/vi/admin/requests sử dụng data hiện tại trong db thay vì mock data.

## Changes Made

### 1. API Endpoints Created

- **Triage API** (`/api/admin/requests/triage`)
  - Returns requests without organization/workspace mapping
  - Auto-detects suggested organizations from email domains

- **Stats API** (`/api/admin/requests/stats`)
  - Returns dashboard statistics with status breakdown
  - Includes: pending triage, total, partner counts, SLA risk

- **Partners List API** (`/api/admin/partners`)
  - Returns all partners grouped by model type
  - Includes: specialist partners, dedicated partners
  - Shows active request counts per partner

### 2. AdminRequestsClient Updated

- Replaced all mock data with API calls
- Added loading state with spinner
- Added error state with retry button
- Dropdowns populated with real organizations, workspaces, partners
- Filter form now uses real data for options
- Status overview panel shows real statistics

## Files Modified
- `src/app/api/admin/requests/triage/route.ts` (NEW)
- `src/app/api/admin/requests/stats/route.ts` (NEW)
- `src/app/api/admin/partners/route.ts` (NEW)
- `src/components/admin/AdminRequestsClient.tsx` (UPDATED)

## Commit
`5794a4d` - feat: Update admin requests page with real database data
