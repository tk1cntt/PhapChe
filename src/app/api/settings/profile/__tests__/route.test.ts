/**
 * PUT /api/settings/profile — Route Tests
 * Whitebox, blackbox, abnormal, error testcases (CLAUDE.md).
 * Focus: email validation now uses shared isValidEmail().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

import { PUT } from '../route';
import { NextRequest } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

function createReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/settings/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: 'Test User',
  email: 'user@example.com',
  phone: null,
  title: null,
  timezone: 'Asia/Ho_Chi_Minh',
};

function mockValidDb() {
  vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
  vi.mocked(prisma.$transaction).mockImplementation(
    (async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        user: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({
            id: 'user-1',
            name: 'Test User',
            email: 'user@example.com',
            phone: null,
            title: null,
            timezone: 'Asia/Ho_Chi_Minh',
            avatarUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      })) as never
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: email validation contract
// ═══════════════════════════════════════════════════════════
describe('PUT /api/settings/profile — email validation', () => {
  it('returns 400 for invalid email (unicode)', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 'tést@exämple.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toBe('Invalid email format');
  });

  it('returns 400 for consecutive dots in domain', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 'user@example..com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for TLD of 1 char', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 'user@example.c' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for label starting with hyphen', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 'user@-example.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for trailing dot', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 'user@example.com.' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a@b.c', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 'a@b.c' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for whitespace-padded email', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: ' user@example.com' }));
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════
// WHITEBOX: valid email passes through to DB update
// ═══════════════════════════════════════════════════════════
describe('PUT /api/settings/profile — valid email success path', () => {
  it('accepts plain valid email', async () => {
    mockValidDb();
    const res = await PUT(createReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('accepts plus-tag and multi-label emails', async () => {
    mockValidDb();
    const res = await PUT(
      createReq({ ...VALID_BODY, email: 'user+tag@example.co.uk' })
    );
    expect(res.status).toBe(200);
  });

  it('accepts dotted local part and subdomain', async () => {
    mockValidDb();
    const res = await PUT(
      createReq({ ...VALID_BODY, email: 'first.last@sub.domain.org' })
    );
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: missing/invalid fields
// ═══════════════════════════════════════════════════════════
describe('PUT /api/settings/profile — abnormal inputs', () => {
  it('returns 400 when name is missing', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ email: 'user@example.com' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('Name is required');
  });

  it('returns 400 when email is missing', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ name: 'Test User' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe('Email is required');
  });

  it('returns 400 when email is not a string', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    const res = await PUT(createReq({ ...VALID_BODY, email: 123 }));
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════
// ERROR: DB failures and structured errors
// ═══════════════════════════════════════════════════════════
describe('PUT /api/settings/profile — error paths', () => {
  it('returns 400 when email already in use', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: 'other-user' }),
            update: vi.fn(),
          },
        })) as never
    );
    const res = await PUT(createReq(VALID_BODY));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 500 when DB throws', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Error('DB connection failed')
    );
    const res = await PUT(createReq(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('UPDATE_FAILED');
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAppSession).mockRejectedValue(
      Object.assign(new Error('UNAUTHENTICATED'), {
        status: 401,
        error: 'UNAUTHENTICATED',
      }) as never
    );
    const res = await PUT(createReq(VALID_BODY));
    expect(res.status).toBe(401);
  });
});
