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
    workflowTransition: { create: vi.fn() },
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

// Mock prisma transaction
const mockTransaction = vi.fn();
(mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(mockTransaction);

describe('Partner Status Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // WHITEBOX TESTS (Unit Tests)
  describe('Whitebox Tests - Unit', () => {
    it('should update request status to pending_review from in_progress', async () => {
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
        status: 'in_progress',
      } as any);

      mockTransaction.mockResolvedValueOnce([{
        id: 'req-1',
        status: 'pending_review',
        statusNote: 'Submitted for review',
        updatedAt: new Date(),
      }]);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review', note: 'Submitted for review' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.status).toBe('pending_review');
      expect(mockTransaction).toHaveBeenCalled();
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
        status: 'in_progress',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid_status' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('should reject unauthorized users', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(401);
      expect(mockPrisma.partnerMember.findFirst).not.toHaveBeenCalled();
    });

    it('should reject non-partner users', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Regular User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(403);
    });

    it('should reject invalid workflow transitions', async () => {
      const mockSession = { user: { id: 'user-1', name: 'Partner User' } };
      mockAuth.api.getSession.mockResolvedValue(mockSession as any);

      mockPrisma.partnerMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        partnerId: 'partner-1',
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(),
      });

      // Cannot transition from 'submitted' to 'pending_review' - only 'in_progress' can transition
      mockPrisma.legalRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        assignedPartnerId: 'partner-1',
        status: 'submitted',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_TRANSITION');
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
        body: JSON.stringify({ status: 'pending_review' }),
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
        status: 'in_progress',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(403);
    });

    it('should allow access via engagement partnerId', async () => {
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
        assignedPartnerId: null,
        engagement: { partnerId: 'partner-1' },
        status: 'in_progress',
      } as any);

      mockTransaction.mockResolvedValueOnce([{
        id: 'req-1',
        status: 'pending_review',
        statusNote: null,
        updatedAt: new Date(),
      }]);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(200);
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
        status: 'in_progress',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.field).toBe('status');
    });

    it('should allow same status with note update', async () => {
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
        status: 'pending_review',
      } as any);

      // When staying in same status, no transition validation needed
      mockTransaction.mockResolvedValueOnce([{
        id: 'req-1',
        status: 'pending_review',
        statusNote: 'Updated note',
        updatedAt: new Date(),
      }]);

      const request = new NextRequest('http://localhost:3000/api/partner/requests/req-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending_review', note: 'Updated note' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'req-1' }) });

      expect(response.status).toBe(200);
    });
  });
});
