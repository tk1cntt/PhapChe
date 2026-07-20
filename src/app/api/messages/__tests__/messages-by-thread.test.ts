/**
 * GET /api/messages/[requestId] — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMessageFindMany = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      findMany: (...args: unknown[]) => mockMessageFindMany(...args),
    },
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

import { GET } from '../[requestId]/route';
import { NextRequest } from 'next/server';

const { requireAppSession } = vi.mocked(
  (await import('@/lib/security/session'))
);

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
describe('GET /api/messages/[requestId]', () => {
  describe('Whitebox', () => {
    it('returns transformed messages with sender names', async () => {
      requireAppSession.mockResolvedValue({
        userId: 'user-1',
        activeWorkspaceId: 'ws-1',
      });

      mockMessageFindMany.mockResolvedValue([
        {
          id: 'msg-1',
          content: 'Xin chào',
          senderId: 'user-2',
          legalRequestId: 'req-1',
          createdAt: new Date('2026-07-20T10:00:00Z'),
        },
        {
          id: 'msg-2',
          content: 'Chào bạn',
          senderId: 'user-1',
          legalRequestId: 'req-1',
          createdAt: new Date('2026-07-20T10:05:00Z'),
        },
      ]);

      mockUserFindMany.mockResolvedValue([
        { id: 'user-1', name: 'Tôi' },
        { id: 'user-2', name: 'Nguyễn Văn B' },
      ]);

      const res = await GET(
        new NextRequest('http://localhost/api/messages/req-1'),
        { params: Promise.resolve({ requestId: 'req-1' }) }
      );

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.messages).toHaveLength(2);
      expect(body.messages[0]).toMatchObject({
        id: 'msg-1',
        content: 'Xin chào',
        senderName: 'Nguyễn Văn B',
        isOutgoing: false,
      });
      expect(body.messages[1]).toMatchObject({
        id: 'msg-2',
        content: 'Chào bạn',
        senderName: 'Tôi',
        isOutgoing: true,
      });
    });

    it('orders messages by createdAt ascending', async () => {
      requireAppSession.mockResolvedValue({
        userId: 'user-1',
        activeWorkspaceId: 'ws-1',
      });
      mockMessageFindMany.mockResolvedValue([]);
      mockUserFindMany.mockResolvedValue([]);

      await GET(
        new NextRequest('http://localhost/api/messages/req-1'),
        { params: Promise.resolve({ requestId: 'req-1' }) }
      );

      expect(mockMessageFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      );
    });
  });

  describe('Blackbox', () => {
    it('returns empty messages array when thread has no messages', async () => {
      requireAppSession.mockResolvedValue({
        userId: 'user-1',
        activeWorkspaceId: 'ws-1',
      });
      mockMessageFindMany.mockResolvedValue([]);
      mockUserFindMany.mockResolvedValue([]);

      const res = await GET(
        new NextRequest('http://localhost/api/messages/req-1'),
        { params: Promise.resolve({ requestId: 'req-1' }) }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toEqual([]);
    });
  });

  describe('Error', () => {
    it('returns 500 when Prisma throws', async () => {
      requireAppSession.mockResolvedValue({
        userId: 'user-1',
        activeWorkspaceId: 'ws-1',
      });
      mockMessageFindMany.mockRejectedValue(new Error('DB error'));

      const res = await GET(
        new NextRequest('http://localhost/api/messages/req-1'),
        { params: Promise.resolve({ requestId: 'req-1' }) }
      );

      expect(res.status).toBe(500);
    });
  });
});
