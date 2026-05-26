import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AppSession } from '@/lib/security/session';
import { createAdminUser, deactivateAdminUser, updateAdminUserRole } from './users';

const actor: AppSession = { userId: 'admin-1', activeWorkspaceId: 'workspace-1', roles: ['coordinator_admin'] };
const customer: AppSession = { userId: 'user-1', activeWorkspaceId: 'workspace-1', roles: ['customer'] };

type Tx = ReturnType<typeof createTx>;
type TestDb = { $transaction: ReturnType<typeof mock.fn>; tx: Tx };

function createTx() {
  return {
    user: {
      create: mock.fn(async () => ({ id: 'user-2', email: 'new@example.com', name: 'Người dùng', isActive: true })),
      update: mock.fn(async () => ({ id: 'user-2', role: 'reviewer', isActive: true })),
    },
    workspaceMembership: { upsert: mock.fn(async () => ({ id: 'membership-1' })) },
    auditEvent: { create: mock.fn(async () => ({ id: 'audit-1' })) },
  };
}

function createDb(tx = createTx()): TestDb {
  return {
    $transaction: mock.fn((callback: (tx: Tx) => unknown) => callback(tx)),
    tx,
  };
}

describe('admin user management', () => {
  it('cấm actor không phải admin mutate users', async () => {
    const db = createDb();

    await assert.rejects(
      createAdminUser({ actor: customer, input: { email: 'new@example.com', name: 'Người dùng', role: 'customer', workspaceId: 'workspace-1', correlationId: 'corr-1' }, db }),
      /FORBIDDEN/,
    );
  });

  it('chỉ cho phép role thuộc allowlist', async () => {
    const db = createDb();

    await assert.rejects(
      createAdminUser({ actor, input: { email: 'new@example.com', name: 'Người dùng', role: 'owner' as never, workspaceId: 'workspace-1', correlationId: 'corr-1' }, db }),
      /INVALID_ROLE/,
    );
  });

  it('ghi audit event trong cùng transaction khi tạo user', async () => {
    const tx = createTx();
    const db = createDb(tx);

    await createAdminUser({ actor, input: { email: 'new@example.com', name: 'Người dùng', role: 'specialist', workspaceId: 'workspace-1', correlationId: 'corr-1' }, db });

    assert.equal(db.$transaction.mock.callCount(), 1);
    assert.equal(tx.user.create.mock.callCount(), 1);
    assert.equal(tx.auditEvent.create.mock.calls[0].arguments[0].data.action, 'user.created');
  });

  it('deactivate đặt isActive false thay vì xóa user', async () => {
    const tx = createTx();
    const db = createDb(tx);

    await deactivateAdminUser({ actor, input: { userId: 'user-2', workspaceId: 'workspace-1', correlationId: 'corr-1' }, db });

    assert.deepEqual(tx.user.update.mock.calls[0].arguments[0].data, { isActive: false });
    assert.equal('delete' in tx.user, false);
  });

  it('cập nhật role hợp lệ và ghi audit', async () => {
    const tx = createTx();
    const db = createDb(tx);

    await updateAdminUserRole({ actor, input: { userId: 'user-2', role: 'reviewer', workspaceId: 'workspace-1', correlationId: 'corr-1' }, db });

    assert.equal(tx.workspaceMembership.upsert.mock.callCount(), 1);
    assert.equal(tx.auditEvent.create.mock.calls[0].arguments[0].data.action, 'user.role_updated');
  });
});
