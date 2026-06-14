---
status: complete
date: 2026-06-14
---

# Quick Task: fix-messages-poll

## Summary

### Task 1: Fix poll logic không xóa thread-list ✅
- **Files:** src/components/messages/MessagesClient.tsx
- **Change:** Sửa poll handler sử dụng MERGE logic thay vì REPLACE
- **Before:** `setThreads(data.threads)` - thay thế toàn bộ threads
- **After:** Merge threads mới với threads hiện có, không xóa threads cũ

### Task 2: Tạo API endpoint fetch messages theo requestId ✅
- **Files:** src/app/api/messages/[requestId]/route.ts
- **Change:** Tạo GET /api/messages/[requestId] endpoint
- **Response:** `{ messages: [...] }` với messages được sắp xếp theo thời gian

### Task 3: Wire click handler để fetch và hiển thị messages ✅
- **Files:** src/components/messages/MessagesClient.tsx
- **Change:** Khi click vào thread, fetch messages từ API và hiển thị trong msg-list

### Task 4: Seed messages link với legalRequestId ✅
- **Files:** prisma/seed-messages.ts
- **Change:** Update seed script để link messages với legalRequestId
- **Verification:** Đã seed 4 legal requests với messages được link

## Commits
- 1. fix: merge threads instead of replace in poll handler
- 2. feat: add API endpoint to fetch messages by requestId
- 3. feat: fetch messages when clicking a thread
- 4. fix: link seed messages to legalRequestId
