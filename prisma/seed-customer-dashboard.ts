import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding customer dashboard data...');

  // Create or get workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'an-phat' },
    update: {},
    create: {
      name: 'Công ty An Phát',
      slug: 'an-phat',
      isActive: true,
    },
  });

  // Create or get customer user
  const customer = await prisma.user.upsert({
    where: { email: 'mai-phuong@anphat.vn' },
    update: {},
    create: {
      email: 'mai-phuong@anphat.vn',
      name: 'Mai Phương',
      isActive: true,
      emailVerified: true,
    },
  });

  // Create membership
  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId_role: { userId: customer.id, workspaceId: workspace.id, role: 'customer' } },
    update: {},
    create: {
      userId: customer.id,
      workspaceId: workspace.id,
      role: 'customer',
      isActive: true,
    },
  });

  // Create specialist users with ACTUAL names (these appear in UI)
  const specialistNames = ['Hà Linh', 'Quang Dũng', 'Minh Trang'];
  const specialists: string[] = [];
  for (const name of specialistNames) {
    const user = await prisma.user.upsert({
      where: { email: `${name.toLowerCase().replace(' ', '-')}@gitnexus.vn` },
      update: {},
      create: {
        email: `${name.toLowerCase().replace(' ', '-')}@gitnexus.vn`,
        name, // ACTUAL name stored in DB, used in UI
        isActive: true,
        emailVerified: true,
      },
    });
    specialists.push(user.id);

    await prisma.workspaceMembership.upsert({
      where: { userId_workspaceId_role: { userId: user.id, workspaceId: workspace.id, role: 'specialist' } },
      update: {},
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'specialist',
        isActive: true,
      },
    });
  }

  // Create 12 requests (3 processing, 8 completed, 1 overdue)
  // NOTE: assignedSpecialistId connects to actual specialist names in DB
  const requestData = [
    { id: 'req-2026-021', title: 'Rà soát hợp đồng dịch vụ', status: 'in_progress', specialistIdx: 0, daysAgo: 0 },
    { id: 'req-2026-020', title: 'Soạn thảo phụ lục SLA', status: 'pending_review', specialistIdx: 1, daysAgo: 0 },
    { id: 'req-2026-019', title: 'Tư vấn điều khoản bảo mật', status: 'delivered', specialistIdx: 2, daysAgo: 1 },
    { id: 'req-2026-016', title: 'Bổ sung giấy phép kinh doanh', status: 'revision_required', specialistIdx: 0, daysAgo: 2 },
    { id: 'req-2026-015', title: 'Review hợp đồng thuê văn phòng', status: 'closed', specialistIdx: 1, daysAgo: 3 },
    { id: 'req-2026-014', title: 'Tư vấn M&A', status: 'delivered', specialistIdx: 2, daysAgo: 5 },
    { id: 'req-2026-013', title: 'Kiểm tra tuân thủ GDPR', status: 'closed', specialistIdx: 0, daysAgo: 7 },
    { id: 'req-2026-012', title: 'Soạn NDA', status: 'delivered', specialistIdx: 1, daysAgo: 10 },
    { id: 'req-2026-011', title: 'Review IP rights', status: 'closed', specialistIdx: 2, daysAgo: 14 },
    { id: 'req-2026-010', title: 'Employment contract', status: 'closed', specialistIdx: 0, daysAgo: 20 },
    { id: 'req-2026-009', title: 'Vendor agreement', status: 'closed', specialistIdx: 1, daysAgo: 25 },
    { id: 'req-2026-008', title: 'Lease agreement', status: 'closed', specialistIdx: 2, daysAgo: 30 },
  ];

  for (const req of requestData) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - req.daysAgo);
    const updatedAt = new Date();
    updatedAt.setDate(updatedAt.getDate() - Math.floor(req.daysAgo / 2));

    await prisma.legalRequest.upsert({
      where: { id: req.id },
      update: {},
      create: {
        id: req.id,
        workspaceId: workspace.id,
        title: req.title,
        status: req.status,
        createdById: customer.id,
        assignedSpecialistId: specialists[req.specialistIdx],
        createdAt,
        updatedAt,
      },
    });
  }

  // Create 36 vault files
  for (let i = 0; i < 36; i++) {
    await prisma.vaultFile.create({
      data: {
        requestId: requestData[i % requestData.length].id,
        workspaceId: workspace.id,
        actorId: specialists[i % specialists.length],
        filename: `Hop-dong-${i + 1}.pdf`,
        size: Math.floor(Math.random() * 5000000) + 100000,
        contentType: 'application/pdf',
        createdAt: new Date(),
      },
    });
  }

  // Create audit events for timeline
  const auditActions = [
    'Chuyên viên đã phản hồi hồ sơ REQ-2026-019',
    'Tài liệu mới được thêm vào vault',
    'Hồ sơ REQ-2026-018 được duyệt',
    'Workspace scope được kiểm tra',
  ];

  for (let i = 0; i < 4; i++) {
    const createdAt = new Date();
    if (i === 0) createdAt.setMinutes(createdAt.getMinutes() - 12);
    else if (i === 1) createdAt.setMinutes(createdAt.getMinutes() - 38);
    else if (i === 2) createdAt.setHours(createdAt.getHours() - 2);
    else createdAt.setDate(createdAt.getDate() - 1);

    await prisma.auditEvent.create({
      data: {
        workspaceId: workspace.id,
        actorId: specialists[i % specialists.length],
        action: auditActions[i],
        targetType: 'request',
        targetId: requestData[i % requestData.length].id,
        createdAt,
      },
    });
  }

  // Create 2 unread messages for floating chat notification (per CUST-DASH-10 and CONTEXT.md: "2 Tin moi")
  await prisma.message.create({
    data: {
      workspaceId: workspace.id,
      senderId: specialists[0], // Hà Linh
      recipientId: customer.id,
      content: 'Cảm ơn bạn đã gửi yêu cầu. Chúng tôi đang xem xét.',
      isRead: false,
      createdAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      workspaceId: workspace.id,
      senderId: specialists[1], // Quang Dũng
      recipientId: customer.id,
      content: 'Yêu cầu của bạn đã được tiếp nhận. Chúng tôi sẽ phản hồi trong 24 giờ.',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
  });

  console.log('Seed complete: 12 requests, 36 vault files, 4 audit events, 2 unread messages');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
