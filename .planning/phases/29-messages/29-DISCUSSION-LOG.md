# Phase 29: Messages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 29-messages
**Mode:** auto
**Areas discussed:** Layout structure, Stat cards, Thread list, Chat panel, Info panel, Floating chat, Data source, Test coverage

---

## Summary

Phase 29 implements the Messages page (`user-messages.html`) with 3-column layout for viewing and managing conversations with legal specialists.

### Decisions Made (Auto Mode)

| Area | Decision | Status |
|------|----------|--------|
| Layout structure | 3-column: thread list (360px) + chat panel (1fr) + info panel (320px) | ✓ Selected |
| Stat cards | 4 cards: Cuộc hội thoại (8), Tin chưa đọc (4), Đã phản hồi (21), Tệp đính kèm (14) | ✓ Selected |
| Thread list | 4 sample threads with avatars (HL, QD, MT, KA) | ✓ Selected |
| Chat panel | In/out message styling with composer input | ✓ Selected |
| Info panel | Request metadata with 4 info boxes | ✓ Selected |
| Floating chat | Red gradient with "2 Tin mới" badge | ✓ Selected |
| Data source | All data from SQLite via Prisma queries | ✓ Selected |
| Test coverage | Whitebox, blackbox, abnormal, error, E2E | ✓ Selected |

## Gray Areas (Auto-Resolved)

All gray areas were auto-resolved using recommended defaults from prior phases:

1. **Layout structure** → 3-column grid matching template
2. **Stat cards** → Reuse StatCard component from Phase 26
3. **Thread list** → Reuse panel patterns from prior phases
4. **Chat panel** → Template CSS for message styling
5. **Info panel** → Template CSS for info boxes
6. **Floating chat** → Reuse FloatingChatButton from Phase 26
7. **Data source** → All from database via Prisma
8. **Test coverage** → Full coverage per v1.4 requirements

## Auto-Resolved Items

- Thread timestamp display format: relative time (from template)
- Composer input validation: basic validation (deferred to future)
- Message scroll behavior: scrollable container (from template)
- Online status indicator: shown in template (from template)

---

*Phase: 29-messages*
*Discussion completed: 2026-06-11*
