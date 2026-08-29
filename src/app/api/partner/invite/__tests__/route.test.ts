/**
 * POST /api/partner/invite — Route Tests
 * Whitebox, blackbox, abnormal, error testcases (CLAUDE.md).
 * Focus: email validation now uses shared isValidEmail().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    partnerMember: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/partner-invite-service', () => ({
  partnerInviteService: {
    createInvite: vi.fn(),
  },
}));

import { POST } from '../route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { partnerInviteService } from '@/lib/services/partner-invite-service';

function createReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/partner/invite', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mockValidDb() {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: 'user-1', name: 'Admin', email: 'admin@example.com' },
  } as never);
  vi.mocked(prisma.partnerMember.findFirst).mockResolvedValue({
    id: 'member-1',
    partnerId: 'partner-1',
    userId: 'user-1',
    role: 'admin',
    isActive: true,
    partner: { id: 'partner-1', name: 'Partner', status: 'active' },
  } as never);
  vi.mocked(partnerInviteService.createInvite).mockResolvedValue({
    success: true,
    invite: {
      id: 'invite-1',
      partnerId: 'partner-1',
      email: 'user@example.com',
      role: 'admin',
      token: 'tok',
      status: 'pending',
      invitedBy: 'user-1',
      expiresAt: new Date(),
      createdAt: new Date(),
    },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: email validation contract
// ═══════════════════════════════════════════════════════════
describe('POST /api/partner/invite — email validation', () => {
  it('returns 400 for invalid email (unicode)', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'tést@exämple.com', role: 'admin' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid email format');
  });

  it('returns 400 for consecutive dots in domain', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example..com', role: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for TLD of 1 char', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.c', role: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for label starting with hyphen', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@-example.com', role: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for trailing dot', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.com.', role: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a@b.c', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'a@b.c', role: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    mockValidDb();
    const res = await POST(createReq({ role: 'admin' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and role are required');
  });
});

// ═══════════════════════════════════════════════════════════
// WHITEBOX: valid email proceeds through invite flow
// ═══════════════════════════════════════════════════════════
describe('POST /api/partner/invite — valid email success path', () => {
  it('accepts plain valid email and creates invite', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.com', role: 'admin' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(partnerInviteService.createInvite).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com', role: 'admin' })
    );
  });

  it('accepts plus-tag and multi-label emails', async () => {
    mockValidDb();
    const res = await POST(
      createReq({ email: 'user+tag@example.co.uk', role: 'specialist' })
    );
    expect(res.status).toBe(201);
  });

  it('accepts dotted local part and subdomain', async () => {
    mockValidDb();
    const res = await POST(
      createReq({ email: 'first.last@sub.domain.org', role: 'viewer' })
    );
    expect(res.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: role, auth, and permission edge cases
// ═══════════════════════════════════════════════════════════
describe('POST /api/partner/invite — abnormal inputs', () => {
  it('returns 400 for invalid role', async () => {
    mockValidDb();
    const res = await POST(createReq({ email: 'user@example.com', role: 'bogus' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid role');
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'admin' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not a partner member', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-1', name: 'Admin', email: 'admin@example.com' },
    } as never);
    vi.mocked(prisma.partnerMember.findFirst).mockResolvedValue(null as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'admin' }));
    expect(res.status).toBe(403);
  });

  it('returns 403 when role lacks manage_members permission', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-1', name: 'Viewer', email: 'viewer@example.com' },
    } as never);
    vi.mocked(prisma.partnerMember.findFirst).mockResolvedValue({
      id: 'member-1',
      partnerId: 'partner-1',
      userId: 'user-1',
      role: 'viewer',
      isActive: true,
      partner: { id: 'partner-1', name: 'Partner', status: 'active' },
    } as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'admin' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Permission denied. Requires manage_members permission.');
  });
});

// ═══════════════════════════════════════════════════════════
// ERROR: service failures
// ═══════════════════════════════════════════════════════════
describe('POST /api/partner/invite — error paths', () => {
  it('returns 400 when service reports failure', async () => {
    mockValidDb();
    vi.mocked(partnerInviteService.createInvite).mockResolvedValue({
      success: false,
      error: 'Pending invite already exists for this email',
    } as never);
    const res = await POST(createReq({ email: 'user@example.com', role: 'admin' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Pending invite already exists for this email');
  });

  it('returns 500 when service throws', async () => {
    mockValidDb();
    vi.mocked(partnerInviteService.createInvite).mockRejectedValue(
      new Error('DB connection failed')
    );
    const res = await POST(createReq({ email: 'user@example.com', role: 'admin' }));
    expect(res.status).toBe(500);
  });
});
