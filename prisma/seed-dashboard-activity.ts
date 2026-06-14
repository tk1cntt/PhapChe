import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed dashboard activity data (AuditEvents) for realistic timeline display
 * This provides sample activities that match the mock UI format:
 * - "Chuyên viên đã phản hồi hồ sơ REQ-2026-019"
 * - "Quang Dũng yêu cầu bạn xác nhận nội dung phụ lục SLA."
 */
async function seedDashboardActivity() {
  console.log('Seeding dashboard activity data...');

  // Get demo workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-legal-workspace' },
  });

  if (!workspace) {
    console.log('Demo workspace not found, skipping dashboard activity seed');
    return;
  }

  // Get sample users for actor names
  const specialistUser = await prisma.user.findFirst({
    where: { email: 'specialist.demo@example.test' },
  });

  const customerUser = await prisma.user.findFirst({
    where: { email: 'customer.demo@example.test' },
  });

  const reviewerUser = await prisma.user.findFirst({
    where: { email: 'reviewer.demo@example.test' },
  });

  // Get sample legal requests with codes
  const requests = await prisma.legalRequest.findMany({
    where: { workspaceId: workspace.id },
    take: 5,
    orderBy: { updatedAt: 'desc' },
  });

  // Sample activities with realistic Vietnamese descriptions
  const activities = [
    {
      action: 'Chuyên viên đã phản hồi hồ sơ',
      targetType: 'request',
      requestId: requests[0]?.id,
      metadataSummary: 'Yêu cầu bạn xác nhận nội dung phụ lục SLA.',
      actorId: specialistUser?.id,
      minutesAgo: 12,
    },
    {
      action: 'Tài liệu mới được thêm vào vault',
      targetType: 'document',
      requestId: requests[0]?.id,
      metadataSummary: 'Phụ lục SLA v1.0 đã được tải lên.',
      actorId: specialistUser?.id,
      minutesAgo: 45,
    },
    {
      action: 'Hồ sơ được gửi để review',
      targetType: 'request',
      requestId: requests[1]?.id,
      metadataSummary: 'Chờ reviewer phê duyệt nội dung hợp đồng thuê nhà.',
      actorId: specialistUser?.id,
      minutesAgo: 120,
    },
    {
      action: 'Khách hàng đã tạo yêu cầu mới',
      targetType: 'request',
      requestId: requests[2]?.id,
      metadataSummary: 'Yêu cầu soạn thảo NDA công ty ABC.',
      actorId: customerUser?.id,
      minutesAgo: 180,
    },
    {
      action: 'Reviewer đã xác nhận hoàn tất',
      targetType: 'request',
      requestId: requests[3]?.id,
      metadataSummary: 'Điều lệ công ty đã được phê duyệt.',
      actorId: reviewerUser?.id,
      minutesAgo: 360,
    },
    {
      action: 'Chuyên viên đã cập nhật tài liệu',
      targetType: 'document',
      requestId: requests[0]?.id,
      metadataSummary: 'Hợp đồng lao động đã được chỉnh sửa theo yêu cầu.',
      actorId: specialistUser?.id,
      minutesAgo: 720,
    },
    {
      action: 'Yêu cầu được tiếp nhận',
      targetType: 'request',
      requestId: requests[4]?.id,
      metadataSummary: 'Hệ thống đã tiếp nhận yêu cầu và đang chờ phân công.',
      actorId: null,
      minutesAgo: 1440,
    },
  ];

  // Clear existing activities for demo workspace (optional - comment out to preserve)
  // await prisma.auditEvent.deleteMany({
  //   where: { workspaceId: workspace.id },
  // });

  // Create activities with timestamps
  for (const activity of activities) {
    const createdAt = new Date(Date.now() - activity.minutesAgo * 60 * 1000);

    // Check if similar activity exists (by action + requestId + time window)
    const existing = await prisma.auditEvent.findFirst({
      where: {
        workspaceId: workspace.id,
        action: activity.action,
        requestId: activity.requestId ?? undefined,
        createdAt: {
          gte: new Date(createdAt.getTime() - 5 * 60 * 1000), // Within 5 minutes
          lte: new Date(createdAt.getTime() + 5 * 60 * 1000),
        },
      },
    });

    if (!existing) {
      await prisma.auditEvent.create({
        data: {
          workspaceId: workspace.id,
          action: activity.action,
          targetType: activity.targetType,
          targetId: activity.requestId || `target-${Date.now()}`,
          requestId: activity.requestId ?? null,
          actorId: activity.actorId,
          metadataSummary: activity.metadataSummary,
          createdAt,
        },
      });
    }
  }

  console.log(`✓ Dashboard activity data seeded`);
}

seedDashboardActivity()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
