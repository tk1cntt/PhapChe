---
phase: "43"
name: "Messages"
slug: "messages"
created: "2026-06-13"
status: "completed"
completed: "2026-06-13"
---

# Phase 43: Messages — Real-time Messaging Integration

## Domain

**What this phase delivers:** Connect the Messages page (`/vi/messages`) to real Prisma queries for message threads, real-time message sending/receiving, and proper message-cases relationship.

## Implementation Complete ✅

All components and API routes have been implemented following the Phase 42 pattern.

### Files Created

**Components (`src/components/messages/`):**
- `ThreadItem.tsx` - Thread row with avatar
- `MessageBubble.tsx` - In/out message bubbles
- `Composer.tsx` - Message input component
- `InfoPanel.tsx` - Case details panel
- `ThreadListPanel.tsx` - Left panel with thread list
- `ChatPanel.tsx` - Center panel with messages
- `MessagesContainer.tsx` - 3-column layout container
- `MessagesClient.tsx` - Client component with polling
- `index.ts` - Component exports
- `messages.css` - Complete styling

**Page (`src/app/[locale]/messages/`):**
- `page.tsx` - Server component with Prisma queries

**API Routes (`src/app/api/messages/`):**
- `send/route.ts` - POST endpoint for sending messages
- `poll/route.ts` - GET endpoint for polling updates

**Schema Changes (`prisma/schema.prisma`):**
- Added `legalRequestId` to Message model
- Added `messages` relation to LegalRequest model

**Translations (`src/messages/`):**
- `vi.json` - Added 10 new keys
- `en.json` - Added 10 new keys

## Architecture

```
src/app/[locale]/messages/page.tsx     # Server component
├── Prisma queries for threads (LegalRequest)
├── Prisma queries for stats (Message count)
└── MessagesClient (Client component)
    ├── ThreadListPanel (left, 380px)
    ├── ChatPanel (center, flex)
    └── InfoPanel (right, 320px)

src/app/api/messages/
├── send/route.ts   # POST - Create message
└── poll/route.ts   # GET - Poll for updates (10s interval)
```

## Decided

### D-43-01: Architecture Pattern
- Components in `src/components/messages/`, NOT `src/legacy/`
- Source code in `src/legacy/` for reference only

### D-43-02: Real-time Strategy
- 10-second polling interval
- Optimistic message sending with error rollback

### D-43-03: Message Model
- Message linked to LegalRequest via `legalRequestId`
- Enables thread-per-request conversation model

## Deferred

- File attachment uploads (Phase 52+)
- Push notifications
- Message search
- SSE/WebSocket real-time (MVP polling sufficient)
