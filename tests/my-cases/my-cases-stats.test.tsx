import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data for testing
const mockRequests = [
  {
    id: 'req-1',
    code: 'REQ-2026-001',
    title: 'Contract Review',
    status: 'in_progress',
    slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedSpecialist: { name: 'Nguyen Van A' },
    assignedReviewer: null,
    intakeSubmission: { matterTypeKey: 'contract-review', matterType: { label_vi: 'Rà soát hợp đồng', label_en: 'Contract Review' } },
  },
  {
    id: 'req-2',
    code: 'REQ-2026-002',
    title: 'Trademark Registration',
    status: 'approved',
    slaDeadline: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedSpecialist: null,
    assignedReviewer: { name: 'Tran Thi B' },
    intakeSubmission: { matterTypeKey: 'trademark', matterType: { label_vi: 'Đăng ký nhãn hiệu', label_en: 'Trademark Registration' } },
  },
  {
    id: 'req-3',
    code: 'REQ-2026-003',
    title: 'Contract Draft',
    status: 'in_progress',
    slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue - 1 day ago
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedSpecialist: { name: 'Le Van C' },
    assignedReviewer: null,
    intakeSubmission: null,
  },
  {
    id: 'req-4',
    code: 'REQ-2026-004',
    title: 'Service Agreement',
    status: 'delivered',
    slaDeadline: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedSpecialist: { name: 'Pham Van D' },
    assignedReviewer: { name: 'Hoang Thi E' },
    intakeSubmission: { matterTypeKey: 'service-agreement', matterType: { label_vi: 'Hợp đồng dịch vụ', label_en: 'Service Agreement' } },
  },
  {
    id: 'req-5',
    code: 'REQ-2026-005',
    title: 'NDA Review',
    status: 'cancelled',
    slaDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedSpecialist: null,
    assignedReviewer: null,
    intakeSubmission: null,
  },
];

