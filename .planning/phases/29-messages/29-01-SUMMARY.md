---
phase: 29
plan: 01
subsystem: user-portal
tags:
  - messages
  - user-portal
  - 3-column-layout
  - messages-ui
dependency_graph:
  requires: []
  provides:
    - src/app/[locale]/[workspaceSlug]/messages/page.tsx
    - src/app/[locale]/[workspaceSlug]/messages/messages.css
    - prisma/seed-messages.ts
  affects:
    - src/app/[locale]/customer/components/UserLayout.tsx
tech_stack:
  added:
    - messages.css (3-column grid layout)
    - seed-messages.ts (sample message data)
  patterns:
    - Async server component with Prisma queries
    - 3-column CSS Grid layout (360px | 1fr | 320px)
    - UserLayout wrapper pattern
    - FloatingChatButton integration
key_files:
  created:
    - src/app/[locale]/[workspaceSlug]/messages/page.tsx
    - src/app/[locale]/[workspaceSlug]/messages/messages.css
    - prisma/seed-messages.ts
  modified:
    - prisma/seed.ts
decisions:
  - "Use async server component for database queries"
  - "3-column grid: 360px thread list | 1fr chat panel | 320px info panel"
  - "Sample threads based on template D-17 (HL, QD, MT, KA)"
  - "FloatingChatButton with database-driven notification count"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-11"
  tasks: 3
  commits: 3
  files: 5
---

# Phase 29 Plan 01: Messages Page Foundation Summary

## One-liner

Created Messages page route with UserLayout wrapper, 3-column grid layout, 4 stat cards, and seed data for message threads.

## Tasks Completed

| Task | Name | Commit | Status |
| ---- | ---- | ------ | ------ |
| 1 | Create messages page route with UserLayout wrapper | 03c8f51 | Done |
| 2 | Update UserLayout navigation (already complete) | N/A | Done |
| 3 | Create sample seed data for message threads | 70cd72e | Done |

## What Was Built

### 1. Messages Page Route (`src/app/[locale]/[workspaceSlug]/messages/page.tsx`)
- Async server component with Prisma queries for message stats
- UserLayout wrapper with workspace-scoped data
- 4 StatCard components: Cuộc hội thoại, Tin chưa đọc, Đã phản hồi, Tệp đính kèm
- Database-driven stats: conversations, unread, replied (30 days), attachments
- Fallback UI for development without session

### 2. Messages CSS (`src/app/[locale]/[workspaceSlug]/messages/messages.css`)
- 3-column grid layout: `grid-template-columns: 360px 1fr 320px`
- Thread list panel styles (avatar, body, meta)
- Chat panel with header, messages container, composer
- Info panel with info-box styling
- Floating chat button positioning
- Message bubble styles (in/out)
- Panel styles matching template: border-radius 15px, box-shadow var(--soft-shadow)

### 3. Sample Seed Data (`prisma/seed-messages.ts`)
- 4 specialist users: Hà Linh (HL), Quang Dũng (QD), Minh Trang (MT), Khánh An (KA)
- Customer user: Mai Phương
- 4 message threads with 2-5 messages each
- Sample content matching template (D-17)
- Thread timestamps: 12p, 45p, 2h, 1d ago
- Updated `prisma/seed.ts` to call `seedMessages()`

### 4. UserLayout Navigation
- Already configured with `[workspaceSlug]` route pattern: `/${workspaceSlug}/messages`
- No changes needed

## Verification

- Page renders at `/[workspaceSlug]/messages` with UserLayout wrapper
- 3-column grid layout visible with proper widths
- 4 stat cards display with database values
- Sample threads display (HL, QD, MT, KA)
- Sample messages in chat panel
- Info panel with case metadata
- FloatingChatButton visible with notification count

## Deviations from Plan

### Auto-fixed Issues
None - plan executed as written.

### Deferred Items
- Pre-existing build errors in Phase 27/28 pages (cases, create) - out of scope per CLAUDE.md rules

## Requirements Coverage

| Requirement | Status |
|-------------|--------|
| CUST-MSG-01: Conversations stat from database | Done |
| CUST-MSG-02: Unread messages from database | Done |
| CUST-MSG-03: Replied count from database (30 days) | Done |
| CUST-MSG-04: Attachments from vault files | Done |

## Next Steps (Plan 02)

- ThreadListPanel interactive component with click handlers
- ChatPanel interactive with message display and composer
- InfoPanel with case details display
- Real-time message state management
