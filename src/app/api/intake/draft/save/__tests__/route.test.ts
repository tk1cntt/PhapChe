import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    draft: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditEvent: { create: vi.fn() },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

describe('POST /api/intake/draft/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(requireAppSession).mockRejectedValue(new Error('UNAUTHENTICATED'));

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHENTICATED');
    });

    it('returns 401 when user does not exist in database', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Validation', () => {
    it('returns 400 when domainId is missing', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when serviceType is missing', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when contactInfo email is invalid', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'invalid-email' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when more than 20 files are provided', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });

      const files = Array.from({ length: 21 }, (_, i) => ({
        vaultFileId: `file-${i}`,
        filename: `file${i}.pdf`,
        size: 1024,
      }));

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          files,
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Create new draft', () => {
    it('creates new draft when draftId is not provided', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });
      vi.mocked(prisma.draft.create).mockResolvedValue({
        id: 'draft-new',
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: { partner_name: 'ABC Partner' },
          priority: 'normal',
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.draftId).toBe('draft-new');
      expect(prisma.draft.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: { partner_name: 'ABC Partner' },
          files: [],
          priority: 'normal',
          contactInfo: { email: 'test@example.com' },
          status: 'draft',
        },
        select: { id: true, updatedAt: true },
      });
    });
  });

  describe('Update existing draft', () => {
    it('updates draft when draftId is provided and user owns it', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-123',
        userId: 'user-123',
      });
      vi.mocked(prisma.draft.update).mockResolvedValue({
        id: 'draft-123',
        updatedAt: new Date('2024-01-02'),
      });
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: 'draft-123',
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: { partner_name: 'Updated Partner' },
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.draftId).toBe('draft-123');
      expect(prisma.draft.update).toHaveBeenCalled();
    });

    it('returns 404 when draft does not exist', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: 'draft-not-found',
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });

    it('returns 403 when user does not own the draft (IDOR protection)', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });
      vi.mocked(prisma.draft.findUnique).mockResolvedValue({
        id: 'draft-456',
        userId: 'user-456', // Different user
      });

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: 'draft-456',
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('FORBIDDEN');
    });
  });

  describe('Audit logging', () => {
    it('logs audit event when draft is saved', async () => {
      vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' });
      vi.mocked(prisma.draft.create).mockResolvedValue({
        id: 'draft-new',
        updatedAt: new Date('2024-01-01'),
      });
      vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

      const request = new Request('http://localhost/api/intake/draft/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: 'commercial-legal',
          serviceType: 'agency_contract',
          answers: {},
          contactInfo: { email: 'test@example.com' },
        }),
      });

      await POST(request);

      expect(prisma.auditEvent.create).toHaveBeenCalledWith({
        data: {
          action: 'draft.save',
          actorId: 'user-123',
          targetType: 'draft',
          targetId: 'draft-new',
          metadata: {
            domainId: 'commercial-legal',
            serviceType: 'agency_contract',
            priority: 'normal',
          },
        },
      });
    });
  });
});
