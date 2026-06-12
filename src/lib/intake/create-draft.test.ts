import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockPrisma = {
  $transaction: vi.fn(),
  legalRequest: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  intakeSubmission: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  matterType: {
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/security/rbac', () => ({
  canAccessWorkspace: vi.fn().mockResolvedValue(true),
  canAccessRequest: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/audit/audit', () => ({
  recordAuditEvent: vi.fn(),
}));

// Mock getMatterType
vi.mock('./catalog', () => ({
  getMatterType: vi.fn().mockReturnValue({
    key: 'agency_contract',
    label: 'Hợp đồng đại lý',
    description: 'Hợp đồng đại lý',
    schemaVersion: '1.0',
    questions: [
      { key: 'partner_name', label: 'Tên đối tác', required: true },
      { key: 'commission_rate', label: 'Tỷ lệ hoa hồng', required: true },
      { key: 'contract_term', label: 'Thời hạn hợp đồng', required: true },
    ],
  }),
}));

describe('Intake Draft Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create intakeSubmission when creating draft request', async () => {
    // Setup mock for transaction
    const mockRequest = {
      id: 'req-123',
      status: 'draft_intake',
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma);
    });

    mockPrisma.matterType.upsert.mockResolvedValue({ id: 'mt-1' });
    mockPrisma.legalRequest.create.mockResolvedValue(mockRequest);
    mockPrisma.intakeSubmission.create.mockResolvedValue({ id: 'is-123' });

    // Import and call the function
    const { createDraftIntake } = await import('./intake-service');

    const result = await createDraftIntake({
      session: {
        userId: 'user-1',
        activeWorkspaceId: 'ws-1',
      } as any,
      matterTypeKey: 'agency_contract',
      correlationId: 'corr-1',
    });

    // Verify legalRequest was created with intakeSubmission
    expect(mockPrisma.legalRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          createdById: 'user-1',
          status: 'draft_intake',
          intakeSubmission: {
            create: expect.objectContaining({
              workspaceId: 'ws-1',
              matterTypeKey: 'agency_contract',
            }),
          },
        }),
      }),
    );

    expect(result).toEqual(mockRequest);
  });
});

describe('Submit Intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find intakeSubmission when submitting', async () => {
    const mockSubmission = {
      id: 'is-123',
      requestId: 'req-123',
      matterTypeKey: 'agency_contract',
      answers: {
        partner_name: 'Test Company',
        commission_rate: '10%',
        contract_term: '12 months',
      },
      request: {
        workspaceId: 'ws-1',
        status: 'draft_intake',
      },
    };

    mockPrisma.intakeSubmission.findUnique.mockResolvedValue(mockSubmission);

    // Import and call the function
    const { submitIntake } = await import('./intake-service');

    // This should not throw "INTAKE_SUBMISSION_NOT_FOUND"
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma);
    });

    // Mock transitionRequestStatus
    vi.mock('@/lib/workflow/request-workflow', () => ({
      transitionRequestStatus: vi.fn().mockResolvedValue({}),
    }));

    const result = await submitIntake({
      session: {
        userId: 'user-1',
        activeWorkspaceId: 'ws-1',
      } as any,
      requestId: 'req-123',
      correlationId: 'corr-1',
    });

    // Verify submission was found and submitted
    expect(mockPrisma.intakeSubmission.findUnique).toHaveBeenCalledWith({
      where: { requestId: 'req-123' },
    });

    expect(result).toBeDefined();
  });
});
