/**
 * Task 76-18: Unit tests cho POST /api/intake/submit endpoint
 * Test coverage: authentication, validation, IDOR protection, SLA calculation, audit logging
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { submitIntake } from '@/lib/intake/intake-service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    legalRequest: { findUnique: vi.fn(), update: vi.fn() },
    auditEvent: { create: vi.fn() },
  },
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

vi.mock('@/lib/intake/intake-service', () => ({
  submitIntake: vi.fn().mockResolvedValue({ requestId: 'req-123', status: 'submitted' }),
}));

describe('POST /api/intake/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Authentication tests
  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(requireAppSession).mockRejectedValue(new Error('UNAUTHENTICATED'));

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('UNAUTHENTICATED');
  });

  // Validation tests
  it('returns 400 when requestId is missing', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when priority is invalid', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123', priority: 'invalid' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when contactInfo email is invalid', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123', contactInfo: { email: 'not-an-email' } }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  // IDOR protection tests
  it('returns 404 when request does not exist', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-not-found' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('NOT_FOUND');
  });

  it('returns 403 when user does not own the request (IDOR protection)', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue({
      id: 'req-456',
      createdById: 'user-456',
      status: 'draft',
      slaDeadline: null,
    });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-456' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('FORBIDDEN');
  });

  // SLA calculation tests
  it('sets SLA to 72 hours for normal priority', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue({
      id: 'req-123',
      createdById: 'user-123',
      status: 'draft',
      slaDeadline: null,
    });
    vi.mocked(prisma.legalRequest.update).mockResolvedValue({
      id: 'req-123',
      status: 'submitted',
      slaDeadline: new Date('2024-01-04T00:00:00Z'),
      submittedAt: now,
    });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(prisma.legalRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-123' },
      data: expect.objectContaining({
        priority: 'normal',
        submittedAt: now,
        slaDeadline: new Date('2024-01-04T00:00:00Z'),
      }),
    });

    vi.useRealTimers();
  });

  it('sets SLA to 24 hours for urgent priority', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue({
      id: 'req-123',
      createdById: 'user-123',
      status: 'draft',
      slaDeadline: null,
    });
    vi.mocked(prisma.legalRequest.update).mockResolvedValue({
      id: 'req-123',
      status: 'submitted',
      slaDeadline: new Date('2024-01-02T00:00:00Z'),
      submittedAt: now,
    });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123', priority: 'urgent' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(prisma.legalRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-123' },
      data: expect.objectContaining({
        priority: 'urgent',
        slaDeadline: new Date('2024-01-02T00:00:00Z'),
      }),
    });

    vi.useRealTimers();
  });

  // Contact info tests
  it('updates contact info when provided', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue({
      id: 'req-123',
      createdById: 'user-123',
      status: 'draft',
      slaDeadline: null,
    });
    vi.mocked(prisma.legalRequest.update).mockResolvedValue({
      id: 'req-123',
      status: 'submitted',
      slaDeadline: new Date('2024-01-04T00:00:00Z'),
      submittedAt: new Date(),
    });

    const contactInfo = {
      email: 'test@example.com',
      phone: '0987654321',
      companyName: 'Test Corp',
      taxCode: '0123456789',
    };

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123', contactInfo }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(prisma.legalRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-123' },
      data: expect.objectContaining({ contactInfo }),
    });
  });

  // Audit logging tests
  it('logs audit event for urgent priority escalation', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue({
      id: 'req-123',
      createdById: 'user-123',
      status: 'draft',
      slaDeadline: null,
    });
    vi.mocked(prisma.legalRequest.update).mockResolvedValue({
      id: 'req-123',
      status: 'submitted',
      slaDeadline: new Date('2024-01-02T00:00:00Z'),
      submittedAt: new Date(),
    });
    vi.mocked(prisma.auditEvent.create).mockResolvedValue({});

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123', priority: 'urgent' }),
    });

    await POST(req);

    expect(prisma.auditEvent.create).toHaveBeenCalled();
    const auditCall = vi.mocked(prisma.auditEvent.create).mock.calls[0][0];
    expect(auditCall.data.action).toBe('request.priority.escalated');
    expect(auditCall.data.actorId).toBe('user-123');
    expect(auditCall.data.targetType).toBe('request');
    expect(auditCall.data.targetId).toBe('req-123');
    expect(auditCall.data.metadata.priority).toBe('urgent');
    expect(auditCall.data.metadata.slaDeadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('does not log audit event for normal priority', async () => {
    vi.mocked(requireAppSession).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(prisma.legalRequest.findUnique).mockResolvedValue({
      id: 'req-123',
      createdById: 'user-123',
      status: 'draft',
      slaDeadline: null,
    });
    vi.mocked(prisma.legalRequest.update).mockResolvedValue({
      id: 'req-123',
      status: 'submitted',
      slaDeadline: new Date('2024-01-04T00:00:00Z'),
      submittedAt: new Date(),
    });

    const req = new Request('http://localhost/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'req-123' }),
    });

    await POST(req);

    expect(prisma.auditEvent.create).not.toHaveBeenCalled();
  });
});
