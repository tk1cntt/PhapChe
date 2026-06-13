import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/intake/intake-service', () => ({
  createDraftIntake: vi.fn(),
  saveIntakeAnswers: vi.fn(),
  submitIntake: vi.fn(),
}));

vi.mock('@/lib/intake/upload-service', () => ({
  attachIntakeFile: vi.fn(),
}));

vi.mock('@/lib/security/session', () => ({
  requireAppSession: vi.fn(),
}));

vi.mock('@/lib/security/rbac', () => ({
  canAccessRequest: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    legalRequest: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    intakeSubmission: {
      deleteMany: vi.fn(),
    },
    vaultFile: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Re-import after mocks are set up
import {
  createDraftIntakeAction,
  saveIntakeAnswersAction,
  attachIntakeFileAction,
  submitIntakeAction,
  deleteDraftIntakeAction,
} from './actions';

describe('Intake Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createIntakeDraftAction', () => {
    it('should throw error when matterTypeKey is missing', async () => {
      const { requireAppSession } = await import('@/lib/security/session');
      vi.mocked(requireAppSession).mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.com',
        roles: [],
        activeWorkspaceId: 'ws-1',
      });

      const formData = new FormData();
      formData.append('otherField', 'value');

      await expect(createIntakeDraftAction(formData)).rejects.toThrow(
        'Vui lòng chọn một nhóm dịch vụ để tiếp tục.'
      );
    });
  });

  describe('saveIntakeAnswersAction', () => {
    it('should extract answers with answer. prefix', async () => {
      const { requireAppSession } = await import('@/lib/security/session');
      const { saveIntakeAnswers } = await import('@/lib/intake/intake-service');
      const { canAccessRequest } = await import('@/lib/security/rbac');

      vi.mocked(requireAppSession).mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.com',
        roles: [],
        activeWorkspaceId: 'ws-1',
      });
      vi.mocked(canAccessRequest).mockResolvedValue(true);
      vi.mocked(saveIntakeAnswers).mockResolvedValue({ id: 'sub-1' });

      const formData = new FormData();
      formData.append('requestId', 'req-1');
      formData.append('answer.question1', 'answer 1');
      formData.append('answer.question2', 'answer 2');

      await saveIntakeAnswersAction(formData);

      expect(saveIntakeAnswers).toHaveBeenCalledWith({
        session: expect.any(Object),
        requestId: 'req-1',
        answers: { question1: 'answer 1', question2: 'answer 2' },
        correlationId: expect.stringContaining('intake-'),
      });
    });
  });

  describe('attachIntakeFileAction', () => {
    it('should throw error when file is missing', async () => {
      const { requireAppSession } = await import('@/lib/security/session');
      vi.mocked(requireAppSession).mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.com',
        roles: [],
        activeWorkspaceId: 'ws-1',
      });

      const formData = new FormData();
      formData.append('requestId', 'req-1');
      // No file attached

      await expect(attachIntakeFileAction(formData)).rejects.toThrow('FILE_REQUIRED');
    });
  });

  describe('deleteDraftIntakeAction', () => {
    it('should throw FORBIDDEN when user has no access', async () => {
      const { requireAppSession } = await import('@/lib/security/session');
      const { canAccessRequest } = await import('@/lib/security/rbac');

      vi.mocked(requireAppSession).mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.com',
        roles: [],
        activeWorkspaceId: 'ws-1',
      });
      vi.mocked(canAccessRequest).mockResolvedValue(false);

      const formData = new FormData();
      formData.append('requestId', 'req-1');

      await expect(deleteDraftIntakeAction(formData)).rejects.toThrow('FORBIDDEN');
    });
  });
});
