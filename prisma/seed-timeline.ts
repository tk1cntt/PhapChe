/**
 * Seed Timeline Data — WorkflowTransition, RequestAssignment, AuditEvent
 *
 * Tạo dữ liệu traceability thực tế cho các request demo:
 * - WorkflowTransition: lịch sử chuyển trạng thái
 * - RequestAssignment: lịch sử phân công chuyên viên / reviewer
 * - AuditEvent: các sự kiện audit quan trọng
 *
 * Mỗi request có 1 hành trình workflow hoàn chỉnh từ draft_intake → status hiện tại.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Config ───────────────────────────────────────────────────────

// Demo workspace
const WORKSPACE_ID = 'cmru2qwld00dm4wyomne4usoc';

// Demo user IDs (lấy từ seed kết quả)
const USERS = {
  superadmin: { id: 'cmru2qy8l00eb4wyo54vwnxn6', name: 'Quản trị viên Demo' },
  admin:     { id: 'cmru2qyt700eg4wyos1qxnu9h', name: 'Điều phối Demo' },
  specialist:{ id: 'cmru2r0vn00fb4wyony8wftkl', name: 'Chuyên viên Lao động Demo' },
  reviewer:  { id: 'cmru2qzkq00eq4wyo5p2z49jx', name: 'Reviewer Lao động Demo' },
  customer:  { id: 'cmru2r2nk00g34wyoarjep0s5', name: 'Khách hàng Demo' },
  customer2: { id: 'cmru2r31200g84wyolg7vnsk3', name: 'Khách hàng A Demo' },
  customer3: { id: 'cmru2r3dj00gd4wyod6lcc2ty', name: 'Khách hàng B Demo' },
};

// ── Workflow paths ───────────────────────────────────────────────

/** Đường đi workflow từ đầu đến status hiện tại */
const WORKFLOW_PATHS: Record<string, string[]> = {
  assigned:          ['draft_intake', 'triage', 'assigned'],
  in_progress:       ['draft_intake', 'triage', 'assigned', 'in_progress'],
  pending_review:    ['draft_intake', 'triage', 'assigned', 'in_progress', 'pending_review'],
  revision_required: ['draft_intake', 'triage', 'assigned', 'in_progress', 'pending_review', 'revision_required'],
  approved:          ['draft_intake', 'triage', 'assigned', 'in_progress', 'pending_review', 'approved'],
  delivered:         ['draft_intake', 'triage', 'assigned', 'in_progress', 'pending_review', 'approved', 'delivered'],
  closed:            ['draft_intake', 'triage', 'assigned', 'in_progress', 'pending_review', 'approved', 'delivered', 'closed'],
};

/** Actor cho từng transition (who performed the action) */
function transitionActor(fromStatus: string): keyof typeof USERS {
  if (fromStatus === 'draft_intake') return 'admin';        // Admin triages
  if (fromStatus === 'triage') return 'admin';               // Admin assigns
  if (fromStatus === 'assigned') return 'specialist';        // Specialist starts work
  if (fromStatus === 'in_progress') return 'specialist';     // Specialist submits for review
  if (fromStatus === 'pending_review') {
    // 50/50 reviewer hoặc admin tùy theo hành động
    return Math.random() > 0.5 ? 'reviewer' : 'admin';
  }
  if (fromStatus === 'revision_required') return 'specialist'; // Specialist re-submits
  if (fromStatus === 'approved') return 'admin';             // Admin delivers
  if (fromStatus === 'delivered') return 'customer';          // Customer closes
  return 'admin';
}

