/**
 * Add more diverse data to enrich the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDiverseData() {
  console.log('=== Adding Diverse Data ===\n');

  // Get existing entities
  const org = await prisma.organization.findFirst();
  if (!org) { console.log('No organization found'); return; }

  const workspaces = await prisma.workspace.findMany({ take: 5 });
  const partners = await prisma.partner.findMany({ take: 10 });
  const users = await prisma.user.findMany({ take: 10 });
  const existingReqs = await prisma.legalRequest.findMany({ take: 20 });

  console.log(`Organization: ${org.name}`);
  console.log(`Workspaces: ${workspaces.length}`);
  console.log(`Partners: ${partners.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Existing Requests: ${existingReqs.length}`);

  // Add more partners (no organizationId - partners don't have org FK)
  console.log('\n--- Adding Partners ---');
  const newPartners = [
    { name: 'Công ty Luật ABC', slug: 'cong-ty-luat-abc', type: 'law_firm', contactEmail: 'contact@luatabc.vn', phone: '02812345678', address: '123 Nguyễn Huệ, Q.1, TP.HCM' },
    { name: 'Lawyers Vietnam Co.', slug: 'lawyers-vietnam', type: 'law_firm', contactEmail: 'info@lawyersvn.com', phone: '02887654321', address: '456 Lê Lợi, Q.1, TP.HCM' },
    { name: 'VPBank Legal Services', slug: 'vpbank-legal', type: 'consultancy', contactEmail: 'legal@vpbank.com.vn', phone: '02412345678', address: '89 Phố Điện Biên Phủ, Hà Nội' },
    { name: 'LGA Vietnam', slug: 'lga-vietnam', type: 'law_firm', contactEmail: 'lga@lga.vn', phone: '02834567890', address: '321 Đồng Khởi, Q.1, TP.HCM' },
    { name: 'Legal House VN', slug: 'legal-house-vn', type: 'law_firm', contactEmail: 'advisory@legalhouse.vn', phone: '02898765432', address: '555 Cái Khế, Q.Ninh Kiều, Cần Thơ' },
  ];

  let partnerCount = 0;
  for (const p of newPartners) {
    try {
      await prisma.partner.create({ data: p });
      console.log(`  + ${p.name}`);
      partnerCount++;
    } catch (e) {
      console.log(`  ! ${p.name}: ${(e as Error).message}`);
    }
  }

  // Add more users (no organizationId - use slug)
  console.log('\n--- Adding Users ---');
  const newUsers = [
    { name: 'Nguyễn Văn Minh', slug: 'nguyen-van-minh-2', email: 'minh.nguyen2@minhkhang.vn', role: 'partner', phone: '0901234561', title: 'Managing Partner' },
    { name: 'Trần Thị Lan', slug: 'tran-thi-lan-2', email: 'lan.tran2@minhkhang.vn', role: 'partner', phone: '0901234562', title: 'Senior Associate' },
    { name: 'Lê Hoàng Nam', slug: 'le-hoang-nam-2', email: 'nam.hoang2@minhkhang.vn', role: 'partner', phone: '0901234563', title: 'Legal Consultant' },
    { name: 'Phạm Quốc Hùng', slug: 'pham-quoc-hung-2', email: 'hung.pham2@minhkhang.vn', role: 'admin', phone: '0901234564', title: 'System Administrator' },
    { name: 'Vũ Thị Mai', slug: 'vu-thi-mai-2', email: 'mai.vu2@minhkhang.vn', role: 'partner', phone: '0901234565', title: 'Junior Associate' },
  ];

  let userCount = 0;
  for (const u of newUsers) {
    try {
      await prisma.user.create({ data: u });
      console.log(`  + ${u.name}`);
      userCount++;
    } catch (e) {
      console.log(`  ! ${u.name}: ${(e as Error).message}`);
    }
  }

  // Add more legal requests with variety
  console.log('\n--- Adding Legal Requests ---');
  const matterTypes = [
    'contract_review',
    'trademark_registration',
    'litigation_support',
    'labor_law',
    'tax_advisory',
    'm&a_advisory',
    'regulatory_compliance',
    'ip_protection',
  ];

  const requestTitles = [
    'Hợp đồng hợp tác kinh doanh với đối tác Nhật Bản',
    'Đăng ký nhãn hiệu cho sản phẩm mới',
    'Soạn thảo hợp đồng lao động cho 50 nhân viên',
    'Tư vấn thuế thu nhập doanh nghiệp',
    'Rà soát hợp đồng mua bán hàng hóa',
    'Thủ tục cấp phép kinh doanh bổ sung',
    'Tư vấn sáp nhập công ty con',
    'Đăng ký bảo hộ quyền sở hữu trí tuệ',
    'Soạn thảo NDA với nhà cung cấp',
    'Kiểm tra tuân thủ GDPR cho dữ liệu khách hàng',
    'Hợp đồng thuê văn phòng mới',
    'Tư vấn cổ phần hóa doanh nghiệp nhà nước',
    'Giấy phép xuất khẩu cho sản phẩm nông nghiệp',
    'Thủ tục phá sản theo luật mới',
    'Đại diện tranh tụng tại tòa án nhân dân',
  ];

  const statuses = ['submitted', 'assigned', 'in_progress', 'review', 'completed'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  const reqCodes = existingReqs.map(r => r.code).filter(Boolean);
  let nextCode = Math.max(0, ...reqCodes.map(c => {
    const match = c?.match(/REQ-2026-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  })) + 1;

  const reqCount = 0;
  for (let i = 0; i < 15; i++) {
    if (!workspaces[i % workspaces.length]) continue;

    const ws = workspaces[i % workspaces.length];
    const partner = partners[i % partners.length];
    const createdByUser = users[i % users.length];

    try {
      const req = await prisma.legalRequest.create({
        data: {
          workspaceId: ws.id,
          assignedPartnerId: partner?.id,
          createdById: createdByUser.id,
          title: requestTitles[i],
          code: `REQ-2026-${String(nextCode++).padStart(3, '0')}`,
          matterType: matterTypes[i % matterTypes.length],
          priority: priorities[i % priorities.length],
          status: statuses[i % statuses.length],
          description: `Yêu cầu pháp lý về ${requestTitles[i].toLowerCase()}`,
        }
      });

      // Add assignment
      if (createdByUser) {
        await prisma.requestAssignment.create({
          data: {
            requestId: req.id,
            userId: createdByUser.id,
            role: 'specialist',
          }
        }).catch(() => {});
      }

      console.log(`  + ${req.code}: ${req.title.slice(0, 40)}...`);
    } catch (e) {
      console.log(`  ! Request ${i}: ${(e as Error).message}`);
    }
  }

  // Add more audit events
  console.log('\n--- Adding Audit Events ---');
  const auditActions = [
    'request.created',
    'request.assigned',
    'request.status_changed',
    'document.uploaded',
    'document.viewed',
    'comment.added',
    'review.completed',
    'workflow.transition',
  ];

  let auditCount = 0;
  for (let i = 0; i < 30; i++) {
    const req = existingReqs[i % existingReqs.length];
    const user = users[i % users.length];
    const action = auditActions[i % auditActions.length];

    try {
      await prisma.auditEvent.create({
        data: {
          userId: user?.id,
          action,
          entityType: 'request',
          entityId: req?.id,
          metadata: {
            ip: `192.168.1.${100 + (i % 50)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            details: `Action: ${action}`,
          },
        }
      });
      auditCount++;
    } catch (e) {
      // Skip if audit event fails
    }
  }
  console.log(`  + ${auditCount} audit events`);

  console.log('\n=== Summary ===');
  console.log(`  Partners added: ${partnerCount}`);
  console.log(`  Users added: ${userCount}`);
  console.log('\nFinal counts:');
  console.log(`  Partners: ${await prisma.partner.count()}`);
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Requests: ${await prisma.legalRequest.count()}`);
  console.log(`  Audit events: ${await prisma.auditEvent.count()}`);
}

addDiverseData().catch(console.error).finally(() => prisma.$disconnect());
