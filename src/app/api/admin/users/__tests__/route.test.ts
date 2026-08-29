/**
 * POST /api/admin/users — Route Tests
 * Whitebox: when `password` is provided, the route must create BOTH the User
 * and a credential Account with a BetterAuth scrypt hash (accountId=email,
 * providerId='credential'), atomically via prisma.$transaction.
 * Without `password` the old invite-style behavior is preserved.
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

const txSpy = {
  user: { create: vi.fn() },
  account: { create: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      // Route calls findUnique twice with different shapes:
      // 1) session isActive check: { where: { id }, select: { isActive } }
      // 2) email existence check: { where: { email } }
      findUnique: vi.fn((args: any) => {
        if (args?.where?.id) {
          return Promise.resolve({ isActive: true });
        }
        return Promise.resolve(null); // no existing user by default
      }),
      // GET search: findMany + count with the same `where`
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    workspaceMembership: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'm1', role: 'super_admin', workspaceId: 'ws-1', isActive: true },
      ]),
    },
    $transaction: vi.fn(async (cb: any) => cb(txSpy)),
  },
}));

vi.mock('@/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: 'admin-1' },
        session: { id: 'sess-1' },
      }),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Real scrypt implementation — proves the stored hash is BetterAuth-compatible.
import { verifyPassword } from '@better-auth/utils/password';

import { POST, GET } from '../route';

const { prisma } = vi.mocked(await import('@/lib/prisma'));

function createReq(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  txSpy.user.create.mockReset();
  txSpy.account.create.mockReset();
  txSpy.user.create.mockResolvedValue({
    id: 'user-new-1',
    email: 'new.user@example.com',
    name: 'New User',
    isActive: true,
    createdAt: new Date(),
  });
  txSpy.account.create.mockResolvedValue({ id: 'acct-1' });
  // Restore default $transaction implementation (clearAllMocks resets it)
  prisma.$transaction.mockImplementation(async (cb: any) => cb(txSpy));
  // Restore default findUnique behavior
  prisma.user.findUnique.mockImplementation((args: any) => {
    if (args?.where?.id) return Promise.resolve({ isActive: true });
    return Promise.resolve(null);
  });
});

describe('POST /api/admin/users — password storage', () => {
  it('creates User + credential Account with scrypt hash when password is provided', async () => {
    const res = await POST(
      createReq({
        email: 'New.User@Example.com', // mixed case → must be normalized
        name: 'New User',
        password: 'Admin@123456',
        workspaceId: 'ws-1',
        role: 'customer',
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.email).toBe('new.user@example.com'); // normalized lowercase

    // user.create: normalized email + verified
    const userCreateData = txSpy.user.create.mock.calls[0][0].data;
    expect(userCreateData.email).toBe('new.user@example.com');
    expect(userCreateData.emailVerified).toBe(true);
    expect(userCreateData.memberships.create.role).toBe('customer');

    // account.create: BetterAuth credential convention
    const accountCreateData = txSpy.account.create.mock.calls[0][0].data;
    expect(accountCreateData.userId).toBe('user-new-1');
    expect(accountCreateData.accountId).toBe('new.user@example.com');
    expect(accountCreateData.providerId).toBe('credential');
    const storedHash = accountCreateData.password as string;
    expect(storedHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/i);
    expect(storedHash.length).toBeGreaterThan(100);
    // Hash must verify with BetterAuth scrypt against the password
    expect(await verifyPassword(storedHash, 'Admin@123456')).toBe(true);
    expect(await verifyPassword(storedHash, 'Wrong@123456')).toBe(false);
  });

  it('does NOT create an Account when password is omitted (invite-style preserved)', async () => {
    const res = await POST(
      createReq({
        email: 'invite.only@example.com',
        name: 'Invite Only',
        workspaceId: 'ws-1',
        role: 'customer',
      })
    );
    expect(res.status).toBe(201);
    expect(txSpy.user.create).toHaveBeenCalledTimes(1);
    expect(txSpy.account.create).not.toHaveBeenCalled();
  });

  it('propagates transaction failure (atomic rollback) when account creation fails', async () => {
    // user.create succeeds inside tx, account.create throws → tx rejects → 500
    txSpy.account.create.mockRejectedValue(new Error('P2002 unique constraint'));
    const res = await POST(
      createReq({
        email: 'fail@example.com',
        name: 'Fail',
        password: 'Admin@123456',
      })
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('INTERNAL_ERROR');
  });

  it('returns 400 when email already exists', async () => {
    prisma.user.findUnique.mockImplementation((args: any) => {
      if (args?.where?.id) return Promise.resolve({ isActive: true });
      return Promise.resolve({ id: 'existing-1', email: 'existing@example.com' });
    });
    const res = await POST(
      createReq({ email: 'Existing@Example.com', name: 'Dup', password: 'Admin@123456' })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toContain('already exists');
  });

  it('rejects when requester is not an admin (403)', async () => {
    prisma.workspaceMembership.findMany.mockResolvedValue([
      { id: 'm2', role: 'customer', workspaceId: 'ws-1', isActive: true },
    ]);
    const res = await POST(
      createReq({ email: 'x@example.com', name: 'X', password: 'Admin@123456' })
    );
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/users — case-insensitive search (Finding #9)', () => {
  function createGetReq(search: string | null): Request {
    const url = search
      ? `http://localhost/api/admin/users?search=${encodeURIComponent(search)}`
      : 'http://localhost/api/admin/users';
    return new Request(url);
  }

  beforeEach(() => {
    // GET requires super_admin membership (provided by default mock) + active user
    prisma.user.findUnique.mockImplementation((args: any) => {
      if (args?.where?.id) return Promise.resolve({ isActive: true });
      return Promise.resolve(null);
    });
    prisma.workspaceMembership.findMany.mockResolvedValue([
      { id: 'm1', role: 'super_admin', workspaceId: 'ws-1', isActive: true },
    ]);
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        email: 'Admin@Example.com',
        name: 'Nguyễn Văn An',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        lastActiveAt: null,
        memberships: [],
      },
    ]);
    prisma.user.count.mockResolvedValue(1);
  });

  it('lowercases the search term before passing to contains (name + email)', async () => {
    const res = await GET(createGetReq('Nguyễn'));
    expect(res.status).toBe(200);
    // Both findMany and count receive the same normalized where
    const findManyArgs = prisma.user.findMany.mock.calls[0][0];
    expect(findManyArgs.where.OR).toEqual([
      { name: { contains: 'nguyễn' } },
      { email: { contains: 'nguyễn' } },
    ]);
    const countArgs = prisma.user.count.mock.calls[0][0];
    expect(countArgs.where.OR).toEqual(findManyArgs.where.OR);
  });

  it('handles Vietnamese uppercase diacritics (NGUYỄN -> nguyễn)', async () => {
    await GET(createGetReq('NGUYỄN'));
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR[0].name.contains).toBe('nguyễn');
    expect(where.OR[1].email.contains).toBe('nguyễn');
  });

  it('does NOT use mode: insensitive (crashes on SQLite runtime)', async () => {
    await GET(createGetReq('ADMIN'));
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(2);
    // OR[0] is the name clause, OR[1] is the email clause
    expect(where.OR[0].name.contains).toBe('admin');
    expect(where.OR[0].name.mode).toBeUndefined();
    expect(where.OR[1].email.contains).toBe('admin');
    expect(where.OR[1].email.mode).toBeUndefined();
  });

  it('omits the OR filter entirely when no search param is present', async () => {
    await GET(createGetReq(null));
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toBeUndefined();
  });
});
