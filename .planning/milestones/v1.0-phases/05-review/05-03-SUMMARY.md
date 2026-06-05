---
phase: "05"
plan: "03"
subsystem: review
tags: [reviewer, split-view, QC-LEG-01, checklist]
dependency_graph:
  requires:
    - "05-01"
    - "05-02"
  provides:
    - "review-detail-page"
  affects:
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
    - src/components/checklist-panel.tsx
tech_stack:
  added: []
  patterns: [split-view, collapsible-groups, async-server-component]
key_files:
  created:
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
  modified: []
decisions: []
metrics:
  duration: "~2 minutes"
  completed_date: "2026-05-30"
---

# Phase 05 Plan 03: Review Detail Page — Summary

## One-liner

Reviewer portal split-view page: document preview left, QC-LEG-01 checklist right with 9 items in 3 collapsible groups.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create review detail page with split view layout | e0220c7 | `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` |

## Acceptance Criteria Results

| Criterion | Result |
|-----------|--------|
| Review page file exists at reviewer/requests/[requestId]/review/[documentVersionId] | PASS |
| Split view layout with grid-cols-2 | PASS |
| All 3 group labels: Yêu cầu hình thức, Nội dung pháp lý, Thủ tục và ký nháy | PASS |
| Both action buttons: Phê duyệt, Yêu cầu sửa đổi | PASS |
| Required badge "Bắt buộc" present | PASS |

## What Was Built

- **Review detail page** at `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx`
- **Split view layout**: 50/50 on desktop (`lg:grid-cols-2`), stacked on mobile
- **Left panel**: Document preview placeholder with "Nội dung tài liệu" header
- **Right panel**: QC checklist panel with 9 items from QC-LEG-01 in 3 collapsible groups
- **3 collapsible groups**: Yêu cầu hình thức (3 items), Nội dung pháp lý (4 items), Thủ tục và ký nháy (2 items)
- **Action buttons**: "Phê duyệt" (disabled) and "Yêu cầu sửa đổi"
- **Required badge**: "Bắt buộc" shown on required checklist items
- **Session guard**: Redirects to /login if no session

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Line | Stub |
|------|------|------|
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` | ~78 | TODO: Load review data (DocumentVersion, LegalRequest, ReviewChecklistAnswer) |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` | ~98 | TODO: Render document content from VaultFile storageKey |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` | ~136 | TODO: Comment toggle and textarea for failures |

These stubs are intentional — data loading and interactive checklist state require backend actions (Plan 05-04 handles checklist submission actions).

## Threat Flags

None — no new security surface introduced.

## Self-Check

- [x] Review page file exists at correct path
- [x] Split view grid-cols-2 present
- [x] All 3 group labels present
- [x] Both action buttons present
- [x] Required badge present
- [x] Commit hash e0220c7 exists in git log