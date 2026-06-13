import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaceMembership: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    legalRequest: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    auditEvent: {
      findMany: vi.fn(),
    },
    workflowTransition: {
      findMany: vi.fn(),
    },
    workspace: {
      findMany: vi.fn(),
    },
    matterType: {
      findMany: vi.fn(),
    },
  },
}));

// Simple mock session
const mockSession = {
  userId: 'user-1',
  email: 'admin@test.com',
  name: 'Admin User',
  roles: ['super_admin'],
  activeWorkspaceId: 'ws-1',
};

// Simple test to verify ops-service can be imported
describe('Ops Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have valid imports', async () => {
    // This test verifies the module can be imported without errors
    const opsService = await import('@/lib/ops/ops-service');
    expect(opsService).toBeDefined();
    expect(typeof opsService.getOpsAggregate).toBe('function');
    expect(typeof opsService.calcOpsSla).toBe('function');
  });

  it('should calculate SLA correctly for null deadline', () => {
    const opsService = require('@/lib/ops/ops-service');
    const sla = opsService.calcOpsSla(null, null, new Date());
    expect(sla.level).toBe('info');
    expect(sla.label).toBe('Không có SLA');
  });

  it('should calculate SLA as danger when deadline is passed', () => {
    const opsService = require('@/lib/ops/ops-service');
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const sla = opsService.calcOpsSla(pastDate, null, new Date(Date.now() - 10 * 24 * 60 * 60 * 1000));
    expect(sla.level).toBe('danger');
  });

  it('should calculate SLA as warn when deadline is within 24 hours', () => {
    const opsService = require('@/lib/ops/ops-service');
    const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    const sla = opsService.calcOpsSla(soonDate, null, new Date());
    expect(sla.level).toBe('warn');
  });

  it('should calculate SLA as ok when deadline is far', () => {
    const opsService = require('@/lib/ops/ops-service');
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const sla = opsService.calcOpsSla(futureDate, null, new Date());
    expect(sla.level).toBe('ok');
  });
});
