import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { recordAuditEvent } from './audit';

const calls: unknown[] = [];
const db = {
  auditEvent: {
    create(input: unknown) {
      calls.push(input);
      return Promise.resolve({ id: 'audit_1' });
    },
  },
};

describe('recordAuditEvent', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('creates append-only audit event with metadata summary', async () => {
    await recordAuditEvent(
      {
        actorId: 'user_1',
        workspaceId: 'workspace_1',
        action: 'request.created',
        targetType: 'REQUEST',
        targetId: 'request_1',
        requestId: 'request_1',
        correlationId: 'corr_1',
        metadataSummary: 'request shell created',
      },
      db,
    );

    assert.deepEqual(calls, [
      {
        data: {
          actorId: 'user_1',
          workspaceId: 'workspace_1',
          action: 'request.created',
          targetType: 'request',
          targetId: 'request_1',
          requestId: 'request_1',
          correlationId: 'corr_1',
          metadataSummary: 'request shell created',
        },
      },
    ]);
  });

  it('rejects long metadata summary', async () => {
    await assert.rejects(
      recordAuditEvent(
        {
          workspaceId: 'workspace_1',
          action: 'request.created',
          targetType: 'REQUEST',
          targetId: 'request_1',
          correlationId: 'corr_1',
          metadataSummary: 'x'.repeat(501),
        },
        db,
      ),
      /metadataSummary must be 500 characters or fewer/,
    );

    assert.equal(calls.length, 0);
  });

  it('does not accept raw legal content metadata objects', async () => {
    await assert.rejects(
      recordAuditEvent(
        {
          workspaceId: 'workspace_1',
          action: 'request.created',
          targetType: 'REQUEST',
          targetId: 'request_1',
          correlationId: 'corr_1',
          metadataSummary: { rawLegalContent: 'sensitive' } as never,
        },
        db,
      ),
      /metadataSummary must be a string/,
    );

    assert.equal(calls.length, 0);
  });
});
