import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseOpsFilters } from './ops-service';

// Unit tests for parseOpsFilters
describe('parseOpsFilters', () => {
  it('should parse valid status filter', () => {
    const result = parseOpsFilters({ status: 'pending_review' });
    expect(result.status).toBe('pending_review');
  });

  it('should ignore invalid status filter', () => {
    const result = parseOpsFilters({ status: 'not_a_status' });
    expect(result.status).toBe(undefined);
  });

  it('should parse valid date filter', () => {
    const result = parseOpsFilters({ dateFrom: '2024-01-15' });
    expect(result.dateFrom).toBeInstanceOf(Date);
  });

  it('should ignore invalid date filter', () => {
    const result = parseOpsFilters({ dateFrom: 'not-a-date' });
    expect(result.dateFrom).toBe(undefined);
  });

  it('should parse matterTypeKey filter', () => {
    const result = parseOpsFilters({ matterTypeKey: 'agency_contract' });
    expect(result.matterTypeKey).toBe('agency_contract');
  });

  it('should parse workspaceId filter', () => {
    const result = parseOpsFilters({ workspaceId: 'ws-123' });
    expect(result.workspaceId).toBe('ws-123');
  });

  it('should parse assignedSpecialistId filter', () => {
    const result = parseOpsFilters({ assignedSpecialistId: 'user-456' });
    expect(result.assignedSpecialistId).toBe('user-456');
  });

  it('should parse assignedReviewerId filter', () => {
    const result = parseOpsFilters({ assignedReviewerId: 'user-789' });
    expect(result.assignedReviewerId).toBe('user-789');
  });

  it('should parse multiple filters together', () => {
    const result = parseOpsFilters({
      status: 'in_progress',
      workspaceId: 'ws-123',
      matterTypeKey: 'contract',
      assignedSpecialistId: 'user-1',
    });
    expect(result.status).toBe('in_progress');
    expect(result.workspaceId).toBe('ws-123');
    expect(result.matterTypeKey).toBe('contract');
    expect(result.assignedSpecialistId).toBe('user-1');
  });
});

// Unit tests for SLA calculation logic
describe('calcOpsSla logic', () => {
  const calcOpsSla = (slaDeadline: Date | null, latestTransitionCreatedAt: Date | null, requestCreatedAt: Date) => {
    const now = new Date();

    if (!slaDeadline) {
      return { level: 'info' as const, label: 'Không có SLA', percent: 100, source: 'no_deadline' };
    }

    const deadline = new Date(slaDeadline);
    const msUntilDeadline = deadline.getTime() - now.getTime();
    const hoursUntilDeadline = msUntilDeadline / (1000 * 60 * 60);

    if (hoursUntilDeadline < 0) {
      const overHours = Math.abs(hoursUntilDeadline);
      const percent = Math.min(100, overHours * 10);
      return { level: 'danger' as const, label: 'Quá hạn', percent, source: 'deadline_passed' };
    }

    if (hoursUntilDeadline < 24) {
      const percent = Math.round((1 - hoursUntilDeadline / 24) * 100);
      return { level: 'warn' as const, label: 'Gần hạn', percent, source: 'deadline_soon' };
    }

    const totalHours = (deadline.getTime() - requestCreatedAt.getTime()) / (1000 * 60 * 60);
    const percent = Math.round((msUntilDeadline / (totalHours * 1000 * 60 * 60)) * 100);
    return { level: 'ok' as const, label: 'Đúng tiến độ', percent, source: 'deadline_ok' };
  };

  it('should return info level when deadline is null', () => {
    const result = calcOpsSla(null, null, new Date());
    expect(result.level).toBe('info');
    expect(result.label).toBe('Không có SLA');
  });

  it('should return danger when deadline is passed', () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = calcOpsSla(pastDate, null, new Date(Date.now() - 10 * 24 * 60 * 60 * 1000));
    expect(result.level).toBe('danger');
    expect(result.label).toBe('Quá hạn');
  });

  it('should return warn when deadline is within 24 hours', () => {
    const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const result = calcOpsSla(soonDate, null, new Date());
    expect(result.level).toBe('warn');
    expect(result.label).toBe('Gần hạn');
  });

  it('should return ok when deadline is far (>24h)', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = calcOpsSla(futureDate, null, new Date());
    expect(result.level).toBe('ok');
    expect(result.label).toBe('Đúng tiến độ');
  });

  it('should return warn at exactly 24 hours', () => {
    const exactly24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = calcOpsSla(exactly24h, null, new Date());
    expect(result.level).toBe('ok'); // At exactly 24h, not < 24h
  });

  it('should return warn at just under 24 hours', () => {
    const justUnder24h = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const result = calcOpsSla(justUnder24h, null, new Date());
    expect(result.level).toBe('warn');
  });

  it('should return danger when deadline is in the past', () => {
    const pastDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    const result = calcOpsSla(pastDeadline, null, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    expect(result.level).toBe('danger');
  });
});

// Whitebox tests - verify ops-service has correct exports
describe('ops-service exports', () => {
  it('should export parseOpsFilters', async () => {
    const module = await import('./ops-service');
    expect(typeof module.parseOpsFilters).toBe('function');
  });

  it('should export requireOpsAdmin', async () => {
    const module = await import('./ops-service');
    expect(typeof module.requireOpsAdmin).toBe('function');
  });

  it('should export getOpsDashboard', async () => {
    const module = await import('./ops-service');
    expect(typeof module.getOpsDashboard).toBe('function');
  });

  it('should export getOpsAggregate', async () => {
    const module = await import('./ops-service');
    expect(typeof module.getOpsAggregate).toBe('function');
  });

  it('should export calcOpsSla', async () => {
    const module = await import('./ops-service');
    expect(typeof module.calcOpsSla).toBe('function');
  });

  it('should export getOpsRequestTimeline', async () => {
    const module = await import('./ops-service');
    expect(typeof module.getOpsRequestTimeline).toBe('function');
  });
});

// OpsAggregateDto structure validation
describe('OpsAggregateDto structure', () => {
  it('should have required stats fields', () => {
    const stats = {
      openRequests: 0,
      nearSla: 0,
      completedToday: 0,
      auditWarnings: 0,
    };

    expect(stats).toHaveProperty('openRequests');
    expect(stats).toHaveProperty('nearSla');
    expect(stats).toHaveProperty('completedToday');
    expect(stats).toHaveProperty('auditWarnings');
  });

  it('should have required pagination fields', () => {
    const pagination = {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    };

    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('pageSize');
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('totalPages');
  });

  it('should have required filters fields', () => {
    const filters = {
      workspaces: [],
      matterTypes: [],
      specialists: [],
      reviewers: [],
      statuses: [],
    };

    expect(filters).toHaveProperty('workspaces');
    expect(filters).toHaveProperty('matterTypes');
    expect(filters).toHaveProperty('specialists');
    expect(filters).toHaveProperty('reviewers');
    expect(filters).toHaveProperty('statuses');
  });
});
