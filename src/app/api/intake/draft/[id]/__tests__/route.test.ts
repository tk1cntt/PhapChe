import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE } from '../route';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    draft: { findUnique: vi.fn(), update: vi.fn() },
    auditEvent: { create: vi.fn() },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

describe('GET /api/intake/draft/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(requireAppSession).mockRejectedValue(new Error('UNAUTHENTICATED'));

      const request = new Request('http://localhost/api/intake/draft/draft-123');
      const response = await GET(request, { params: { id: 'draft-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHENTICATED');
    });
  });

  describe('Validation', () => {
    it('returns 400 when draft ID is empty', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });

      const request = new Request('http://localhost/api/intake/draft/');
      const response = await GET(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Draft retrieval', () => {
    it('returns draft data when user owns the draft', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-123',
        userId: 'user-123',
        domainId: 'commercial-legal',
        serviceType: 'agency_contract',
        answers: { partner_name: 'ABC Partner' },
        files: [],
        priority: 'normal',
        contactInfo: { email: 'test@example.com' },
        status: 'draft',
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/draft-123');
      const response = await GET(request, { params: { id: 'draft-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.draftId).toBe('draft-123');
      expect(data.data.domainId).toBe('commercial-legal');
      expect(data.data.serviceType).toBe('agency_contract');
      expect(data.data.answers).toEqual({ partner_name: 'ABC Partner' });
    });

    it('returns 404 when draft does not exist', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/intake/draft/draft-not-found');
      const response = await GET(request, { params: { id: 'draft-not-found' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });

    it('returns 403 when user does not own the draft (IDOR protection)', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-456',
        userId: 'user-456', // Different user
        domainId: 'commercial-legal',
        serviceType: 'agency_contract',
        answers: {},
        files: [],
        priority: 'normal',
        contactInfo: { email: 'test@example.com' },
        status: 'draft',
        updatedAt: new Date('2024-01-01'),
      });

      const request = new Request('http://localhost/api/intake/draft/draft-456');
      const response = await GET(request, { params: { id: 'draft-456' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('FORBIDDEN');
    });

    it('returns 404 when draft status is not "draft"', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-789',
        userId: 'user-123',
        domainId: 'commercial-legal',
        serviceType: 'agency_contract',
        answers: {},
        files: [],
        priority: 'normal',
        contactInfo: { email: 'test@example.com' },
        status: 'submitted', // Not 'draft'
        updatedAt: new Date('2024-01-01'),
      });

      const request = new Request('http://localhost/api/intake/draft/draft-789');
      const response = await GET(request, { params: { id: 'draft-789' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('Audit logging', () => {
    it('logs audit event when draft is loaded', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-123',
        userId: 'user-123',
        domainId: 'commercial-legal',
        serviceType: 'agency_contract',
        answers: {},
        files: [],
        priority: 'normal',
        contactInfo: { email: 'test@example.com' },
        status: 'draft',
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/draft-123');
      await GET(request, { params: { id: 'draft-123' } });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: {
          action: 'draft.load',
          actorId: 'user-123',
          targetType: 'draft',
          targetId: 'draft-123',
          metadata: {
            domainId: 'commercial-legal',
            serviceType: 'agency_contract',
          },
        },
      });
    });
  });
});

describe('DELETE /api/intake/draft/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(requireAppSession).mockRejectedValue(new Error('UNAUTHENTICATED'));

      const request = new Request('http://localhost/api/intake/draft/draft-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'draft-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHENTICATED');
    });
  });

  describe('Soft delete', () => {
    it('soft-deletes draft when user owns it', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-123',
        userId: 'user-123',
        status: 'draft',
      });
      vi.mocked(prisma.draft.update).mockResolvedValue({});
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/draft-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'draft-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(prisma.draft.update).toHaveBeenCalledWith({
        where: { id: 'draft-123' },
        data: { status: 'deleted' },
      });
    });

    it('returns 404 when draft does not exist', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/intake/draft/draft-not-found', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'draft-not-found' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });

    it('returns 403 when user does not own the draft (IDOR protection)', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-456',
        userId: 'user-456', // Different user
        status: 'draft',
      });

      const request = new Request('http://localhost/api/intake/draft/draft-456', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'draft-456' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('FORBIDDEN');
    });
  });

  describe('Audit logging', () => {
    it('logs audit event when draft is deleted', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-123',
        userId: 'user-123',
        status: 'draft',
      });
      vi.mocked(prisma.draft.update).mockResolvedValue({});
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/draft-123', {
        method: 'DELETE',
      });
      await DELETE(request, { params: { id: 'draft-123' } });

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: {
          action: 'draft.delete',
          actorId: 'user-123',
          targetType: 'draft',
          targetId: 'draft-123',
          metadata: {
            previousStatus: 'draft',
          },
        },
      });
    });
  });
});
