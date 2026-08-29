/**
 * PUT /api/settings/password — Route Tests
 * Whitebox/blackbox: password change must use BetterAuth scrypt
 * (hashPassword/verifyPassword), NOT bcryptjs — otherwise the user
 * cannot log in with the new password.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// next/server is not resolvable under vitest's vite pipeline (exports map);
// mock the minimal surface the route uses.
vi.mock('next/server', () => {
  class NextResponse extends Response {
    static json(data: unknown, init?: { status?: number }) {
      return new NextResponse(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    }
  }
  class NextRequest extends Request {}
  return { NextResponse, NextRequest };
});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

// Real scrypt implementation from @better-auth/utils — no mock, so the test
// proves the route produces/verifies hashes in the same format BetterAuth uses.
import { hashPassword, verifyPassword } from '@better-auth/utils/password';

import { PUT } from '../route';

const { requireAppSession } = vi.mocked(
  await import('@/lib/security/session')
);
const { prisma } = vi.mocked(await import('@/lib/prisma'));

function createReq(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/settings/password', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

const SCRYPT_HASH = 'deadbeef'.repeat(20) + ':' + 'cafebabe'.repeat(20); // 161 chars: saltHex:keyHex

function mockAccount(password: string) {
  prisma.account.findFirst.mockResolvedValue({
    id: 'acct-1',
    userId: 'user-1',
    password,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAppSession.mockResolvedValue({ userId: 'user-1' });
  prisma.account.update.mockResolvedValue({ id: 'acct-1' });
  prisma.session.deleteMany.mockResolvedValue({ count: 1 });
});

describe('PUT /api/settings/password — scrypt compatibility', () => {
  it('returns 400 when current password does not match (scrypt verify)', async () => {
    const realHash = await hashPassword('OldPass@123');
    mockAccount(realHash);
    const res = await PUT(
      createReq({ currentPassword: 'Wrong@123', newPassword: 'NewPass@456' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('incorrect');
  });

  it('returns 400 when new password equals current password', async () => {
    const realHash = await hashPassword('SamePass@123');
    mockAccount(realHash);
    const res = await PUT(
      createReq({ currentPassword: 'SamePass@123', newPassword: 'SamePass@123' })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('different');
  });

  it('stores the new password as a BetterAuth scrypt hash (161 chars, verifiable)', async () => {
    const realHash = await hashPassword('OldPass@123');
    mockAccount(realHash);
    const res = await PUT(
      createReq({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' })
    );
    expect(res.status).toBe(200);

    const updateCall = prisma.account.update.mock.calls[0];
    expect(updateCall[0].where.id).toBe('acct-1');
    const storedHash = updateCall[0].data.password as string;
    // scrypt format saltHex:keyHex = 64+1+128 = 193 chars actually; check prefix format
    expect(storedHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/i);
    expect(storedHash.length).toBeGreaterThan(100);
    // The stored hash must verify against the new password using BetterAuth scrypt
    expect(await verifyPassword(storedHash, 'NewPass@456')).toBe(true);
    // And must NOT verify against the old password
    expect(await verifyPassword(storedHash, 'OldPass@123')).toBe(false);
  });

  it('invalidates all sessions after a successful password change', async () => {
    const realHash = await hashPassword('OldPass@123');
    mockAccount(realHash);
    const res = await PUT(
      createReq({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' })
    );
    expect(res.status).toBe(200);
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('rejects a bcrypt-formatted hash (proves no bcryptjs fallback)', async () => {
    // $2b$10$... — old bcryptjs format that BetterAuth cannot verify
    const bcryptHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    mockAccount(bcryptHash);
    const res = await PUT(
      createReq({ currentPassword: 'anything', newPassword: 'NewPass@456' })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain('incorrect');
  });

  it('returns 400 for weak new password (policy unchanged)', async () => {
    mockAccount('x'.repeat(40)); // never reached — validation first
    const res = await PUT(
      createReq({ currentPassword: 'OldPass@123', newPassword: 'weak' })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when no password account exists', async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    const res = await PUT(
      createReq({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('NOT_FOUND');
  });
});
