/**
 * POST /api/messages/send — Unit Tests
 * Whitebox, blackbox, abnormal, error testcases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockMessageCreate = vi.fn();
const mockMessageFindUnique = vi.fn();
const mockRequestUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      create: (...args: unknown[]) => mockMessageCreate(...args),
    },
    legalRequest: {
      findUnique: (...args: unknown[]) => mockMessageFindUnique(...args),
      update: (...args: unknown[]) => mockRequestUpdate(...args),
    },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

import { POST } from '../send/route';
import { NextRequest } from 'next/server';

function createReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/messages/send', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const { requireAppSession } = vi.mocked(
  (await import('@/lib/security/session'))
);

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
// WHITEBOX: success path, internal logic
// ═══════════════════════════════════════════════════════════
describe('POST /api/messages/send — Whitebox', () => {
  it('creates message and updates request updatedAt on success', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-customer',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-customer',
    });
    mockMessageCreate.mockResolvedValue({
      id: 'new-msg',
      content: 'Hello',
    });
    mockRequestUpdate.mockResolvedValue({});

    const res = await POST(createReq({ threadId: 'req-1', content: 'Hello' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockMessageCreate).toHaveBeenCalledTimes(1);
    expect(mockRequestUpdate).toHaveBeenCalledTimes(1);
  });

  it('sets recipient to specialist when sender is customer', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-customer',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-customer',
    });
    mockMessageCreate.mockResolvedValue({ id: 'msg-1' });
    mockRequestUpdate.mockResolvedValue({});

    await POST(createReq({ threadId: 'req-1', content: 'Hello' }));

    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: 'user-spec',
        }),
      })
    );
  });

  it('sets recipient to customer when sender is specialist', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-spec',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-customer',
    });
    mockMessageCreate.mockResolvedValue({ id: 'msg-1' });
    mockRequestUpdate.mockResolvedValue({});

    await POST(createReq({ threadId: 'req-1', content: 'Phản hồi' }));

    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: 'user-customer',
        }),
      })
    );
  });

  it('sets isRead to false for new message', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-1',
    });
    mockMessageCreate.mockResolvedValue({ id: 'msg-1' });
    mockRequestUpdate.mockResolvedValue({});

    await POST(createReq({ threadId: 'req-1', content: 'Hello' }));

    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRead: false }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: API contract
// ═══════════════════════════════════════════════════════════
describe('POST /api/messages/send — Blackbox', () => {
  beforeEach(() => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-1',
    });
    mockMessageCreate.mockResolvedValue({ id: 'msg-1' });
    mockRequestUpdate.mockResolvedValue({});
  });

  it('returns 400 when threadId is missing', async () => {
    const res = await POST(createReq({ content: 'Hello' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(createReq({ threadId: 'req-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is empty', async () => {
    const res = await POST(createReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 404 when legal request not found', async () => {
    mockMessageFindUnique.mockResolvedValue(null);
    const res = await POST(createReq({ threadId: 'nonexistent', content: 'Hi' }));
    expect(res.status).toBe(404);
  });

  it('returns 200 with success:true on valid request', async () => {
    const res = await POST(createReq({ threadId: 'req-1', content: 'Test' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: edge cases
// ═══════════════════════════════════════════════════════════
describe('POST /api/messages/send — Abnormal', () => {
  beforeEach(() => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-1',
    });
    mockMessageCreate.mockResolvedValue({ id: 'msg-1' });
    mockRequestUpdate.mockResolvedValue({});
  });

  it('handles very long content (10k chars)', async () => {
    const res = await POST(
      createReq({ threadId: 'req-1', content: 'A'.repeat(10000) })
    );
    expect(res.status).toBe(200);
  });

  it('handles content with special characters and emoji', async () => {
    const res = await POST(
      createReq({ threadId: 'req-1', content: '🚀 Hợp đồng OK ✅. Kiểm tra <script>' })
    );
    expect(res.status).toBe(200);
  });

  it('handles when assignedSpecialistId is null', async () => {
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: null,
      createdById: 'user-1',
    });
    mockMessageCreate.mockResolvedValue({ id: 'msg-1' });

    const res = await POST(createReq({ threadId: 'req-1', content: 'Hello' }));
    expect(res.status).toBe(200);
  });

  it('handles activeWorkspaceId being empty string', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: '',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-1',
    });

    const res = await POST(createReq({ threadId: 'req-1', content: 'Hello' }));
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════
// ERROR: server errors
// ═══════════════════════════════════════════════════════════
describe('POST /api/messages/send — Error', () => {
  it('returns 500 when Prisma throws', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockRejectedValue(new Error('DB connection failed'));

    const res = await POST(createReq({ threadId: 'req-1', content: 'Hello' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to send message');
  });

  it('returns 500 when messageCreate throws', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    });
    mockMessageFindUnique.mockResolvedValue({
      workspaceId: 'ws-1',
      assignedSpecialistId: 'user-spec',
      createdById: 'user-1',
    });
    mockMessageCreate.mockRejectedValue(new Error('Write failed'));

    const res = await POST(createReq({ threadId: 'req-1', content: 'Hello' }));
    expect(res.status).toBe(500);
  });

  it('returns 500 when request body is malformed JSON', async () => {
    requireAppSession.mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    });

    const req = new NextRequest('http://localhost/api/messages/send', {
      method: 'POST',
      body: 'not-json{{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