/** Lý do cho từng transition */
function transitionReason(fromStatus: string, toStatus: string, requestTitle: string): string | null {
  const reasons: Record<string, string[]> = {
    'draft_intake→triage': [
      'Đã kiểm tra thông tin intake — phân loại yêu cầu',
      'Phân loại xong, chuyển sang điều phối',
      'Intake hợp lệ, sẵn sàng điều phối',
    ],
    'triage→assigned': [
      'Phân công chuyên viên phụ trách lĩnh vực lao động',
      'Đã chọn chuyên viên phù hợp, bắt đầu xử lý',
      'Điều phối thành công sang chuyên viên',
    ],
    'assigned→in_progress': [
      'Chuyên viên đã nhận và bắt đầu xử lý',
      'Đã xem xét yêu cầu, bắt đầu soạn thảo',
      'Bắt đầu phân tích yêu cầu pháp lý',
    ],
    'in_progress→pending_review': [
      'Đã hoàn thành bản thảo, gửi kiểm duyệt',
      'Tài liệu đã sẵn sàng để review',
      'Gửi bản thảo lần 1 để reviewer kiểm tra',
    ],
    'in_progress→revision_required': [
      'Cần bổ sung điều khoản bảo mật',
      'Yêu cầu chỉnh sửa điều khoản thanh toán',
      'Bổ sung thêm phụ lục đính kèm',
    ],
    'pending_review→approved': [
      'Tài liệu đạt yêu cầu, phê duyệt',
      'Hồ sơ đầy đủ, chất lượng tốt — phê duyệt',
      'Đã kiểm tra kỹ, đồng ý phê duyệt',
    ],
    'pending_review→revision_required': [
      'Cần điều chỉnh điều khoản số 3',
      'Thiếu chữ ký số ở trang cuối',
      'Yêu cầu sửa lại phần phụ lục',
      'Bổ sung thêm điều khoản bảo hiểm',
    ],
    'revision_required→pending_review': [
      'Đã sửa theo yêu cầu, gửi lại kiểm duyệt',
      'Cập nhật bản thảo lần 2',
      'Hoàn thiện bổ sung, gửi duyệt lại',
    ],
    'approved→delivered': [
      'Đã gửi tài liệu cuối cùng cho khách hàng',
      'Bàn giao hồ sơ đầy đủ',
      'Giao tài liệu qua email + cổng thông tin',
    ],
    'delivered→closed': [
      'Khách hàng đã xác nhận và đóng yêu cầu',
      'Hoàn tất — khách hàng hài lòng',
      'Đã nhận phản hồi tích cực từ khách hàng',
    ],
  };

  const key = `${fromStatus}→${toStatus}`;
  const pool = reasons[key];
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Helpers ──────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600_0000);
}

function daysAgo(d: number, extraHours = 0): Date {
  return new Date(Date.now() - d * 86_400_000 - extraHours * 3600_0000);
}

// ── Main ─────────────────────────────────────────────────────────

