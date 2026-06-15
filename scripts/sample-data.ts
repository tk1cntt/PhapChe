/**
 * Sample Data Seeder for Organizations
 * Run with: npx tsx scripts/sample-data.ts
 *
 * Creates sample data for all organizations to demonstrate dashboard functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OrgConfig {
  id: string;
  name: string;
  workspaces: Array<{
    name: string;
    slug: string;
    members: Array<{ email: string; name: string; role: string }>;
  }>;
  requestTitles: string[];
  businessArea: string;
}

const orgConfigs: OrgConfig[] = [
  {
    id: 'org-default-an-phat',
    name: 'An Phat Company',
    businessArea: 'manufacturing',
    workspaces: [
      {
        name: 'Legal Department',
        slug: 'an-phat-legal',
        members: [
          { email: 'nguyen.thi.mai@anphat.vn', name: 'Nguyen Thi Mai', role: 'owner' },
          { email: 'tran.van.son@anphat.vn', name: 'Tran Van Son', role: 'specialist' },
          { email: 'le.thi.linh@anphat.vn', name: 'Le Thi Linh', role: 'reviewer' },
          { email: 'pham.ngoc.hung@anphat.vn', name: 'Pham Ngoc Hung', role: 'customer' },
        ],
      },
      {
        name: 'HR Department',
        slug: 'an-phat-hr',
        members: [
          { email: 'hoang.thi.lan@anphat.vn', name: 'Hoang Thi Lan', role: 'owner' },
          { email: 'vu.thi.phuong@anphat.vn', name: 'Vu Thi Phuong', role: 'specialist' },
        ],
      },
    ],
    requestTitles: [
      'Hợp đồng lao động mới 2024',
      'NDA với đối tác ABC',
      'Phụ lục hợp đồng thuê văn phòng',
      'Điều lệ công ty sửa đổi',
      'Hợp đồng cung cấp nguyên liệu',
      'Biên bản thành lập chi nhánh',
      'Thỏa thuận bảo mật nhân viên',
      'Hợp đồng vận chuyển hàng hóa',
    ],
  },
  {
    id: 'org-minh-khang',
    name: 'Minh Khang Corp',
    businessArea: 'trading',
    workspaces: [
      {
        name: 'Corporate Legal',
        slug: 'minh-khang-legal',
        members: [
          { email: 'pham.quoc.viet@minhkhang.vn', name: 'Pham Quoc Viet', role: 'owner' },
          { email: 'do.thi.hien@minhkhang.vn', name: 'Do Thi Hien', role: 'specialist' },
          { email: 'bui.minh.tuan@minhkhang.vn', name: 'Bui Minh Tuan', role: 'reviewer' },
        ],
      },
      {
        name: 'Import/Export Legal',
        slug: 'minh-khang-trade',
        members: [
          { email: 'nguyen.thi.thu@minhkhang.vn', name: 'Nguyen Thi Thu', role: 'owner' },
          { email: 'dang.van.thanh@minhkhang.vn', name: 'Dang Van Thanh', role: 'specialist' },
          { email: 'phan.thi.mai@minhkhang.vn', name: 'Phan Thi Mai', role: 'viewer' },
        ],
      },
    ],
    requestTitles: [
      'Hợp đồng nhập khẩu hàng hóa',
      'Giấy phép kinh doanh xuất nhập khẩu',
      'NDA đối tác thương mại quốc tế',
      'Hợp đồng đại lý phân phối',
      'Tờ trình thành lập công ty con',
      'Hợp đồng logistics vận chuyển',
    ],
  },
  {
    id: 'org-tech-solutions',
    name: 'Tech Solutions VN',
    businessArea: 'technology',
    workspaces: [
      {
        name: 'Legal & Compliance',
        slug: 'tech-solutions-legal',
        members: [
          { email: 'le.van.tung@techsolutions.vn', name: 'Le Van Tung', role: 'owner' },
          { email: 'nguyen.thi.hang@techsolutions.vn', name: 'Nguyen Thi Hang', role: 'specialist' },
          { email: 'tran.quang.dat@techsolutions.vn', name: 'Tran Quang Dat', role: 'reviewer' },
          { email: 'vo.thi.nhu@techsolutions.vn', name: 'Vo Thi Nhu', role: 'coordinator_admin' },
        ],
      },
    ],
    requestTitles: [
      'Hợp đồng cung cấp phần mềm SaaS',
      'License agreement với khách hàng quốc tế',
      'NDA bảo vệ source code',
      'Hợp đồng bảo trì hệ thống',
      'Điều khoản sử dụng dịch vụ (Terms of Service)',
      'Privacy Policy cho ứng dụng di động',
      'Hợp đồng outsourcing phát triển',
      'Software escrow agreement',
      'Data processing agreement (DPA)',
    ],
  },
  {
    id: 'org-green-agriculture',
    name: 'Green Agriculture JSC',
    businessArea: 'agriculture',
    workspaces: [
      {
        name: 'Legal Affairs',
        slug: 'green-agri-legal',
        members: [
          { email: 'hoang.van.luc@greenagri.vn', name: 'Hoang Van Luc', role: 'owner' },
          { email: 'chu.thi.lien@greenagri.vn', name: 'Chu Thi Lien', role: 'specialist' },
        ],
      },
      {
        name: 'Land & Properties',
        slug: 'green-agri-land',
        members: [
          { email: 'mai.van.tuan@greenagri.vn', name: 'Mai Van Tuan', role: 'owner' },
          { email: 'nguyen.van.hai@greenagri.vn', name: 'Nguyen Van Hai', role: 'specialist' },
          { email: 'truong.thi.phuong@greenagri.vn', name: 'Truong Thi Phuong', role: 'viewer' },
        ],
      },
    ],
    requestTitles: [
      'Hợp đồng thuê đất nông nghiệp',
      'Giấy phép sử dụng nguồn nước',
      'Hợp đồng mua bán nông sản',
      'Đăng ký nhãn hiệu sản phẩm hữu cơ',
      'Hợp đồng hợp tác nông trại',
      'Giấy chứng nhận organic cho sản phẩm',
    ],
  },
  {
    id: 'org-inactive-demo',
    name: 'Inactive Demo Org',
    businessArea: 'demo',
    workspaces: [
      {
        name: 'Demo Workspace',
        slug: 'demo-workspace',
        members: [
          { email: 'demo.user@example.com', name: 'Demo User', role: 'owner' },
        ],
      },
    ],
    requestTitles: [
      'Demo request 1',
      'Demo request 2',
    ],
  },
];

const requestStatuses = [
  'draft_intake',
  'intake_submitted',
  'triage',
  'assigned',
  'in_progress',
  'pending_review',
  'revision_required',
  'approved',
  'delivered',
  'closed',
  'cancelled',
];

const priorityLevels = ['low', 'medium', 'high', 'urgent'];

async function createOrFindUser(email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`  ✓ Created user: ${email}`);
  }
  return user;
}

async function seedOrganizationData(config: OrgConfig) {
  console.log(`\nProcessing org: ${config.name} (${config.id})`);

  for (const wsConfig of config.workspaces) {
    console.log(`  Creating workspace: ${wsConfig.name}`);

    // Create workspace
    const workspace = await prisma.workspace.upsert({
      where: { slug: wsConfig.slug },
      update: { organizationId: config.id, isActive: config.id !== 'org-inactive-demo' },
      create: {
        name: wsConfig.name,
        slug: wsConfig.slug,
        organizationId: config.id,
        isActive: config.id !== 'org-inactive-demo',
      },
    });

    // Create members
    const members: Array<{ userId: string; role: string }> = [];
    for (const memberConfig of wsConfig.members) {
      const user = await createOrFindUser(memberConfig.email, memberConfig.name);
      const membership = await prisma.workspaceMembership.upsert({
        where: {
          userId_workspaceId_role: {
            userId: user.id,
            workspaceId: workspace.id,
            role: memberConfig.role,
          },
        },
        update: { isActive: true },
        create: {
          userId: user.id,
          workspaceId: workspace.id,
          role: memberConfig.role,
          isActive: true,
        },
      });
      members.push({ userId: user.id, role: memberConfig.role });
      console.log(`    ✓ Added member: ${memberConfig.email} (${memberConfig.role})`);
    }

    // Create legal requests
    const ownerMember = members.find(m => m.role === 'owner' || m.role === 'specialist');
    const creatorId = ownerMember?.userId || members[0]?.userId;

    if (creatorId) {
      const statusCount = Math.min(config.requestTitles.length, 10);
      for (let i = 0; i < config.requestTitles.length; i++) {
        const title = config.requestTitles[i];
        const status = requestStatuses[i % requestStatuses.length];
        const priority = priorityLevels[Math.floor(Math.random() * priorityLevels.length)];
        const hasSlaDeadline = ['in_progress', 'pending_review', 'assigned', 'triage'].includes(status);

        await prisma.legalRequest.upsert({
          where: { id: `req-${wsConfig.slug}-${String(i + 1).padStart(3, '0')}` },
          update: {},
          create: {
            id: `req-${wsConfig.slug}-${String(i + 1).padStart(3, '0')}`,
            workspaceId: workspace.id,
            title,
            status,
            priority,
            createdById: creatorId,
            slaDeadline: hasSlaDeadline
              ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
              : null,
            description: `Yêu cầu pháp lý cho ${config.name} - ${title}`,
          },
        });
      }
      console.log(`    ✓ Created ${config.requestTitles.length} legal requests`);
    }

    // Create sample vault folders (without files - VaultFile requires requestId)
    if (members.length > 0) {
      const vaultFolders = ['Contracts', 'Agreements', 'Certifications', 'Compliance'];
      for (const folderName of vaultFolders) {
        await prisma.folder.upsert({
          where: { id: `vf-${wsConfig.slug}-${folderName.toLowerCase()}` },
          update: {},
          create: {
            id: `vf-${wsConfig.slug}-${folderName.toLowerCase()}`,
            workspaceId: workspace.id,
            name_vi: folderName,
          },
        });
      }
      console.log(`    ✓ Created ${vaultFolders.length} vault folders`);
    }

    // Create audit logs
    if (creatorId) {
      const actions = [
        { action: 'request.created', targetType: 'request', description: 'Tạo yêu cầu pháp lý mới' },
        { action: 'request.status_changed', targetType: 'request', description: 'Thay đổi trạng thái yêu cầu' },
        { action: 'member.added', targetType: 'membership', description: 'Thêm thành viên mới' },
        { action: 'document.uploaded', targetType: 'vault_file', description: 'Tải lên tài liệu' },
        { action: 'request.assigned', targetType: 'assignment', description: 'Phân công chuyên viên xử lý' },
        { action: 'review.completed', targetType: 'review', description: 'Hoàn thành đánh giá' },
      ];

      for (let a = 0; a < 10; a++) {
        const action = actions[a % actions.length];
        await prisma.auditEvent.create({
          data: {
            workspaceId: workspace.id,
            actorId: creatorId,
            action: action.action,
            targetType: action.targetType,
            targetId: `entity-${wsConfig.slug}-${a + 1}`,
            metadataSummary: JSON.stringify({
              extra: `Sample data for ${config.name}`,
            }),
          },
        });
      }
      console.log(`    ✓ Created 10 audit log entries`);
    }
  }
}

async function main() {
  console.log('Starting sample data seeder...\n');

  // Clean up existing sample data in correct order (handle FK constraints)
  console.log('Cleaning up existing sample data...');

  // Delete in order respecting foreign key constraints
  await prisma.auditEvent.deleteMany({ where: { id: { startsWith: 'audit-' } } }).catch(() => {});
  await prisma.vaultFile.deleteMany({ where: { id: { startsWith: 'file-' } } }).catch(() => {});
  await prisma.folder.deleteMany({ where: { id: { startsWith: 'vf-' } } }).catch(() => {});
  await prisma.legalRequest.deleteMany({ where: { id: { startsWith: 'req-' } } }).catch(() => {});

  console.log('  Cleaned up existing data');

  // Seed each organization
  for (const config of orgConfigs) {
    try {
      await seedOrganizationData(config);
    } catch (error) {
      console.error(`Error seeding ${config.name}:`, error);
    }
  }

  // Print summary
  console.log('\n=== Sample Data Summary ===\n');

  const orgSummary = await Promise.all(
    orgConfigs.map(async (config) => {
      const workspaces = await prisma.workspace.findMany({
        where: { organizationId: config.id },
      });

      let totalMembers = 0;
      let totalRequests = 0;
      let totalFiles = 0;

      for (const ws of workspaces) {
        const memberCount = await prisma.workspaceMembership.count({
          where: { workspaceId: ws.id, isActive: true },
        });
        const requestCount = await prisma.legalRequest.count({
          where: { workspaceId: ws.id },
        });
        const fileCount = await prisma.vaultFile.count({
          where: { workspaceId: ws.id },
        });
        totalMembers += memberCount;
        totalRequests += requestCount;
        totalFiles += fileCount;
      }

      return {
        name: config.name,
        workspaces: workspaces.length,
        members: totalMembers,
        requests: totalRequests,
        files: totalFiles,
      };
    })
  );

  for (const s of orgSummary) {
    console.log(`${s.name}:`);
    console.log(`  - Workspaces: ${s.workspaces}`);
    console.log(`  - Members: ${s.members}`);
    console.log(`  - Requests: ${s.requests}`);
    console.log(`  - Vault Files: ${s.files}`);
    console.log();
  }

  console.log('Sample data seeding completed!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
