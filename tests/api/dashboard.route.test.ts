import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    request: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    document: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock session
vi.mock('@/lib/auth/session', () => ({
  requireAppSession: vi.fn(),
}));

import { GET } from '@/app/api/dashboard/route';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/auth/session';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAppSession = requireAppSession as jest.MockedFunction<typeof requireAppSession>;

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================
  // WHITEBOX TESTS (Unit Tests)
  // ============================
  describe('Whitebox Tests - Unit', () => {
    it('returns workspace info from database', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'Công Ty ABC',
        slug: 'cong-ty-abc',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.request.count.mockResolvedValue(10);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(5);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.workspace).toEqual({
        id: 'ws-1',
        name: 'Công Ty ABC',
        slug: 'cong-ty-abc',
      });
    });

    it('calculates correct stats from database', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(25);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(42);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.stats).toEqual({
        totalRequests: 25,
        inProgress: 0,
        completed: 0,
        vaultDocs: 42,
      });
    });

    it('returns recent cases with correct structure', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockCases = [
        {
          id: 'case-1',
          code: 'CASE-2024-001',
          title: 'Hợp đồng thuê',
          matterType: 'CONTRACT',
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
          assignee: {
            name: 'Nguyễn Văn A',
            role: 'SPECIALIST',
          },
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue(mockCases);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.recentCases).toHaveLength(1);
      expect(data.recentCases[0]).toMatchObject({
        id: 'case-1',
        code: 'CASE-2024-001',
        title: 'Hợp đồng thuê',
        matterType: 'CONTRACT',
        status: 'IN_PROGRESS',
        statusVariant: 'orange',
        statusText: 'Đang xử lý',
        assignee: 'Nguyễn Văn A',
        assigneeRole: 'Chuyên viên',
      });
    });

    it('returns deadlines with correct progress calculation', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const mockCases = [
        {
          id: 'case-1',
          code: 'CASE-2024-001',
          title: 'Hồ sơ gấp',
          matterType: 'URGENT',
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
          assignee: { name: 'User', role: 'SPECIALIST' },
          slaDeadline: tomorrow,
        },
        {
          id: 'case-2',
          code: 'CASE-2024-002',
          title: 'Hồ sơ thường',
          matterType: 'NORMAL',
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
          assignee: { name: 'User', role: 'SPECIALIST' },
          slaDeadline: nextWeek,
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue(mockCases);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.deadlines).toHaveLength(2);
      // First case should have danger status (approaching deadline)
      expect(data.deadlines[0].status).toBe('danger');
      // Second case should have ok status (plenty of time)
      expect(data.deadlines[1].status).toBe('ok');
    });

    it('returns documents with file info', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockDocs = [
        {
          id: 'doc-1',
          filename: 'hop-dong.pdf',
          size: 1024000,
          mimeType: 'application/pdf',
          status: 'ACTIVE',
          updatedAt: new Date(),
          uploadedByUser: { name: 'User A' },
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue(mockDocs);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.recentDocs).toHaveLength(1);
      expect(data.recentDocs[0]).toMatchObject({
        id: 'doc-1',
        filename: 'hop-dong.pdf',
        size: 1024000,
        mimeType: 'application/pdf',
        status: 'ACTIVE',
        uploadedBy: 'User A',
      });
      expect(data.recentDocs[0].relativeTime).toBeDefined();
    });

    it('returns activity timeline with correct structure', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockLogs = [
        {
          id: 'log-1',
          action: 'REQUEST_CREATED',
          description: 'Tạo yêu cầu mới',
          entityType: 'REQUEST',
          entityId: 'req-1',
          timestamp: new Date(),
          user: { name: 'User A' },
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.activity).toHaveLength(1);
      expect(data.activity[0]).toMatchObject({
        id: 'log-1',
        action: 'REQUEST_CREATED',
        description: 'Tạo yêu cầu mới',
        actor: 'User A',
      });
      expect(data.activity[0].relativeTime).toBeDefined();
    });

    it('returns welcome message with correct counts', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(10);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(5);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        unreadCount: 3,
      });

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.welcome).toMatchObject({
        activeRequests: 0,
        pendingDocs: 0,
        newReplies: 3,
      });
    });
  });

  // ============================
  // BLACKBOX TESTS (Integration)
  // ============================
  describe('Blackbox Tests - Integration', () => {
    it('returns 401 without session', async () => {
      mockRequireAppSession.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      await expect(GET(request)).rejects.toThrow('Unauthorized');
    });

    it('returns 200 with valid session', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('returns JSON with correct content-type', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('returns all required fields in response', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'Test',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('workspace');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('welcome');
      expect(data).toHaveProperty('recentCases');
      expect(data).toHaveProperty('deadlines');
      expect(data).toHaveProperty('recentDocs');
      expect(data).toHaveProperty('activity');
    });

    it('filters data by workspace ID', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-specific' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(5);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(3);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      // Verify workspace ID is used in queries
      expect(mockPrisma.request.count).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-specific' },
      });
      expect(data.stats.totalRequests).toBe(5);
    });
  });

  // ============================
  // ABNORMAL TESTS (Edge Cases)
  // ============================
  describe('Abnormal Tests - Edge Cases', () => {
    it('handles empty workspace', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.workspace.name).toBe('');
    });

    it('handles null assignee on cases', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockCases = [
        {
          id: 'case-1',
          code: 'CASE-001',
          title: 'Test',
          matterType: 'CONTRACT',
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
          assignee: null,
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue(mockCases);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.recentCases[0].assignee).toBe('Chưa phân công');
      expect(data.recentCases[0].assigneeRole).toBe('');
    });

    it('handles null uploadedByUser on documents', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockDocs = [
        {
          id: 'doc-1',
          filename: 'test.pdf',
          size: 1000,
          mimeType: 'application/pdf',
          status: 'ACTIVE',
          updatedAt: new Date(),
          uploadedByUser: null,
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue(mockDocs);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.recentDocs[0].uploadedBy).toBe('Hệ thống');
    });

    it('handles null user on audit logs', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockLogs = [
        {
          id: 'log-1',
          action: 'TEST',
          description: 'Test action',
          entityType: 'REQUEST',
          entityId: 'req-1',
          timestamp: new Date(),
          user: null,
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.activity[0].actor).toBe('Hệ thống');
    });

    it('handles past deadlines correctly', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockCases = [
        {
          id: 'case-1',
          code: 'CASE-001',
          title: 'Overdue case',
          matterType: 'CONTRACT',
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
          assignee: { name: 'User', role: 'SPECIALIST' },
          slaDeadline: yesterday,
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue(mockCases);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.deadlines[0].progress).toBe(100);
      expect(data.deadlines[0].status).toBe('danger');
    });

    it('handles very large numbers in stats', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(999999);
      mockPrisma.request.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(888888);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.stats.totalRequests).toBe(999999);
      expect(data.stats.vaultDocs).toBe(888888);
    });
  });

  // ============================
  // ERROR TESTS
  // ============================
  describe('Error Tests', () => {
    it('returns 500 on database error', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);
      mockPrisma.workspace.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      await expect(GET(request)).rejects.toThrow('Database connection failed');
    });

    it('handles partial database failures gracefully', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      // First query succeeds
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        name: 'Test',
        slug: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.request.count.mockResolvedValue(5);

      // Second query fails
      mockPrisma.request.findMany.mockRejectedValue(new Error('Query timeout'));

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      await expect(GET(request)).rejects.toThrow('Query timeout');
    });

    it('handles null response from database', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(null as any);
      mockPrisma.request.findMany.mockResolvedValue(null as any);
      mockPrisma.document.count.mockResolvedValue(null as any);
      mockPrisma.document.findMany.mockResolvedValue(null as any);
      mockPrisma.auditLog.findMany.mockResolvedValue(null as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');

      // Should handle null counts without crashing
      const response = await GET(request);
      const data = await response.json();

      expect(data.stats.totalRequests).toBe(0);
    });

    it('handles undefined status in request', async () => {
      const mockSession = { userId: 'user-1', activeWorkspaceId: 'ws-1' };
      mockRequireAppSession.mockResolvedValue(mockSession);

      const mockCases = [
        {
          id: 'case-1',
          code: 'CASE-001',
          title: 'Test',
          matterType: 'CONTRACT',
          status: undefined as any,
          updatedAt: new Date(),
          assignee: { name: 'User', role: 'SPECIALIST' },
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.request.count.mockResolvedValue(0);
      mockPrisma.request.findMany.mockResolvedValue(mockCases);
      mockPrisma.document.count.mockResolvedValue(0);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      // Should default to blue badge and 'Mới' status
      expect(data.recentCases[0].statusVariant).toBe('blue');
      expect(data.recentCases[0].statusText).toBe('Mới');
    });
  });
});