async function seedTimeline() {
  console.log('🌱 Seeding timeline data...\n');

  // Lấy tất cả request demo (có assignedSpecialistId hoặc status ngoài draft_intake/triage)
  const requests = await prisma.legalRequest.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      status: { notIn: ['draft_intake', 'triage'] },
    },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      createdById: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Tìm thấy ${requests.length} request cần seed timeline\n`);

  let transitionCount = 0;
  let assignmentCount = 0;
  let auditCount = 0;

  for (const req of requests) {
    const path = WORKFLOW_PATHS[req.status];
    if (!path || path.length < 2) {
      console.log(`  ⚠ ${req.code || req.id.slice(-8)} — status "${req.status}" không có workflow path, bỏ qua`);
      continue;
    }

    const requestAgeDays = Math.max(1, Math.floor((Date.now() - req.createdAt.getTime()) / 86_400_000));
    // Spread transitions evenly across request's lifetime
    const totalSteps = path.length - 1;
    const hoursPerStep = Math.max(2, (requestAgeDays * 24) / (totalSteps + 1));

    // ── 1. WorkflowTransitions ──
    for (let i = 0; i < path.length - 1; i++) {
      const fromStatus = path[i];
      const toStatus = path[i + 1];
      const actorKey = transitionActor(fromStatus);
      const actor = USERS[actorKey];

      // Check if transition already exists
      const existing = await prisma.workflowTransition.findFirst({
        where: { requestId: req.id, fromStatus, toStatus },
      });
      if (existing) continue;

      const ts = new Date(Date.now() - (totalSteps - i) * hoursPerStep * 3600_0000);
      // Add some randomness to timestamps
      ts.setMinutes(ts.getMinutes() + Math.floor(Math.random() * 30));

      await prisma.workflowTransition.create({
        data: {
          requestId: req.id,
          fromStatus,
          toStatus,
          actorId: actor.id,
          reason: transitionReason(fromStatus, toStatus, req.title),
          metadata: { source: 'seed-timeline', automated: true },
          createdAt: ts,
        },
      });
      transitionCount++;

      // Create matching audit event
      await prisma.auditEvent.create({
        data: {
          actorId: actor.id,
          workspaceId: WORKSPACE_ID,
          action: `request.${toStatus}`,
          targetType: 'request',
          targetId: req.id,
          requestId: req.id,
          metadataSummary: `Trạng thái: ${fromStatus} → ${toStatus}`,
          createdAt: ts,
        },
      });
      auditCount++;
    }

    // ── 2. RequestAssignments ──

    // Specialist assignment (sau triage)
    const triageTransition = await prisma.workflowTransition.findFirst({
      where: { requestId: req.id, fromStatus: 'triage', toStatus: 'assigned' },
      orderBy: { createdAt: 'asc' },
    });

    if (req.assignedSpecialistId && triageTransition) {
      const existingAssignment = await prisma.requestAssignment.findFirst({
        where: { requestId: req.id, kind: 'specialist', isCurrent: true },
      });
      if (!existingAssignment) {
        await prisma.requestAssignment.create({
          data: {
            requestId: req.id,
            userId: req.assignedSpecialistId,
            kind: 'specialist',
            isCurrent: true,
            reason: 'Phân công chuyên viên phụ trách',
            createdById: USERS.admin.id,
            createdAt: triageTransition.createdAt,
          },
        });
        assignmentCount++;

        // Audit: assigned
        await prisma.auditEvent.create({
          data: {
            actorId: USERS.admin.id,
            workspaceId: WORKSPACE_ID,
            action: 'request.assigned',
            targetType: 'request',
            targetId: req.id,
            requestId: req.id,
            metadataSummary: `Phân công chuyên viên: ${USERS.specialist.name}`,
            createdAt: triageTransition.createdAt,
          },
        });
        auditCount++;
      }
    }

    // Reviewer assignment (khi vào pending_review)
    const reviewTransition = await prisma.workflowTransition.findFirst({
      where: { requestId: req.id, toStatus: { in: ['pending_review', 'revision_required', 'approved', 'delivered', 'closed'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (req.assignedReviewerId && reviewTransition) {
      const existingRevAssignment = await prisma.requestAssignment.findFirst({
        where: { requestId: req.id, kind: 'reviewer', isCurrent: true },
      });
      if (!existingRevAssignment) {
        await prisma.requestAssignment.create({
          data: {
            requestId: req.id,
            userId: req.assignedReviewerId,
            kind: 'reviewer',
            isCurrent: true,
            reason: 'Phân công người kiểm duyệt chất lượng',
            createdById: USERS.admin.id,
            createdAt: reviewTransition.createdAt,
          },
        });
        assignmentCount++;

        // Audit: reviewer assigned
        await prisma.auditEvent.create({
          data: {
            actorId: USERS.admin.id,
            workspaceId: WORKSPACE_ID,
            action: 'request.assigned',
            targetType: 'request',
            targetId: req.id,
            requestId: req.id,
            metadataSummary: `Phân công người kiểm duyệt: ${USERS.reviewer.name}`,
            createdAt: reviewTransition.createdAt,
          },
        });
        auditCount++;
      }
    }

    // ── 3. Additional audit events ──

    // Tạo audit event "request.created" nếu chưa có
    const existingCreateAudit = await prisma.auditEvent.findFirst({
      where: { requestId: req.id, action: 'request.created' },
    });
    if (!existingCreateAudit) {
      const creator = Object.values(USERS).find(u => u.id === req.createdById) || USERS.customer;
      await prisma.auditEvent.create({
        data: {
          actorId: req.createdById,
          workspaceId: WORKSPACE_ID,
          action: 'request.created',
          targetType: 'request',
          targetId: req.id,
          requestId: req.id,
          metadataSummary: `Tạo yêu cầu: ${req.title}`,
          createdAt: req.createdAt,
        },
      });
      auditCount++;
    }

    // Nếu là status cuối, tạo audit event "intake.submitted" sau request.created
    const existingIntakeAudit = await prisma.auditEvent.findFirst({
      where: { requestId: req.id, action: 'intake.submitted' },
    });
    if (!existingIntakeAudit) {
      await prisma.auditEvent.create({
        data: {
          actorId: req.createdById,
          workspaceId: WORKSPACE_ID,
          action: 'intake.submitted',
          targetType: 'request',
          targetId: req.id,
          requestId: req.id,
          metadataSummary: 'Khách hàng nộp yêu cầu tư vấn pháp lý đầy đủ thông tin',
          createdAt: new Date(req.createdAt.getTime() + 30_000), // 30s after creation
        },
      });
      auditCount++;
    }

    console.log(`  ✓ ${req.code || req.id.slice(-8)}: "${req.title}" — ${path.join(' → ')}`);
  }

  console.log(`\n✅ Seed hoàn tất:`);
  console.log(`   WorkflowTransitions: ${transitionCount}`);
  console.log(`   RequestAssignments:  ${assignmentCount}`);
  console.log(`   AuditEvents:         ${auditCount}`);
}

seedTimeline()
  .catch((err) => {
    console.error('❌ Seed thất bại:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