describe('MyCases Stats Calculation', () => {
  describe('Stats aggregation', () => {
    it('Test 1: Processing count should include in_progress, pending_review, triage, assigned', () => {
      // Processing = in_progress + pending_review + triage + assigned
      // Current mock data: 2 in_progress = 2 processing
      const processingStatuses = ['in_progress', 'pending_review', 'triage', 'assigned'];
      const processingCount = mockRequests.filter(req => processingStatuses.includes(req.status)).length;
      expect(processingCount).toBe(2);
    });

    it('Test 1: Completed count should include approved, delivered, closed', () => {
      // Completed = approved + delivered + closed
      // Current mock data: 1 approved + 1 delivered = 2 completed
      const completedStatuses = ['approved', 'delivered', 'closed'];
      const completedCount = mockRequests.filter(req => completedStatuses.includes(req.status)).length;
      expect(completedCount).toBe(2);
    });

    it('Test 1: Overdue count should be requests with slaDeadline < now AND status NOT completed/cancelled', () => {
      // Overdue = slaDeadline < NOW() AND status NOT IN (approved, delivered, closed, cancelled)
      const now = new Date();
      const completedStatuses = ['approved', 'delivered', 'closed', 'cancelled'];
      const overdueCount = mockRequests.filter(req => {
        if (completedStatuses.includes(req.status)) return false;
        if (!req.slaDeadline) return false;
        return req.slaDeadline < now;
      }).length;
      expect(overdueCount).toBe(1); // req-3 has slaDeadline in past and not completed
    });
  });

  describe('MatterType labels', () => {
    it('Test 2: Request should display MatterType label from intakeSubmission', () => {
      // req-1 has intakeSubmission with matterType
      const reqWithMatterType = mockRequests.find(r => r.id === 'req-1');
      expect(reqWithMatterType?.intakeSubmission?.matterType?.label_vi).toBe('Rà soát hợp đồng');
      expect(reqWithMatterType?.intakeSubmission?.matterType?.label_en).toBe('Contract Review');
    });

    it('Test 2: Request without intakeSubmission should fall back to title', () => {
      const reqWithoutMatterType = mockRequests.find(r => r.id === 'req-3');
      expect(reqWithoutMatterType?.intakeSubmission).toBeNull();
      expect(reqWithoutMatterType?.title).toBe('Contract Draft');
    });
  });

  describe('SLA calculation', () => {
    it('Test 3: SLA should be calculated from slaDeadline, not createdAt', () => {
      const req = mockRequests.find(r => r.id === 'req-1');
      const now = new Date();

      // SLA deadline is 3 days from now
      const deadline = req!.slaDeadline!;
      const remainingMs = deadline.getTime() - now.getTime();
      const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));

      // Should show "Còn X ngày" for > 24h remaining
      expect(remainingHours).toBeGreaterThan(24);
      expect(remainingHours / 24).toBeCloseTo(3, 0);
    });

    it('Test 3: Overdue request should show "Trễ X ngày"', () => {
      const req = mockRequests.find(r => r.id === 'req-3');
      const now = new Date();

      // SLA deadline is 1 day in the past
      const deadline = req!.slaDeadline!;
      const remainingMs = deadline.getTime() - now.getTime();
      const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));

      // Should show "Trễ 1 ngày"
      expect(remainingHours).toBeLessThan(0);
      const overdueDays = Math.abs(Math.round(remainingHours / 24));
      expect(overdueDays).toBe(1);
    });

    it('Test 3: SLA variant should be red for overdue', () => {
      const req = mockRequests.find(r => r.id === 'req-3');
      const now = new Date();
      const deadline = req!.slaDeadline!;
      const remainingHours = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

      const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 24 ? 'orange' : remainingHours < 72 ? 'orange' : 'green';
      expect(slaVariant).toBe('red');
    });

    it('Test 3: SLA variant should be orange for < 24h remaining', () => {
      const req = {
        ...mockRequests[0],
        slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      };
      const now = new Date();
      const remainingHours = Math.round((req.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));

      const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 24 ? 'orange' : remainingHours < 72 ? 'orange' : 'green';
      expect(slaVariant).toBe('orange');
    });

    it('Test 3: SLA variant should be green for > 72h remaining', () => {
      const req = mockRequests.find(r => r.id === 'req-1');
      const now = new Date();
      const remainingHours = Math.round((req!.slaDeadline!.getTime() - now.getTime()) / (1000 * 60 * 60));

      const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 24 ? 'orange' : remainingHours < 72 ? 'orange' : 'green';
      expect(slaVariant).toBe('green');
    });
  });

  describe('Status badge mapping', () => {
    it('Test 4: in_progress should map to review badge', () => {
      const req = mockRequests.find(r => r.id === 'req-1');
      const status = req!.status;
      const isOverdue = false;

      const statusBadge = (
        status === 'in_progress' || status === 'pending_review' ? 'review' :
        status === 'approved' ? 'approved' :
        status === 'submitted' ? 'submitted' :
        isOverdue ? 'overdue' : 'pending'
      );
      expect(statusBadge).toBe('review');
    });

    it('Test 4: approved should map to approved badge', () => {
      const req = mockRequests.find(r => r.id === 'req-2');
      const status = req!.status;
      const isOverdue = false;

      const statusBadge = (
        status === 'in_progress' || status === 'pending_review' ? 'review' :
        status === 'approved' ? 'approved' :
        status === 'submitted' ? 'submitted' :
        isOverdue ? 'overdue' : 'pending'
      );
      expect(statusBadge).toBe('approved');
    });

    it('Test 4: delivered should map to approved badge', () => {
      const req = mockRequests.find(r => r.id === 'req-4');
      const status = req!.status;
      const isOverdue = false;

      const statusBadge = (
        status === 'in_progress' || status === 'pending_review' ? 'review' :
        status === 'approved' ? 'approved' :
        status === 'submitted' ? 'submitted' :
        isOverdue ? 'overdue' : 'pending'
      );
      expect(statusBadge).toBe('approved');
    });

    it('Test 4: Overdue request (not completed) should show overdue badge', () => {
      const req = mockRequests.find(r => r.id === 'req-3');
      const status = req!.status;
      const isOverdue = req!.slaDeadline! < new Date();

      const statusBadge = (
        status === 'in_progress' || status === 'pending_review' ? 'review' :
        status === 'approved' ? 'approved' :
        status === 'submitted' ? 'submitted' :
        isOverdue ? 'overdue' : 'pending'
      );
      expect(statusBadge).toBe('overdue');
    });
  });
});
