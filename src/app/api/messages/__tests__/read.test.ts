/**
 * PUT /api/messages/[threadId]/read — Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdateMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

import { PUT } from '../[threadId]/read/route';
import { NextRequest } from 'next/server';

const { requireAppSession } = vi.mocked(
  (await import('@/lib/security/session'))
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/messages/[threadId]/read', () => {
  // WHITEBOX
  describe('Whitebox', () => {
    it('marks unread messages as read for current user in thread', async () => {
      requireAppSession.mockResolvedValue({ userId: 'user-1' });
      mockUpdateMany.mockResolvedValue({ count: 3 });

      const res = await PUT(
        new NextRequest('http://localhost/api/messages/req-1/read', { method: 'PUT' }),
        { params: Promise.resolve({ threadId: 'req-1' }) }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.markedCount).toBe(3);

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          legalRequestId: 'req-1',
          recipientId: 'user-1',
          isRead: false,
        },
        data: { isRead: true },
      });
    });

    it('returns markedCount 0 when no unread messages', async () => {
      requireAppSession.mockResolvedValue({ userId: 'user-1' });
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const res = await PUT(
        new NextRequest('http://localhost/api/messages/req-1/read', { method: 'PUT' }),
        { params: Promise.resolve({ threadId: 'req-1' }) }
      );

      const body = await res.json();
      expect(body.markedCount).toBe(0);
    });
  });

  // ERROR
  describe('Error', () => {
    it('returns 500 when Prisma throws', async () => {
      requireAppSession.mockResolvedValue({ userId: 'user-1' });
      mockUpdateMany.mockRejectedValue(new Error('DB error'));

      const res = await PUT(
        new NextRequest('http://localhost/api/messages/x/read', { method: 'PUT' }),
        { params: Promise.resolve({ threadId: 'req-1' }) }
      );

      expect(res.status).toBe(500);
    });
  });
});
