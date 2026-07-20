# Phase 78: Messages — Specification

**Created:** 2026-07-20  
**Ambiguity score:** 0.05 (gate: ≤ 0.20) ✅  
**Requirements:** 8 locked  
**Status:** Code exists, cần tests + bug fixes + documentation

## Goal

Hoàn thiện Messages page với 3-column layout (thread list, chat panel, info panel), search, send message với optimistic update, polling real-time, mark-as-read, và test coverage ≥90%.

## Background

**Current state:**
- 8 UI components exist: ThreadListPanel, ThreadItem, ChatPanel, MessageBubble, Composer, InfoPanel, MessagesClient, MessagesContainer
- 4 API routes: `POST /api/messages/send`, `GET /api/messages/poll`, `GET /api/messages/[requestId]`, `GET /api/messages/unread-count`
- CSS `messages.css` complete với 3-column responsive layout
- i18n `UserMessages` namespace trong 4 locales (VI/EN/ZH/JA)
- Seed data: 30 messages qua `prisma/seed/operations.ts`

**Gap:**
- 0 tests (no unit, integration, or E2E tests)
- InfoPanel close button not wired in MessagesClient
- Mark-as-read not implemented in UI
- No SPEC/PLAN docs exist for Phase 78

## Requirements

1. **Thread List Panel**: Hiển thị danh sách threads với search, active state, avatar colors.
   - Source: `src/components/messages/ThreadListPanel.tsx`, `ThreadItem.tsx`
   - Acceptance: Threads render correctly, search filters by title/preview/code, active thread highlighted (bg #ecfdf9), click selects thread, keyboard accessible (Enter/Space)

2. **Chat Panel**: Hiển thị messages cho thread đang chọn, auto-scroll xuống dưới, composer gửi tin.
   - Source: `src/components/messages/ChatPanel.tsx`, `MessageBubble.tsx`, `Composer.tsx`
   - Acceptance: Messages hiển thị với bubble format (outgoing right gray, incoming left colored), auto-scroll khi có msg mới, Enter gửi, nút gửi disabled khi input rỗng, empty state "Bắt đầu trò chuyện"

3. **Info Panel**: Hiển thị case info (SLA, participants, documents, matter type, created date).
   - Source: `src/components/messages/InfoPanel.tsx`
   - Acceptance: Hiển thị đầy đủ thông tin case, close button hoạt động (ẩn/hiện panel), default open

4. **MessagesClient Integration**: Orchestrate 3 panels với state management, optimistic update, polling.
   - Source: `src/components/messages/MessagesClient.tsx`
   - Acceptance: Thread selection updates chat panel, send message shows optimistic update + rollback on error, poll new messages every 10s, InfoPanel close button wired

5. **Send Message API**: Gửi message qua `POST /api/messages/send`.
   - Source: `src/app/api/messages/send/route.ts`
   - Acceptance: Validates threadId/content, determines recipient (customer→specialist hoặc specialist→customer), creates message in DB, updates request updatedAt, returns 400/404/500

6. **Poll API**: Poll new messages `GET /api/messages/poll?since=&workspace=`.
   - Source: `src/app/api/messages/poll/route.ts`
   - Acceptance: Returns threads + messages since timestamp, filters by workspace, groups messages by legalRequestId, returns 400 if missing since param

7. **Mark-As-Read**: Đánh dấu message đã đọc khi user xem thread.
   - Acceptance: Khi chọn thread, mark messages from other senders as read via API, update unread badge count, UI phản ánh trạng thái đọc

8. **Tests**: Comprehensive test coverage ≥90%.
   - Acceptance: Whitebox tests (component render, state transitions), blackbox tests (user flows), abnormal tests (null data, missing fields), error tests (API failures, network errors), E2E tests (full messaging flow). Coverage ≥90%.

## Boundaries

**In scope:**
- Fix InfoPanel close button wire-up trong MessagesClient
- Implement mark-as-read behavior
- Write full test suite (whitebox, blackbox, abnormal, error, E2E)
- Fix any bugs discovered during testing
- Complete SPEC/PLAN/VERIFICATION docs

**Out of scope:**
- Major refactor of existing components
- Real-time WebSocket (current polling is sufficient)
- File attachments in messages
- Message search across all threads (thread-list search exists)
- Message edit/delete
- Mobile responsive (existing CSS covers desktop)

## Constraints

- **No Ant Design** — all components use custom Tailwind CSS
- **TypeScript strict** — all code passes strict mode
- **i18n complete** — all user-visible text in 4 locales (VI/EN/ZH/JA)
- **Polling interval** — 10 seconds default
- **Optimistic update** — send message shows immediately, rollback on failure
- **Cache:** conservative defaults (staleTime: 5min, cacheTime: 30min)

## Acceptance Criteria

- [ ] Thread search filters by title, preview, and request code
- [ ] Active thread highlighted with green background (#ecfdf9)
- [ ] Clicking thread shows messages in chat panel
- [ ] Outgoing messages align right with gray background
- [ ] Incoming messages align left with colored background
- [ ] Composer sends on Enter key
- [ ] Send button disabled when input empty
- [ ] Auto-scroll to bottom on new message
- [ ] Optimistic update shows message immediately
- [ ] Rollback on send failure (message disappears, error logged)
- [ ] InfoPanel close button hides/reveals panel
- [ ] Polling fetches new messages every 10s
- [ ] Mark-as-read updates unread badge
- [ ] Empty state shown when no messages ("Bắt đầu trò chuyện")
- [ ] Empty state shown when no threads match search
- [ ] API validates required fields (threadId, content) → 400
- [ ] API returns 404 when request/thread not found
- [ ] API returns 500 with error message on server error
- [ ] All 8 components have ≥90% test coverage
- [ ] All user-visible text in 4 locales

## File Manifest

| File | Status | Action |
|------|--------|--------|
| `src/app/[locale]/messages/page.tsx` | ✅ | Server-side data fetch |
| `src/components/messages/ThreadListPanel.tsx` | ✅ | Search + thread list |
| `src/components/messages/ThreadItem.tsx` | ✅ | Individual thread row |
| `src/components/messages/ChatPanel.tsx` | ✅ | Message view + composer |
| `src/components/messages/MessageBubble.tsx` | ✅ | Message bubble rendering |
| `src/components/messages/Composer.tsx` | ✅ | Input + send button |
| `src/components/messages/InfoPanel.tsx` | ✅ | Case info panel |
| `src/components/messages/MessagesClient.tsx` | 🔧 | Fix InfoPanel close + mark-read |
| `src/components/messages/MessagesContainer.tsx` | ⚠️ | Duplicate of MessagesClient? |
| `src/components/messages/messages.css` | ✅ | 3-column layout CSS |
| `src/components/messages/index.ts` | ✅ | Barrel exports |
| `src/app/api/messages/send/route.ts` | ✅ | Send message API |
| `src/app/api/messages/poll/route.ts` | ✅ | Poll new messages |
| `src/app/api/messages/[requestId]/route.ts` | ✅ | Get messages by thread |
| `src/app/api/messages/unread-count/route.ts` | ✅ | Unread count |
| `prisma/seed/operations.ts` | ✅ | 30 seed messages |

## Compliance

- **Data-First:** API routes exist và working
- **Ant Design Removal:** All custom Tailwind CSS
- **i18n:** UserMessages namespace, 4 locales
- **Tests:** 0→90%+ coverage target

---
*Phase: 78-messages*  
*Spec created: 2026-07-20*  
*Next step: Fix bugs → write tests → verify*
