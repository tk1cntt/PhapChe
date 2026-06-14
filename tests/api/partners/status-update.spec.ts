import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    partnerMember: { findFirst: vi.fn() },
    legalRequest: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    engagement: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

// Mock auth
vi.mock('@/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { PATCH } from '@/app/api/partner/requests/[id]/status/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuth = auth as jest.Mocked<typeof auth>;

describe('Partner Status Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // WHITEBOX TESTS (Unit Tests)
  describe('Whitebox Tests - Unit', () => {
    it('should update request status successfully', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Partner User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        partnerId: 'partner-1',
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(),
      });

      mockPrisma.legalRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        assignedPartnerId: 'partner-1',
        status: 'submitted',
      } as any);

      mockPrisma.legalRequest.update.mockResolvedValue({
        id: 'req-1',
        status: 'in_progress',
        statusNote: 'Started working',
        updatedAt: new Date(),
      } as any);

      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress', note: 'Started working' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('in_progress');
      expect(mockPrisma.legalRequest.update).toHaveBeenCalled();
    });

    it('should reject invalid status values', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Partner User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        partnerId: 'partner-1',
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(),
      });

      mockPrisma.legalRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        assignedPartnerId: 'partner-1',
        status: 'submitted',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid_status' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid status');
    });

    it('should reject unauthorized users', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(401);
    });

    it('should reject non-partner users', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Regular User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(403);
    });
  });

  // BLACKBOX TESTS (Integration)
  describe('Blackbox Tests - Integration', () => {
    it('should return 404 for non-existent request', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Partner User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        partnerId: 'partner-1',
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(),
      });

      mockPrisma.legalRequest.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/non-existent/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
    });

    it('should deny access to requests not assigned to partner', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Partner User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        partnerId: 'partner-1',
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(),
      });

      mockPrisma.legalRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        assignedPartnerId: 'different-partner',
        status: 'submitted',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_progress' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(403);
    });
  });

  // ABNORMAL TESTS
  describe('Abnormal Tests', () => {
    it('should handle missing status field', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Partner User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        partnerId: 'partner-1',
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(),
      });

      mockPrisma.legalRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        assignedPartnerId: 'partner-1',
        status: 'submitted',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid status');
    });
  });
});
