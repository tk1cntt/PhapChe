import { describe, it, expect } from 'vitest';
import { queryKeys } from './query-keys';

describe('Query Key Factories', () => {
  const domains = ['users', 'requests', 'workspaces', 'auditEvents', 'vaultFiles', 'messages'] as const;

  domains.forEach((domain) => {
    describe(`${domain} domain`, () => {
      const keys = (queryKeys as any)[domain];

      it('.all should return [entity]', () => {
        expect(keys.all).toEqual([domain]);
      });

      it('.lists() should return [entity, "list"]', () => {
        expect(keys.lists()).toEqual([domain, 'list']);
      });

      it('.list() without filters should return [entity, "list"]', () => {
        expect(keys.list()).toEqual([domain, 'list']);
      });

      it('.list(filters) should include filters object', () => {
        const filters = { page: 1, status: 'active' };
        expect(keys.list(filters)).toEqual([domain, 'list', filters]);
      });

      it('.details() should return [entity, "detail"]', () => {
        expect(keys.details()).toEqual([domain, 'detail']);
      });

      it('.detail(id) should return [entity, "detail", id]', () => {
        expect(keys.detail('123')).toEqual([domain, 'detail', '123']);
      });

      it('.detail should handle different ids correctly', () => {
        expect(keys.detail('abc')).toEqual([domain, 'detail', 'abc']);
        expect(keys.detail('xyz')).toEqual([domain, 'detail', 'xyz']);
        expect(keys.detail('abc')).not.toEqual(keys.detail('xyz'));
      });
    });
  });

  it('should have all 6 domains exported', () => {
    expect(queryKeys.users).toBeDefined();
    expect(queryKeys.requests).toBeDefined();
    expect(queryKeys.workspaces).toBeDefined();
    expect(queryKeys.auditEvents).toBeDefined();
    expect(queryKeys.vaultFiles).toBeDefined();
    expect(queryKeys.messages).toBeDefined();
  });

  it('filters objects are passed by reference (not cloned)', () => {
    const filters = { page: 1 };
    const key = queryKeys.users.list(filters);
    expect(key[2]).toBe(filters);
  });

  it('empty filters object works correctly', () => {
    const key = queryKeys.users.list({});
    expect(key).toEqual(['users', 'list', {}]);
  });

  it('multiple filter values work correctly', () => {
    const filters = {
      page: 1,
      pageSize: 20,
      status: 'pending',
      type: 'contract',
      search: 'test',
    };
    const key = queryKeys.requests.list(filters);
    expect(key).toEqual(['requests', 'list', filters]);
  });
});
