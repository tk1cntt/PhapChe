/**
 * request-filter.ts tests — getWorkspaceRequestWhere / buildRequestWhere
 *
 * Filter LegalRequest theo role của user trong workspace cụ thể.
 * - Admin (super_admin, coordinator_admin, audit_admin): thấy tất cả
 * - Specialist: chỉ assignedSpecialistId = userId
 * - Reviewer: chỉ assignedReviewerId = userId
 * - Customer: chỉ createdById = userId
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma — dùng vi.hoisted để tránh hoisting conflict
const { mockFindFirst } = vi.hoisted(() => ({ mockFindFirst: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaceMembership: {
      findFirst: mockFindFirst,
    },
  },
}));

import { buildRequestWhere, getWorkspaceRequestWhere } from '@/lib/security/request-filter';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// Whitebox tests — function signature & role mapping
// ============================================================

describe('request-filter — whitebox (signature & role mapping)', () => {
  it('getWorkspaceRequestWhere exports exists với 3 params', () => {
    expect(typeof getWorkspaceRequestWhere).toBe('function');
    // (activeWorkspaceId: string, userId: string, extra?: Record<string, unknown>)
    expect(getWorkspaceRequestWhere.length).toBe(3);
  });

  it('buildRequestWhere exports exists với 3 params', () => {
    expect(typeof buildRequestWhere).toBe('function');
    // (baseWhere, userId, activeWorkspaceId)
    expect(buildRequestWhere.length).toBe(3);
  });

  it('customer → createdById filter', async () => {
    mockFindFirst.mockResolvedValue({ role: 'customer' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-cust');

    expect(result.workspaceId).toBe('ws-1');
    expect(result.createdById).toBe('user-cust');
    expect(result).not.toHaveProperty('assignedSpecialistId');
    expect(result).not.toHaveProperty('assignedReviewerId');
  });

  it('specialist → assignedSpecialistId filter', async () => {
    mockFindFirst.mockResolvedValue({ role: 'specialist' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-spec');

    expect(result.workspaceId).toBe('ws-1');
    expect(result.assignedSpecialistId).toBe('user-spec');
    expect(result).not.toHaveProperty('createdById');
    expect(result).not.toHaveProperty('assignedReviewerId');
  });

  it('reviewer → assignedReviewerId filter', async () => {
    mockFindFirst.mockResolvedValue({ role: 'reviewer' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-rev');

    expect(result.workspaceId).toBe('ws-1');
    expect(result.assignedReviewerId).toBe('user-rev');
    expect(result).not.toHaveProperty('createdById');
    expect(result).not.toHaveProperty('assignedSpecialistId');
  });

  it('super_admin → no filter (chỉ workspaceId)', async () => {
    mockFindFirst.mockResolvedValue({ role: 'super_admin' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-admin');

    expect(result.workspaceId).toBe('ws-1');
    expect(result).not.toHaveProperty('createdById');
    expect(result).not.toHaveProperty('assignedSpecialistId');
    expect(result).not.toHaveProperty('assignedReviewerId');
    // Chỉ có workspaceId — không filter thêm
    expect(Object.keys(result)).toEqual(['workspaceId']);
  });

  it('coordinator_admin → no filter (chỉ workspaceId)', async () => {
    mockFindFirst.mockResolvedValue({ role: 'coordinator_admin' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-coord');

    expect(Object.keys(result)).toEqual(['workspaceId']);
  });

  it('audit_admin → no filter (chỉ workspaceId)', async () => {
    mockFindFirst.mockResolvedValue({ role: 'audit_admin' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-audit');

    expect(Object.keys(result)).toEqual(['workspaceId']);
  });

  it('no membership → fallback createdById', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await getWorkspaceRequestWhere('ws-1', 'user-nomember');

    expect(result.createdById).toBe('user-nomember');
  });

  it('extra filters được merge vào where clause', async () => {
    mockFindFirst.mockResolvedValue({ role: 'super_admin' });

    const extra = { status: { in: ['triage', 'assigned'] }, priority: 'urgent' };
    const result = await getWorkspaceRequestWhere('ws-1', 'user-admin', extra);

    expect(result.workspaceId).toBe('ws-1');
    expect(result.status).toEqual({ in: ['triage', 'assigned'] });
    expect(result.priority).toBe('urgent');
  });
});

// ============================================================
// Blackbox tests — integration scenarios
// ============================================================

describe('request-filter — blackbox (integration scenarios)', () => {
  it('customer chỉ thấy request của chính mình trong workspace', async () => {
    mockFindFirst.mockResolvedValue({ role: 'customer' });

    const result = await getWorkspaceRequestWhere('ws-abc', 'customer-1');

    expect(result.workspaceId).toBe('ws-abc');
    expect(result.createdById).toBe('customer-1');
  });

  it('specialist chỉ thấy request được assign cho mình', async () => {
    mockFindFirst.mockResolvedValue({ role: 'specialist' });

    const result = await getWorkspaceRequestWhere('ws-abc', 'specialist-1');

    expect(result.workspaceId).toBe('ws-abc');
    expect(result.assignedSpecialistId).toBe('specialist-1');
  });

  it('reviewer chỉ thấy request được assign review cho mình', async () => {
    mockFindFirst.mockResolvedValue({ role: 'reviewer' });

    const result = await getWorkspaceRequestWhere('ws-abc', 'reviewer-1');

    expect(result.workspaceId).toBe('ws-abc');
    expect(result.assignedReviewerId).toBe('reviewer-1');
  });

  it('super_admin thấy tất cả request trong workspace', async () => {
    mockFindFirst.mockResolvedValue({ role: 'super_admin' });

    const result = await getWorkspaceRequestWhere('ws-abc', 'admin-1');

    // Chỉ filter theo workspaceId, không filter user-specific
    expect(result.workspaceId).toBe('ws-abc');
    expect(Object.keys(result)).toEqual(['workspaceId']);
  });

  it('buildRequestWhere — giữ nguyên baseWhere cho admin', async () => {
    mockFindFirst.mockResolvedValue({ role: 'super_admin' });

    const base = { workspaceId: 'ws-1', deletedAt: null };
    const result = await buildRequestWhere(base, 'admin-1', 'ws-1');

    expect(result.workspaceId).toBe('ws-1');
    expect(result.deletedAt).toBe(null);
    expect(result).not.toHaveProperty('createdById');
  });

  it('buildRequestWhere — merge role filter vào baseWhere cho customer', async () => {
    mockFindFirst.mockResolvedValue({ role: 'customer' });

    const base = { workspaceId: 'ws-1', deletedAt: null };
    const result = await buildRequestWhere(base, 'cust-1', 'ws-1');

    expect(result.workspaceId).toBe('ws-1');
    expect(result.deletedAt).toBe(null);
    expect(result.createdById).toBe('cust-1');
  });
});

// ============================================================
// Abnormal tests — edge cases
// ============================================================

describe('request-filter — abnormal (edge cases)', () => {
  it('workspaceId rỗng → vẫn gán workspaceId trong where', async () => {
    mockFindFirst.mockResolvedValue({ role: 'customer' });

    const result = await getWorkspaceRequestWhere('', 'user-1');

    expect(result.workspaceId).toBe('');
    expect(result.createdById).toBe('user-1');
  });

  it('userId trùng với workspaceId (edge case naming) → filter đúng theo role', async () => {
    mockFindFirst.mockResolvedValue({ role: 'specialist' });

    const result = await getWorkspaceRequestWhere('same-id', 'same-id');

    expect(result.workspaceId).toBe('same-id');
    expect(result.assignedSpecialistId).toBe('same-id');
  });

  it('extra = undefined → không merge thêm key nào', async () => {
    mockFindFirst.mockResolvedValue({ role: 'super_admin' });

    const result = await getWorkspaceRequestWhere('ws-1', 'admin-1', undefined);

    expect(Object.keys(result)).toEqual(['workspaceId']);
  });

  it('extra = {} → không merge thêm key nào', async () => {
    mockFindFirst.mockResolvedValue({ role: 'super_admin' });

    const result = await getWorkspaceRequestWhere('ws-1', 'admin-1', {});

    expect(Object.keys(result)).toEqual(['workspaceId']);
  });
});

// ============================================================
// Error tests
// ============================================================

describe('request-filter — error (failure modes)', () => {
  it('prisma.findFirst throws → error propagated (không crash silently)', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB connection lost'));

    await expect(getWorkspaceRequestWhere('ws-1', 'user-1')).rejects.toThrow('DB connection lost');
  });

  it('prisma trả về role null → fallback createdById (không throw)', async () => {
    // Role field null trong DB (edge case data corruption)
    mockFindFirst.mockResolvedValue({ role: null });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-1');

    expect(result.createdById).toBe('user-1');
  });

  it('prisma trả về role rỗng → fallback createdById', async () => {
    mockFindFirst.mockResolvedValue({ role: '' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-1');

    expect(result.createdById).toBe('user-1');
  });

  it('role không xác định (unknown role) → fallback createdById', async () => {
    mockFindFirst.mockResolvedValue({ role: 'some_future_role_xyz' });

    const result = await getWorkspaceRequestWhere('ws-1', 'user-1');

    expect(result.createdById).toBe('user-1');
  });

  it('buildRequestWhere với userId khác activeWorkspaceId → query membership với activeWorkspaceId', async () => {
    // verify rằng membership được lookup theo activeWorkspaceId, không phải userId
    mockFindFirst.mockResolvedValue({ role: 'reviewer' });

    await buildRequestWhere({ workspaceId: 'ws-target' }, 'user-x', 'ws-target');

    const findFirstCall = mockFindFirst.mock.calls[0][0];
    expect(findFirstCall.where.userId).toBe('user-x');
    expect(findFirstCall.where.workspaceId).toBe('ws-target');
    expect(findFirstCall.where.isActive).toBe(true);
  });
});

// ============================================================
// E2E: simulate page usage
// ============================================================

describe('request-filter — e2e (page simulation)', () => {
  it('e2e: customer page flow — total + processing + completed + requests + overdue', async () => {
    // Customer login → workspace ws-cust
    mockFindFirst.mockResolvedValue({ role: 'customer' });

    const base = await getWorkspaceRequestWhere('ws-cust', 'cust-1');
    const processing = await getWorkspaceRequestWhere('ws-cust', 'cust-1', {
      status: { in: ['in_progress', 'pending_review', 'triage', 'assigned'] },
    });
    const completed = await getWorkspaceRequestWhere('ws-cust', 'cust-1', {
      status: { in: ['approved', 'delivered', 'closed'] },
    });

    // Tất cả query đều có createdById filter
    expect(base.createdById).toBe('cust-1');
    expect(processing.createdById).toBe('cust-1');
    expect(processing.status).toEqual({ in: ['in_progress', 'pending_review', 'triage', 'assigned'] });
    expect(completed.createdById).toBe('cust-1');
    expect(completed.status).toEqual({ in: ['approved', 'delivered', 'closed'] });
  });

  it('e2e: admin dashboard flow — thấy tất cả trong workspace', async () => {
    mockFindFirst.mockResolvedValue({ role: 'coordinator_admin' });

    const requests = await getWorkspaceRequestWhere('ws-admin', 'admin-1');

    // Chỉ filter bằng workspaceId
    expect(Object.keys(requests)).toEqual(['workspaceId']);
    expect(requests.workspaceId).toBe('ws-admin');
  });

  it('e2e: specialist chỉ thấy request được assign → không leak request của specialist khác', async () => {
    mockFindFirst.mockResolvedValue({ role: 'specialist' });

    const result = await getWorkspaceRequestWhere('ws-shared', 'specialist-A');

    expect(result.assignedSpecialistId).toBe('specialist-A');
    // KHÔNG filter theo createdById (specialist có thể xem request của customer khác)
    expect(result).not.toHaveProperty('createdById');
  });

  it('e2e: reviewer chỉ thấy request được assign review → không leak review của reviewer khác', async () => {
    mockFindFirst.mockResolvedValue({ role: 'reviewer' });

    const result = await getWorkspaceRequestWhere('ws-shared', 'reviewer-B');

    expect(result.assignedReviewerId).toBe('reviewer-B');
    expect(result).not.toHaveProperty('createdById');
  });
});
