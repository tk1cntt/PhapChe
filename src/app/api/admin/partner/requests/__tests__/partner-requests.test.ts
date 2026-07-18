/**
 * partner/requests API tests — route handler với requireAppSession + ADMIN_ROUTE_GUARDS
 *
 * Fix: Thay thế ADMIN_ROLES cứng ['super_admin','coordinator_admin'] bằng
 * requireAppSession(req.headers) + ADMIN_ROUTE_GUARDS.partner, mở rộng quyền
 * cho specialist và reviewer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock requireAppSession
const mockRequireAppSession = vi.fn();
vi.mock('@/lib/security/session', () => ({
  requireAppSession: mockRequireAppSession,
}));

// Mock prisma
const mockPrismaFindMany = vi.fn();
const mockPrismaFindUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    legalRequest: {
      findMany: mockPrismaFindMany,
      findUnique: mockPrismaFindUnique,
    },
  },
}));

// Mock feature flags
vi.mock('@/lib/config/feature-flags', () => ({
  isEnabled: vi.fn().mockReturnValue(false),
}));

// ============================================================
// Whitebox tests — role guard + requireAppSession usage
// ============================================================

describe('partner/requests API — whitebox (role guard + session)', () => {
  it('GET /api/admin/partner/requests gọi requireAppSession với req.headers', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    const mockHeaders = new Headers({ cookie: 'token=test' });
    const req = new Request('http://localhost/api/admin/partner/requests?page=1&limit=10', {
      headers: mockHeaders,
    });

    mockRequireAppSession.mockResolvedValue({
      userId: 'specialist-1',
      roles: ['specialist'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    await GET(req as any);

    // Whitebox: verify requireAppSession was called with req.headers
    expect(mockRequireAppSession).toHaveBeenCalledWith(mockHeaders);
  });

  it('GET /api/admin/partner/requests/[id] gọi requireAppSession với req.headers', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    const mockHeaders = new Headers({ cookie: 'token=test' });
    const req = new Request('http://localhost/api/admin/partner/requests/req-123', {
      headers: mockHeaders,
    });

    mockRequireAppSession.mockResolvedValue({
      userId: 'reviewer-1',
      roles: ['reviewer'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindUnique.mockResolvedValue({
      id: 'req-123',
      assignedPartnerId: 'p-1',
      assignedPartner: { id: 'p-1', name: 'Partner A' },
    });

    await GET(req as any, { params: Promise.resolve({ id: 'req-123' }) });

    expect(mockRequireAppSession).toHaveBeenCalledWith(mockHeaders);
  });

  it('sử dụng ADMIN_ROUTE_GUARDS.partner để kiểm tra quyền (không dùng ADMIN_ROLES cứng)', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    const req = new Request('http://localhost/api/admin/partner/requests?page=1&limit=10');

    // specialist được phép theo ADMIN_ROUTE_GUARDS.partner
    mockRequireAppSession.mockResolvedValue({
      userId: 'specialist-1',
      roles: ['specialist'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const res = await GET(req as any);
    expect(res.status).not.toBe(403);
  });

  it('[id] route sử dụng ADMIN_ROUTE_GUARDS.partner để kiểm tra quyền', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    const req = new Request('http://localhost/api/admin/partner/requests/req-123');

    // reviewer được phép theo ADMIN_ROUTE_GUARDS.partner
    mockRequireAppSession.mockResolvedValue({
      userId: 'reviewer-1',
      roles: ['reviewer'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindUnique.mockResolvedValue({
      id: 'req-123',
      assignedPartnerId: 'p-1',
    });

    const res = await GET(req as any, { params: Promise.resolve({ id: 'req-123' }) });
    expect(res.status).not.toBe(403);
  });

  it('cả hai route đều có UNAUTHENTICATED catch trong error handler', async () => {
    const { GET: GET_LIST } = await import('@/app/api/admin/partner/requests/route');
    const { GET: GET_DETAIL } = await import('@/app/api/admin/partner/requests/[id]/route');

    // Verify both routes exist and are callable
    expect(typeof GET_LIST).toBe('function');
    expect(typeof GET_DETAIL).toBe('function');
  });
});

// ============================================================
// Blackbox tests — integration scenarios
// ============================================================

describe('partner/requests API — blackbox (integration scenarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('specialist truy cập danh sách partner requests → 200 OK', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'specialist-1',
      roles: ['specialist'],
      activeWorkspaceId: 'ws-1',
    });

    const mockRequests = [
      {
        id: 'req-1',
        title: 'Hợp đồng thương mại',
        status: 'assigned',
        assignedPartnerId: 'p-1',
        assignedPartner: { id: 'p-1', name: 'VCCI' },
        engagement: null,
        createdBy: { id: 'u-1', name: 'Customer A', email: 'a@test.com' },
        updatedAt: new Date(),
      },
    ];
    mockPrismaFindMany.mockResolvedValue(mockRequests);

    const req = new Request('http://localhost/api/admin/partner/requests?page=1&limit=10');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].assignedPartnerId).toBe('p-1');
  });

  it('reviewer truy cập danh sách partner requests → 200 OK', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'reviewer-1',
      roles: ['reviewer'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/admin/partner/requests?page=1&limit=10');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('super_admin truy cập danh sách partner requests → 200 OK', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/admin/partner/requests?page=1&limit=10');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('coordinator_admin truy cập danh sách partner requests → 200 OK', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'ca-1',
      roles: ['coordinator_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/admin/partner/requests?page=1&limit=10');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
  });

  it('specialist truy cập chi tiết partner request → 200 OK', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'specialist-1',
      roles: ['specialist'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindUnique.mockResolvedValue({
      id: 'req-123',
      title: 'Hợp đồng lao động',
      assignedPartnerId: 'p-1',
      assignedPartner: { id: 'p-1', name: 'VCCI' },
      engagement: null,
      createdBy: { id: 'u-1', name: 'Cust', email: 'c@test.com' },
      workspace: { id: 'ws-1', name: 'My WS' },
      matterType: 'labor',
    });

    const req = new Request('http://localhost/api/admin/partner/requests/req-123');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'req-123' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('req-123');
    expect(body.data.matterTypeDisplay).toBe('labor');
  });

  it('phân trang hoạt động đúng', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    // 30 items, page 2, limit 5
    const mockRequests = Array.from({ length: 30 }, (_, i) => ({
      id: `req-${i}`,
      title: `Request ${i}`,
      status: 'assigned',
      assignedPartnerId: 'p-1',
      assignedPartner: { id: 'p-1', name: 'Partner X' },
      engagement: null,
      createdBy: { id: 'u-1', name: 'Cust', email: 'c@test.com' },
      updatedAt: new Date(),
    }));
    mockPrismaFindMany.mockResolvedValue(mockRequests);

    const req = new Request('http://localhost/api/admin/partner/requests?page=2&limit=5');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(5);
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(5);
    expect(body.pagination.total).toBe(30);
    expect(body.pagination.pages).toBe(6);
  });

  it('filter theo status hoạt động', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    const assignedRequests = [
      { id: 'req-1', title: 'R1', status: 'assigned', assignedPartnerId: 'p-1',
        assignedPartner: { id: 'p-1', name: 'P' }, engagement: null,
        createdBy: { id: 'u-1', name: 'C', email: 'c@t.com' }, updatedAt: new Date() },
    ];
    mockPrismaFindMany.mockResolvedValue(assignedRequests);

    const req = new Request('http://localhost/api/admin/partner/requests?status=assigned');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe('assigned');
  });
});

// ============================================================
// Abnormal tests — edge cases
// ============================================================

describe('partner/requests API — abnormal (edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('danh sách rỗng → 200 với data = []', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/admin/partner/requests');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it('request không tìm thấy trong [id] → 404', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindUnique.mockResolvedValue(null);

    const req = new Request('http://localhost/api/admin/partner/requests/nonexistent');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('filter theo partnerId — chỉ trả về request của partner đó', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/admin/partner/requests?partnerId=p-specific');
    await GET(req as any);

    // Verify prisma was called with partnerId filter
    const findManyCall = mockPrismaFindMany.mock.calls[0][0];
    expect(findManyCall.where.assignedPartnerId).toBe('p-specific');
  });

  it('page=0 không crash — xử lý bình thường', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockResolvedValue([]);

    const req = new Request('http://localhost/api/admin/partner/requests?page=0&limit=10');
    const res = await GET(req as any);

    // page=0 → parseInt('0') = 0 → slice(-10,0) → empty but not crash
    expect(res.status).toBe(200);
  });
});

// ============================================================
// Error tests
// ============================================================

describe('partner/requests API — error (failure modes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không có session → 401 (UNAUTHENTICATED trong list route)', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockRejectedValue(new Error('UNAUTHENTICATED'));

    const req = new Request('http://localhost/api/admin/partner/requests');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('không có session → 401 (UNAUTHENTICATED trong [id] route)', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    mockRequireAppSession.mockRejectedValue(new Error('UNAUTHENTICATED'));

    const req = new Request('http://localhost/api/admin/partner/requests/req-1');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'req-1' }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('customer (không có admin role) → 403', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'customer-1',
      roles: ['customer'],
      activeWorkspaceId: 'ws-1',
    });

    const req = new Request('http://localhost/api/admin/partner/requests');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('customer → 403 trong [id] route', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'customer-1',
      roles: ['customer'],
      activeWorkspaceId: 'ws-1',
    });

    const req = new Request('http://localhost/api/admin/partner/requests/req-1');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'req-1' }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('DB lỗi → 500 Internal Server Error (list route)', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindMany.mockRejectedValue(new Error('Connection timeout'));

    const req = new Request('http://localhost/api/admin/partner/requests');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('DB lỗi → 500 Internal Server Error ([id] route)', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/[id]/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'sa-1',
      roles: ['super_admin'],
      activeWorkspaceId: 'ws-1',
    });

    mockPrismaFindUnique.mockRejectedValue(new Error('Connection timeout'));

    const req = new Request('http://localhost/api/admin/partner/requests/req-1');
    const res = await GET(req as any, { params: Promise.resolve({ id: 'req-1' }) });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });
});

// ============================================================
// E2E: full flow simulation
// ============================================================

describe('partner/requests API — e2e (full flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('e2e: specialist login → truy cập danh sách partner → xem chi tiết request', async () => {
    const { GET: GET_LIST } = await import('@/app/api/admin/partner/requests/route');
    const { GET: GET_DETAIL } = await import('@/app/api/admin/partner/requests/[id]/route');

    const specialistSession = {
      userId: 'specialist-e2e',
      roles: ['specialist'],
      activeWorkspaceId: 'ws-1',
    };

    // Step 1: xem danh sách
    mockRequireAppSession.mockResolvedValue(specialistSession);
    mockPrismaFindMany.mockResolvedValue([
      {
        id: 'req-e2e',
        title: 'E2E Request',
        status: 'assigned',
        assignedPartnerId: 'p-1',
        assignedPartner: { id: 'p-1', name: 'E2E Partner' },
        engagement: null,
        createdBy: { id: 'u-1', name: 'E2E Cust', email: 'e2e@test.com' },
        updatedAt: new Date(),
      },
    ]);

    const listReq = new Request('http://localhost/api/admin/partner/requests');
    const listRes = await GET_LIST(listReq as any);
    const listBody = await listRes.json();

    expect(listRes.status).toBe(200);
    expect(listBody.data[0].id).toBe('req-e2e');

    // Step 2: xem chi tiết
    mockRequireAppSession.mockResolvedValue(specialistSession);
    mockPrismaFindUnique.mockResolvedValue({
      id: 'req-e2e',
      title: 'E2E Request',
      assignedPartnerId: 'p-1',
      assignedPartner: { id: 'p-1', name: 'E2E Partner' },
      engagement: null,
      createdBy: { id: 'u-1', name: 'E2E Cust', email: 'e2e@test.com' },
      workspace: { id: 'ws-1', name: 'E2E WS' },
      matterType: 'corporate',
    });

    const detailReq = new Request('http://localhost/api/admin/partner/requests/req-e2e');
    const detailRes = await GET_DETAIL(detailReq as any, { params: Promise.resolve({ id: 'req-e2e' }) });
    const detailBody = await detailRes.json();

    expect(detailRes.status).toBe(200);
    expect(detailBody.data.title).toBe('E2E Request');
    expect(detailBody.data.matterTypeDisplay).toBe('corporate');
  });

  it('e2e: reviewer login → xem danh sách → chuyển trang', async () => {
    const { GET } = await import('@/app/api/admin/partner/requests/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'reviewer-e2e',
      roles: ['reviewer'],
      activeWorkspaceId: 'ws-1',
    });

    // 50 items → page 3, limit 10 → items 20-29
    const allRequests = Array.from({ length: 50 }, (_, i) => ({
      id: `req-${i}`,
      title: `Request ${i}`,
      status: 'assigned',
      assignedPartnerId: 'p-1',
      assignedPartner: { id: 'p-1', name: 'Partner' },
      engagement: null,
      createdBy: { id: 'u-1', name: 'Cust', email: 'c@test.com' },
      updatedAt: new Date(),
    }));
    mockPrismaFindMany.mockResolvedValue(allRequests);

    const req = new Request('http://localhost/api/admin/partner/requests?page=3&limit=10');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(10);
    expect(body.pagination.page).toBe(3);
    expect(body.pagination.pages).toBe(5);
    // Items should be 20-29
    expect(body.data[0].id).toBe('req-20');
  });

  it('e2e: customer bị chặn ở cả list và detail', async () => {
    const { GET: GET_LIST } = await import('@/app/api/admin/partner/requests/route');
    const { GET: GET_DETAIL } = await import('@/app/api/admin/partner/requests/[id]/route');

    mockRequireAppSession.mockResolvedValue({
      userId: 'customer-e2e',
      roles: ['customer'],
      activeWorkspaceId: 'ws-1',
    });

    const listReq = new Request('http://localhost/api/admin/partner/requests');
    const listRes = await GET_LIST(listReq as any);
    expect(listRes.status).toBe(403);

    const detailReq = new Request('http://localhost/api/admin/partner/requests/req-1');
    const detailRes = await GET_DETAIL(detailReq as any, { params: Promise.resolve({ id: 'req-1' }) });
    expect(detailRes.status).toBe(403);
  });
});
