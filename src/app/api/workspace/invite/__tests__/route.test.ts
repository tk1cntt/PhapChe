/**
 * POST /api/workspace/invite — Route Tests
 * Whitebox, blackbox, abnormal, error testcases (CLAUDE.md).
 * Focus: email validation now uses shared isValidEmail().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaceMembership: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

import { POST } from '../route';
import { NextRequest } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

function createReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/workspace/invite', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mockValidDb(email = 'user@example.com') {
  vi.mocked(requireAppSession).mockResolvedValue({
    userId: 'user-1',
    activeWorkspaceId: 'ws-1',
  } as never);
  vi.mocked(prisma.workspaceMembership.findFirst).mockResolvedValue({
    workspaceId: 'ws-1',
    userId: 'user-1',
    role: 'super_admin',
    isActive: true,
  } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: 'user-2',
    name: 'Invitee',
    email,
  } as never);
  vi.mocked(prisma.workspaceMembership.upsert).mockResolvedValue({
    id: 'membership-1',
    workspaceId: 'ws-1',
    userId: 'user-2',
    role: 'customer',
    isActive: true,
    user: { id: 'user-2', name: 'Invitee', email },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: email validation contract
// ═══════════════════════════════════════════════════════════
describe('POST /api/workspace/invite — email validation', () => {
  it('returns 400 for invalid email (unicode)', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'tést@exämple.com', role: 'customer' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid email format');
  });

  it('returns 400 for consecutive dots in domain', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example..com', role: 'customer' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for TLD of 1 char', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.c', role: 'customer' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for label starting with hyphen', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@-example.com', role: 'customer' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for trailing dot', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.com.', role: 'customer' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a@b.c', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'a@b.c', role: 'customer' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing entirely', async () => {
    mockValidDb();
    const res = await POST(createReq({ role: 'customer' }));
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════
// WHITEBOX: valid email proceeds through invite flow
// ═══════════════════════════════════════════════════════════
describe('POST /api/workspace/invite — valid email success path', () => {
  it('accepts plain valid email and creates membership', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe('Member added successfully');
    expect(prisma.workspaceMembership.upsert).toHaveBeenCalledTimes(1);
  });

  it('accepts plus-tag and multi-label emails', async () => {
    mockValidDb('user+tag@example.co.uk');
    const res = await POST(
      createReq({ email: 'user+tag@example.co.uk', role: 'customer' })
    );
    expect(res.status).toBe(201);
  });

  it('accepts dotted local part and subdomain', async () => {
    mockValidDb('first.last@sub.domain.org');
    const res = await POST(
      createReq({ email: 'first.last@sub.domain.org', role: 'customer' })
    );
    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: role and auth edge cases
// ═══════════════════════════════════════════════════════════
describe('POST /api/workspace/invite — abnormal inputs', () => {
  it('returns 400 for invalid role', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.com', role: 'bogus' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid role');
  });

  it('returns 401 when no active workspace', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: null,
    } as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not a workspace member', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspaceMembership.findFirst).mockResolvedValue(null as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(403);
  });

  it('returns 403 when role lacks invite permission', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({
      userId: 'user-1',
      activeWorkspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspaceMembership.findFirst).mockResolvedValue({
      workspaceId: 'ws-1',
      userId: 'user-1',
      role: 'customer',
      isActive: true,
    } as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('You do not have permission to invite members');
  });
});

// ═══════════════════════════════════════════════════════════
// ERROR: DB failures
// ═══════════════════════════════════════════════════════════
describe('POST /api/workspace/invite — error paths', () => {
  it('returns 404 when invited user not found', async () => {
    mockValidDb();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when inviting self', async () => {
    mockValidDb();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      name: 'Self',
      email: 'user@example.com',
    } as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('You cannot invite yourself to the workspace');
  });

  it('returns 500 when DB throws', async () => {
    mockValidDb();
    vi.mocked(prisma.workspaceMembership.upsert).mockRejectedValue(
      new Error('DB connection failed')
    );
    const res = await POST(createReq({ email: 'user@example.com', role: 'customer' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });
});
