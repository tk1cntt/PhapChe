/**
 * Seed script for Partner sample data
 * Run: node scripts/seed-partner-requests.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding partner sample data...');

  // 1. Create Partners
  const partners = await Promise.all([
    prisma.partner.upsert({
      where: { slug: 'luat-su-tran' },
      update: {},
      create: {
        name: 'Luật Sư Trần & Partners',
        slug: 'luat-su-tran',
        type: 'law_firm',
        contactEmail: 'contact@tranlaw.vn',
        phone: '0901234567',
        address: '123 Nguyễn Trãi, Q.1, TP.HCM',
        status: 'active',
      },
    }),
    prisma.partner.upsert({
      where: { slug: 'tu-van-phap-ly-mien-bac' },
      update: {},
      create: {
        name: 'Tư Vấn Pháp Lý Miền Bắc',
        slug: 'tu-van-phap-ly-mien-bac',
        type: 'consultancy',
        contactEmail: 'info@tuvanplmb.vn',
        phone: '02412345678',
        address: '45 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
        status: 'active',
      },
    }),
    prisma.partner.upsert({
      where: { slug: 'cong-ty-abc' },
      update: {},
      create: {
        name: 'Công Ty ABC',
        slug: 'cong-ty-abc',
        type: 'law_firm',
        contactEmail: 'contact@abclaw.vn',
        phone: '02812345678',
        address: '78 Lê Lợi, Q.3, TP.HCM',
        status: 'active',
      },
    }),
  ]);

  console.log('Created partners:', partners.length);

  // 2. Get existing workspaces
  const workspaces = await prisma.workspace.findMany({ take: 2 });
  if (workspaces.length === 0) {
    console.log('No workspaces found. Creating sample workspace...');
    const workspace = await prisma.workspace.create({
      data: {
        name: 'An Phat Company',
        slug: 'an-phat',
        type: 'company',
        status: 'active',
      },
    });
    workspaces.push(workspace);
  }

  // 3. Get existing users or create one
  let users = await prisma.user.findMany({ take: 3 });
  if (users.length === 0) {
    console.log('No users found. Creating sample user...');
    const user = await prisma.user.create({
      data: {
        email: 'sample.customer@example.test',
        name: 'Sample Customer',
        emailVerified: new Date(),
      },
    });
    users.push(user);
  }

  // 4. Ensure user has workspace membership
  const customerUser = users[0];
  let membership = await prisma.workspaceMembership.findFirst({
    where: { userId: customerUser.id },
  });

  if (!membership && workspaces.length > 0) {
    membership = await prisma.workspaceMembership.create({
      data: {
        userId: customerUser.id,
        workspaceId: workspaces[0].id,
        role: 'customer',
        isActive: true,
      },
    });
    console.log('Created membership for customer');
  }

  // 5. Create Legal Requests with assigned partners
  const requestTitles = [
    {
      title: 'Hợp đồng lao động cho nhân viên mới',
      description: 'Cần soạn 5 hợp đồng lao động cho nhân viên mới tuyển dụng tháng này',
      matterType: 'lao_dong',
    },
    {
      title: 'Thủ tục ly hôn',
      description: 'Tư vấn và hỗ trợ thủ tục ly hôn cho nhân viên',
      matterType: 'ho_khau',
    },
    {
      title: 'Hợp đồng mua bán tài sản',
      description: 'Soạn hợp đồng mua bán máy móc thiết bị với đối tác',
      matterType: 'mua_ban',
    },
    {
      title: 'Giải quyết tranh chấp hợp đồng',
      description: 'Tranh chấp với nhà cung cấp về chất lượng hàng hóa',
      matterType: 'tranh_chap',
    },
    {
      title: 'Đăng ký nhãn hiệu',
      description: 'Hỗ trợ đăng ký nhãn hiệu sản phẩm mới',
      matterType: 'so_huu_tri_tue',
    },
    {
      title: 'Tư vấn thuế doanh nghiệp',
      description: 'Hỗ trợ tư vấn các vấn đề thuế cho công ty',
      matterType: 'thue',
    },
  ];

  const statuses = ['submitted', 'in_progress', 'pending_review', 'approved', 'delivered'];

  let createdCount = 0;
  for (let i = 0; i < requestTitles.length; i++) {
    const partnerIndex = i % partners.length;
    const status = statuses[i % statuses.length];

    await prisma.legalRequest.create({
      data: {
        workspaceId: workspaces[0].id,
        title: requestTitles[i].title,
        description: requestTitles[i].description,
        matterType: requestTitles[i].matterType,
        status: status,
        priority: i < 2 ? 'HIGH' : 'MEDIUM',
        createdById: customerUser.id,
        assignedPartnerId: partners[partnerIndex].id,
        slaDeadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      },
    });
    createdCount++;
    console.log(`Created: ${requestTitles[i].title} -> Partner: ${partners[partnerIndex].name}`);
  }

  console.log('\n=== Seed Summary ===');
  console.log(`Partners: ${partners.length}`);
  console.log(`Requests created: ${createdCount}`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
