import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate date offsets
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursFromNow(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

async function main() {
  console.log('Seeding My Cases test data...');

  // Clean up existing test data
  await prisma.message.deleteMany({ where: { workspaceId: 'ws-an-phat' } });
  await prisma.legalRequest.deleteMany({ where: { workspaceId: 'ws-an-phat' } });
  await prisma.membership.deleteMany({ where: { workspaceId: 'ws-an-phat' } });
  await prisma.workspace.deleteMany({ where: { slug: 'an-phat' } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'seed-' } });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: 'ws-an-phat',
      name: 'Công ty An Phát',
      slug: 'an-phat',
    },
  });

  // Create customer user
  const customer = await prisma.user.create({
    data: {
      id: 'user-mai-phuong',
      name: 'Mai Phương',
      email: 'seed-mai-phuong@example.com',
      role: 'customer',
    },
  });

  // Create specialists
  const haLinh = await prisma.user.create({
    data: {
      id: 'user-ha-linh',
      name: 'Hà Linh',
      email: 'seed-ha-linh@example.com',
      role: 'specialist',
    },
  });

  const quangDung = await prisma.user.create({
    data: {
      id: 'user-quang-dung',
      name: 'Quang Dũng',
      email: 'seed-quang-dung@example.com',
      role: 'reviewer',
    },
  });

  const minhTrang = await prisma.user.create({
    data: {
      id: 'user-minh-trang',
      name: 'Minh Trang',
      email: 'seed-minh-trang@example.com',
      role: 'coordinator',
    },
  });

  const khanhAn = await prisma.user.create({
    data: {
      id: 'user-khanh-an',
      name: 'Khánh An',
      email: 'seed-khanh-an@example.com',
      role: 'specialist',
    },
  });

  // Create memberships
  await prisma.membership.createMany({
    data: [
      { userId: customer.id, workspaceId: workspace.id, role: 'customer' },
      { userId: haLinh.id, workspaceId: workspace.id, role: 'specialist' },
      { userId: quangDung.id, workspaceId: workspace.id, role: 'reviewer' },
      { userId: minhTrang.id, workspaceId: workspace.id, role: 'coordinator' },
      { userId: khanhAn.id, workspaceId: workspace.id, role: 'specialist' },
    ],
  });

  // Create 12 requests with various statuses
  const requests = [
    // Processing (3)
    {
      id: 'req-2026-021',
      code: 'REQ-2026-021',
      title: 'Rà soát hợp đồng dịch vụ',
      status: 'in_progress',
      assignedSpecialistId: haLinh.id,
      slaDeadline: hoursFromNow(5),
      updatedAt: daysAgo(0),
      createdAt: daysAgo(5),
    },
    {
      id: 'req-2026-020',
      code: 'REQ-2026-020',
      title: 'Tư vấn thuế quý 2',
      status: 'pending_review',
      assignedReviewerId: quangDung.id,
      slaDeadline: hoursFromNow(48),
      updatedAt: daysAgo(1),
      createdAt: daysAgo(6),
    },
    {
      id: 'req-2026-019',
      code: 'REQ-2026-019',
      title: 'Soạn phụ lục SLA',
      status: 'revision_required',
      assignedReviewerId: quangDung.id,
      slaDeadline: hoursFromNow(2),
      updatedAt: daysAgo(0),
      createdAt: daysAgo(7),
    },
    // Completed (8)
    {
      id: 'req-2026-018',
      code: 'REQ-2026-018',
      title: 'Tư vấn điều khoản bảo mật',
      status: 'delivered',
      assignedSpecialistId: minhTrang.id,
      slaDeadline: daysAgo(-2),
      updatedAt: daysAgo(1),
      createdAt: daysAgo(14),
    },
    {
      id: 'req-2026-017',
      code: 'REQ-2026-017',
      title: 'Review hợp đồng thuê mặt bằng',
      status: 'closed',
      assignedSpecialistId: haLinh.id,
      slaDeadline: daysAgo(-3),
      updatedAt: daysAgo(2),
      createdAt: daysAgo(12),
    },
    {
      id: 'req-2026-015',
      code: 'REQ-2026-015',
      title: 'Kiểm tra compliance GDPR',
      status: 'delivered',
      assignedReviewerId: quangDung.id,
      slaDeadline: daysAgo(-5),
      updatedAt: daysAgo(3),
      createdAt: daysAgo(10),
    },
    {
      id: 'req-2026-014',
      code: 'REQ-2026-014',
      title: 'Soạn thư xin cấp phép',
      status: 'delivered',
      assignedSpecialistId: khanhAn.id,
      slaDeadline: daysAgo(-4),
      updatedAt: daysAgo(4),
      createdAt: daysAgo(11),
    },
    {
      id: 'req-2026-013',
      code: 'REQ-2026-013',
      title: 'Review NDA đối tác',
      status: 'closed',
      assignedSpecialistId: minhTrang.id,
      slaDeadline: daysAgo(-6),
      updatedAt: daysAgo(5),
      createdAt: daysAgo(13),
    },
    {
      id: 'req-2026-011',
      code: 'REQ-2026-011',
      title: 'Tư vấn quy định lao động',
      status: 'delivered',
      assignedSpecialistId: haLinh.id,
      slaDeadline: daysAgo(-7),
      updatedAt: daysAgo(6),
      createdAt: daysAgo(15),
    },
    {
      id: 'req-2026-010',
      code: 'REQ-2026-010',
      title: 'Soạn biên bản họp',
      status: 'closed',
      assignedSpecialistId: quangDung.id,
      slaDeadline: daysAgo(-8),
      updatedAt: daysAgo(7),
      createdAt: daysAgo(16),
    },
    {
      id: 'req-2026-012',
      code: 'REQ-2026-012',
      title: 'Đăng ký nhãn hiệu',
      status: 'delivered',
      assignedSpecialistId: khanhAn.id,
      slaDeadline: daysAgo(-14),
      updatedAt: daysAgo(14),
      createdAt: daysAgo(21),
    },
    // Overdue (1)
    {
      id: 'req-2026-016',
      code: 'REQ-2026-016',
      title: 'Bổ sung giấy phép kinh doanh',
      status: 'revision_required',
      assignedSpecialistId: haLinh.id,
      slaDeadline: daysAgo(-1), // Overdue by 1 day
      updatedAt: daysAgo(3),
      createdAt: daysAgo(10),
    },
  ];

  // Create requests in database
  for (const req of requests) {
    await prisma.legalRequest.create({
      data: {
        ...req,
        workspaceId: workspace.id,
      },
    });
  }

  // Create unread messages for floating chat
  await prisma.message.createMany({
    data: [
      {
        workspaceId: workspace.id,
        senderId: haLinh.id,
        recipientId: customer.id,
        content: 'Đã cập nhật hồ sơ REQ-2026-021',
        isRead: false,
      },
      {
        workspaceId: workspace.id,
        senderId: quangDung.id,
        recipientId: customer.id,
        content: 'Cần phản hồi về SLA',
        isRead: false,
      },
    ],
  });

  console.log('My Cases seed completed:');
  console.log(`  - Workspace: ${workspace.name}`);
  console.log(`  - Customer: ${customer.name}`);
  console.log(`  - Specialists: 4`);
  console.log(`  - Requests: ${requests.length} (3 processing, 8 completed, 1 overdue)`);
  console.log(`  - Unread messages: 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
