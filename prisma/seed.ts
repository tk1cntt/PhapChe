import { SEED_MATTER_TYPES, SEED_FOLDERS, SEED_TAGS, SEED_VERSION, SEED_METADATA } from '../src/lib/i18n/seed-multilingual';
import { auth } from '../src/auth';
import { seedAll } from './seed/index';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '@better-auth/utils/password';

// NOTE: For seed scripts, using the singleton prisma is acceptable.
// Seed scripts are short-lived processes that run standalone.
// For production, this is fine as the singleton manages connection pooling.

const seedUsers: { email: string; name: string; password: string; role: 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin' | 'super_admin' }[] = [
  // Admin roles
  { email: 'superadmin.demo@example.test', name: 'Quan tri vien Demo', password: 'Demo@123456', role: 'super_admin' },
  { email: 'admin.demo@example.test', name: 'Dieu phoi Demo', password: 'Demo@123456', role: 'coordinator_admin' },
  { email: 'audit.demo@example.test', name: 'Kiem toan Demo', password: 'Demo@123456', role: 'coordinator_admin' },
  // Reviewer roles
  { email: 'reviewer.demo@example.test', name: 'Reviewer Lao dong Demo', password: 'Demo@123456', role: 'reviewer' },
  { email: 'reviewer2.demo@example.test', name: 'Reviewer Thuong mai Demo', password: 'Demo@123456', role: 'reviewer' },
  { email: 'reviewer3.demo@example.test', name: 'Reviewer Bat dong san Demo', password: 'Demo@123456', role: 'reviewer' },
  // Specialist roles
  { email: 'specialist.demo@example.test', name: 'Chuyen vien Lao dong Demo', password: 'Demo@123456', role: 'specialist' },
  { email: 'specialist2.demo@example.test', name: 'Chuyen vien Thuong mai Demo', password: 'Demo@123456', role: 'specialist' },
  { email: 'specialist3.demo@example.test', name: 'Chuyen vien Bat dong san Demo', password: 'Demo@123456', role: 'specialist' },
  { email: 'specialist4.demo@example.test', name: 'Chuyen vien So huu tri tue Demo', password: 'Demo@123456', role: 'specialist' },
  // Customer roles
  { email: 'customer.demo@example.test', name: 'Khach hang Demo', password: 'Demo@123456', role: 'customer' },
  { email: 'customer2.demo@example.test', name: 'Khach hang A Demo', password: 'Demo@123456', role: 'customer' },
  { email: 'customer3.demo@example.test', name: 'Khach hang B Demo', password: 'Demo@123456', role: 'customer' },
  { email: 'customer4.demo@example.test', name: 'Khach hang C Demo', password: 'Demo@123456', role: 'customer' },
  { email: 'customer5.demo@example.test', name: 'Khach hang D Demo', password: 'Demo@123456', role: 'customer' },
];

const routingCapability = {
  workspaceSlug: 'demo-legal-workspace',
  matterTypeKey: 'labor_contract',
};

async function ensureUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Check if password already exists in Account table
    const existingAccount = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: 'credential' },
    });
    if (!existingAccount) {
      // Create Account directly with hashed password for better-auth
      const hashedPassword = await hashPassword(password);
      await prisma.account.create({
        data: {
          userId: existing.id,
          accountId: email, // better-auth uses email as accountId for credential provider
          providerId: 'credential',
          password: hashedPassword,
        },
      });
      console.log(`  Created Account for ${email}`);
    }
    return existing;
  }
  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      emailVerified: true, // Mark as verified for demo users
    },
  });

  // Create Account with hashed password using better-auth's hashPassword
  const hashedPassword = await hashPassword(password);
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: email,
      providerId: 'credential',
      password: hashedPassword,
    },
  });
  console.log(`  Created user ${email} with Account`);

  return user;
}

async function createSession(userId: string) {
  // Create session directly in database
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

async function seedMultiTenantData() {
  console.log('Seeding multi-tenant data...');

  // Create single shared platform tenant (MVP — one tenant for all customers)
  // See: docs/shared_customer_partner_collaboration.md §5.1
  const platformTenant = await prisma.tenant.upsert({
    where: { id: 'platform-tenant' },
    update: {},
    create: {
      id: 'platform-tenant',
      name: 'GitNexus Platform',
      code: 'shared_platform',
      mode: 'shared_platform',
      settings: JSON.stringify({
        requireMfa: false,
        defaultLanguage: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
      }),
    },
  });
  console.log('  ✓ Platform tenant:', platformTenant.id, `(mode: ${platformTenant.mode})`);

  // Create default organization for platform
  const defaultOrg = await prisma.organization.upsert({
    where: { id: 'platform-default-org' },
    update: {},
    create: {
      id: 'platform-default-org',
      tenantId: platformTenant.id,
      name: 'Default Organization',
      businessType: 'platform_internal',
      status: 'active',
      isDefault: true,
    },
  });
  console.log('  ✓ Default organization:', defaultOrg.id);

  return { platformTenant, defaultOrg };
}

async function seedPartnerData() {
  console.log('Seeding partner data...');

  // Create a sample partner
  const samplePartner = await prisma.partner.upsert({
    where: { id: 'partner-demo' },
    update: {},
    create: {
      id: 'partner-demo',
      name: 'Demo Law Firm',
      slug: 'demo-law-firm',
      type: 'law_firm',
      contactEmail: 'contact@demo-law.test',
      phone: '+84-28-1234-5678',
      address: '123 Nguyen Hue, District 1, HCMC',
      status: 'active',
    },
  });
  console.log('  ✓ Sample partner:', samplePartner.id);

  return { samplePartner };
}

async function seedEngagementData() {
  console.log('Seeding engagement data...');

  // Create sample service types
  const serviceTypes = [
    { key: 'labor_contract', name: 'Labor Contract Review', description: 'Review and draft labor contracts' },
    { key: 'trademark_registration', name: 'Trademark Registration', description: 'Assist with trademark registration process' },
    { key: 'company_formation', name: 'Company Formation', description: 'Legal support for company establishment' },
    { key: 'compliance_review', name: 'Compliance Review', description: 'Review business compliance requirements' },
    { key: 'contract_negotiation', name: 'Contract Negotiation', description: 'Negotiate and finalize contracts' },
  ];

  for (const st of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { key: st.key },
      update: {},
      create: {
        key: st.key,
        name: st.name,
        description: st.description,
        isActive: true,
      },
    });
  }
  console.log('  ✓ Sample service types:', serviceTypes.length);

  return { serviceTypes };
}

async function seedAnPhatWorkspace(orgId: string) {
  // Phase 30: Workspace page seed data - "Cong ty An Phat" workspace
  const anPhatWorkspace = await prisma.workspace.upsert({
    where: { slug: 'an-phat' },
    update: { isActive: true },
    create: {
      name: 'Cong ty An Phat',
      slug: 'an-phat',
      isActive: true,
      organizationId: orgId,
    },
  });

  // Create 4 sample members for an-phat workspace
  const anPhatUsers = [
    { email: 'mai.phuong@anphat.vn', name: 'Mai Phuong', role: 'owner' },
    { email: 'linh.anh@anphat.vn', name: 'Linh Anh', role: 'finance' },
    { email: 'trang.van@anphat.vn', name: 'Van Trang', role: 'viewer' },
    { email: 'nam.hoang@anphat.vn', name: 'Nam Hoang', role: 'customer' },
  ];

  for (const userData of anPhatUsers) {
    // Try to create user via signUpEmail, or skip if exists
    let user = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!user) {
      try {
        const { user: newUser } = await auth.api.signUpEmail({
          body: { email: userData.email, name: userData.name, password: 'AnPhat@123456' },
        });
        user = await prisma.user.findUniqueOrThrow({ where: { id: newUser.id } });
      } catch {
        // User might already exist, find by email
        user = await prisma.user.findUnique({ where: { email: userData.email } });
        if (!user) {
          console.warn(`Could not create user ${userData.email}, skipping membership`);
          continue;
        }
      }
    }

    const isActive = userData.role !== 'customer'; // 'customer' role means invited (not active yet)
    await prisma.workspaceMembership.upsert({
      where: {
        userId_workspaceId: { userId: user.id, workspaceId: anPhatWorkspace.id },
      },
      update: { isActive },
      create: {
        userId: user.id,
        workspaceId: anPhatWorkspace.id,
        role: userData.role,
        isActive,
      },
    });
  }

  // Create 12 sample legal requests for an-phat workspace
  const customerUser = await prisma.user.findUnique({ where: { email: 'mai.phuong@anphat.vn' } });
  if (customerUser) {
    const statuses = ['in_progress', 'pending_review', 'approved', 'draft_intake', 'in_progress', 'pending_review', 'in_progress', 'approved', 'draft_intake', 'pending_review', 'in_progress', 'approved'];
    const titles = [
      'Hop dong thue nha',
      'NDA cong ty ABC',
      'Phu luc hop dong',
      'Hop dong lao dong',
      'Dieu le cong ty',
      'Bien ban thanh lap',
      'Hop dong dai ly',
      'Phu luc NDA',
      'Thoa thuan mat gio',
      'Hop dong ky gui',
      'Phu luc hop dong xyz',
      'Dieu khoan bao mat',
    ];

    const matterTypes = [
      'contract_drafting', 'nda', 'contract_drafting', 'labor_contract',
      'corporate_governance', 'incorporation', 'agency_contract', 'nda',
      'internal_regulation', 'distribution_contract', 'contract_drafting', 'nda',
    ];

    const slaDaysForRequest = [3, 5, 7, 10, 14, 3, 5, 7, 10, 14, 3, 5];
    for (let i = 0; i < 12; i++) {
      const slaDeadline = new Date();
      slaDeadline.setDate(slaDeadline.getDate() + slaDaysForRequest[i]);
      await prisma.legalRequest.upsert({
        where: { id: `req-anphat-${String(i + 1).padStart(3, '0')}` },
        update: { matterType: matterTypes[i], slaDeadline },
        create: {
          id: `req-anphat-${String(i + 1).padStart(3, '0')}`,
          workspaceId: anPhatWorkspace.id,
          title: titles[i] || `Yeu cau ${i + 1}`,
          matterType: matterTypes[i],
          status: statuses[i] || 'draft_intake',
          slaDeadline,
          createdById: customerUser.id,
        },
      });
    }
  }

  console.log('Phase 30: An Phat workspace seeded with 4 members, 12 requests');
}

async function main() {
  // Seed foundation data (Plan 73-01)
  await seedAll(prisma);

  // Seed multi-tenant data (Phase 58)
  await seedMultiTenantData();

  // Seed partner data (Phase 59)
  await seedPartnerData();

  // Seed engagement data (Phase 60)
  await seedEngagementData();

  // Seed Phase 30: An Phat workspace
  const anPhatOrg = await prisma.organization.findFirst({ where: { name: { startsWith: 'Công ty Luật' } } });
  await seedAnPhatWorkspace(anPhatOrg?.id ?? 'platform-default-org');

  const workspace = await prisma.workspace.upsert({
    where: { slug: routingCapability.workspaceSlug },
    update: { isActive: true },
    create: {
      name: 'Demo Legal Workspace',
      slug: routingCapability.workspaceSlug,
      isActive: true,
      organizationId: anPhatOrg?.id ?? 'platform-default-org',
    },
  });

  console.log(`Seeding MatterTypes v${SEED_VERSION}...`);

  for (const [key, matterType] of Object.entries(SEED_MATTER_TYPES)) {
    await prisma.matterType.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key } },
      update: {
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
      create: {
        workspaceId: workspace.id,
        key,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(SEED_MATTER_TYPES).length} MatterTypes seeded (labels in src/messages/)`);

  console.log('Seeding Folders...');

  for (const [key, folder] of Object.entries(SEED_FOLDERS)) {
    const existing = await prisma.folder.findFirst({
      where: { workspaceId: workspace.id, name: folder.name.vi },
    });

    if (!existing) {
      await prisma.folder.create({
        data: { workspaceId: workspace.id, name: folder.name.vi },
      });
    }
  }
  console.log(`  ✓ ${Object.keys(SEED_FOLDERS).length} Folders seeded`);

  console.log('Seeding Tags...');

  for (const [key, tag] of Object.entries(SEED_TAGS)) {
    await prisma.tag.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key } },
      update: { label: tag.label.vi },
      create: {
        workspaceId: workspace.id,
        key,
        label: tag.label.vi,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(SEED_TAGS).length} Tags seeded`);

  console.log('');
  console.log(`Seed version: ${SEED_VERSION}`);
  console.log(`Locales: ${SEED_METADATA.locales.join(', ')}`);
  console.log('');

  for (const userData of seedUsers) {
    const user = await ensureUser(userData.email, userData.name, userData.password);

    await prisma.workspaceMembership.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
      update: { isActive: true },
      create: { userId: user.id, workspaceId: workspace.id, role: userData.role, isActive: true },
    });

    // Only create routingCapability for specialist/reviewer roles (AssignmentKind enum)
    if (userData.role === 'specialist' || userData.role === 'reviewer') {
      await prisma.routingCapability.upsert({
        where: {
          workspaceId_userId_matterTypeKey_kind: {
            workspaceId: workspace.id,
            userId: user.id,
            matterTypeKey: routingCapability.matterTypeKey,
            kind: userData.role,
          },
        },
        update: { isActive: true },
        create: {
          workspaceId: workspace.id,
          userId: user.id,
          matterTypeKey: routingCapability.matterTypeKey,
          kind: userData.role,
          isActive: true,
        },
      });
    }
  }

  // ── Seed demo requests for demo-legal-workspace ──
  // So @example.test users see full data when they log in.
  // Filter logic (src/lib/security/request-filter.ts):
  //   customer → { createdById }
  //   specialist → { assignedSpecialistId }
  //   reviewer → { assignedReviewerId }
  const demoCustomer = await prisma.user.findUniqueOrThrow({
    where: { email: 'customer.demo@example.test' },
  });
  const demoSpecialist = await prisma.user.findUniqueOrThrow({
    where: { email: 'specialist.demo@example.test' },
  });
  const demoReviewer = await prisma.user.findUniqueOrThrow({
    where: { email: 'reviewer.demo@example.test' },
  });

  const demoRequestTitles = [
    'Tư vấn hợp đồng lao động thời vụ',
    'Soạn thảo NDA với đối tác ABC',
    'Đăng ký nhãn hiệu "Pháp Việt"',
    'Tư vấn thành lập công ty TNHH MTV',
    'Rà soát tuân thủ PCCC cho văn phòng',
    'Đàm phán hợp đồng phân phối độc quyền',
    'Tư vấn luật đầu tư nước ngoài',
    'Soạn thảo điều lệ công ty cổ phần',
    'Đăng ký bản quyền phần mềm ERP',
    'Tư vấn thuế TNCN cho nhân viên nước ngoài',
    'Hợp đồng thuê văn phòng quận 1',
    'Thỏa thuận bảo mật thông tin khách hàng',
    'Hợp đồng dịch vụ IT outsourcing',
    'Tư vấn sáp nhập chi nhánh miền Bắc',
    'Đăng ký kiểu dáng công nghiệp bao bì',
    'Hợp đồng đại lý độc quyền miền Nam',
    'Tư vấn chấm dứt hợp đồng lao động',
    'Soạn thảo quy chế lương thưởng 2026',
    'Đăng ký sáng chế quy trình sản xuất',
    'Hợp đồng chuyển nhượng vốn góp',
    'Tư vấn pháp lý dự án khu đô thị',
    'Rà soát hợp đồng thuê kho bãi',
    'Soạn thảo biên bản thỏa thuận hợp tác',
    'Đăng ký tên thương mại "An Phát Logistics"',
    'Tư vấn xuất khẩu lao động Nhật Bản',
    'Hợp đồng gia công hàng may mặc',
    'Soạn thảo thỏa thuận hợp tác chiến lược',
    'Đăng ký chỉ dẫn địa lý "Nước mắm Phú Quốc"',
    'Tư vấn luật thương mại điện tử xuyên biên giới',
    'Hợp đồng nhượng quyền thương hiệu cà phê',
    'Rà soát chính sách nghỉ phép công ty',
    'Soạn thảo quy trình khiếu nại nội bộ',
    'Đăng ký quyền tác giả phim quảng cáo',
    'Tư vấn đầu tư bất động sản nghỉ dưỡng',
    'Hợp đồng liên doanh với đối tác Hàn Quốc',
    'Soạn thảo thỏa thuận không cạnh tranh',
    'Đăng ký nhãn hiệu quốc tế Madrid',
    'Tư vấn giải quyết tranh chấp thương mại',
    'Hợp đồng cung ứng nguyên vật liệu',
    'Rà soát tuân thủ bảo vệ dữ liệu cá nhân',
  ];

  // Full workflow cycle distributed across 40 requests
  const demoStatuses = [
    'draft_intake', 'triage', 'triage', 'triage',
    'assigned', 'assigned', 'assigned',
    'in_progress', 'in_progress', 'in_progress', 'in_progress',
    'pending_review', 'pending_review', 'pending_review', 'pending_review',
    'revision_required', 'revision_required',
    'approved', 'approved', 'approved',
    'delivered', 'delivered',
    'closed', 'closed',
  ];

  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
  const demoCount = Math.min(demoRequestTitles.length, demoStatuses.length);

  // Map matter types to demo requests by semantic match with title content
  const demoMatterTypes = [
    'labor_contract',     // 0: Tư vấn hợp đồng lao động thời vụ
    'nda',                // 1: Soạn thảo NDA với đối tác ABC
    'trademark',          // 2: Đăng ký nhãn hiệu "Pháp Việt"
    'incorporation',      // 3: Tư vấn thành lập công ty TNHH MTV
    'regulatory',         // 4: Rà soát tuân thủ PCCC cho văn phòng
    'distribution_contract', // 5: Đàm phán hợp đồng phân phối độc quyền
    'regulatory',         // 6: Tư vấn luật đầu tư nước ngoài
    'corporate_governance', // 7: Soạn thảo điều lệ công ty cổ phần
    'copyright',          // 8: Đăng ký bản quyền phần mềm ERP
    'regulatory',         // 9: Tư vấn thuế TNCN cho nhân viên nước ngoài
    'service_agreement',  // 10: Hợp đồng thuê văn phòng quận 1
    'nda',                // 11: Thỏa thuận bảo mật thông tin khách hàng
    'service_agreement',  // 12: Hợp đồng dịch vụ IT outsourcing
    'mna',                // 13: Tư vấn sáp nhập chi nhánh miền Bắc
    'trademark',          // 14: Đăng ký kiểu dáng công nghiệp bao bì
    'agency_contract',    // 15: Hợp đồng đại lý độc quyền miền Nam
    'termination',        // 16: Tư vấn chấm dứt hợp đồng lao động
    'employment_policy',  // 17: Soạn thảo quy chế lương thưởng 2026
    'patent',             // 18: Đăng ký sáng chế quy trình sản xuất
    'contract_drafting',  // 19: Hợp đồng chuyển nhượng vốn góp
    'regulatory',         // 20: Tư vấn pháp lý dự án khu đô thị
    'contract_review',    // 21: Rà soát hợp đồng thuê kho bãi
    'contract_drafting',  // 22: Soạn thảo biên bản thỏa thuận hợp tác
    'business_registration', // 23: Đăng ký tên thương mại "An Phát Logistics"
    // Extended for demoStatuses expansion — mapped for full 40 titles
    'labor_contract',     // 24: Tư vấn xuất khẩu lao động Nhật Bản
    'contract_drafting',  // 25: Hợp đồng gia công hàng may mặc
    'contract_drafting',  // 26: Soạn thảo thỏa thuận hợp tác chiến lược
    'trademark',          // 27: Đăng ký chỉ dẫn địa lý
    'regulatory',         // 28: Tư vấn luật thương mại điện tử xuyên biên giới
    'contract_drafting',  // 29: Hợp đồng nhượng quyền thương hiệu
    'internal_regulation', // 30: Rà soát chính sách nghỉ phép công ty
    'internal_regulation', // 31: Soạn thảo quy trình khiếu nại nội bộ
    'copyright',          // 32: Đăng ký quyền tác giả phim quảng cáo
    'regulatory',         // 33: Tư vấn đầu tư bất động sản nghỉ dưỡng
    'contract_drafting',  // 34: Hợp đồng liên doanh với đối tác Hàn Quốc
    'contract_drafting',  // 35: Soạn thảo thỏa thuận không cạnh tranh
    'trademark',          // 36: Đăng ký nhãn hiệu quốc tế Madrid
    'dispute',            // 37: Tư vấn giải quyết tranh chấp thương mại
    'contract_drafting',  // 38: Hợp đồng cung ứng nguyên vật liệu
    'data_protection',    // 39: Rà soát tuân thủ bảo vệ dữ liệu cá nhân
  ];

  for (let i = 0; i < demoCount; i++) {
    const status = demoStatuses[i];
    const priority = priorities[i % priorities.length];
    // Rotate creator among 3 customer users so each sees ~13 own requests
    const creatorIdx = i % 3; // customer.demo, customer2.demo, customer3.demo
    const customerEmails = ['customer.demo@example.test', 'customer2.demo@example.test', 'customer3.demo@example.test'];
    const creator = await prisma.user.findUniqueOrThrow({ where: { email: customerEmails[creatorIdx] } });

    // Rotate assignments so specialist/reviewer see their share
    const hasSpecialist = ['assigned', 'in_progress', 'pending_review', 'revision_required', 'approved', 'delivered', 'closed'].includes(status);
    const hasReviewer = ['pending_review', 'revision_required', 'approved', 'delivered', 'closed'].includes(status);

    // Use SLA ranges: 3, 5, 7, 10, 14 days
    const slaDays = [3, 5, 7, 10, 14][i % 5];
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    await prisma.legalRequest.create({
      data: {
        code: `DEMO-2026-${String(i + 1).padStart(3, '0')}`,
        title: demoRequestTitles[i],
        matterType: demoMatterTypes[i] ?? null,
        status,
        priority,
        workspaceId: workspace.id,
        createdById: creator.id,
        assignedSpecialistId: hasSpecialist ? demoSpecialist.id : null,
        assignedReviewerId: hasReviewer ? demoReviewer.id : null,
        slaDeadline,
      },
    });
  }
  console.log(`  ✓ Demo requests: ${demoCount} in ${workspace.slug}`);

  // ── Seed document templates for demo-legal-workspace ──
  const sampleTemplates = [
    { key: 'labor_contract', label: 'Hợp đồng lao động', desc: 'Mẫu hợp đồng lao động tiêu chuẩn' },
    { key: 'nda', label: 'Thỏa thuận bảo mật (NDA)', desc: 'Mẫu NDA hai bên' },
    { key: 'service_agreement', label: 'Hợp đồng dịch vụ', desc: 'Mẫu hợp đồng dịch vụ pháp lý' },
    { key: 'company_formation', label: 'Hồ sơ thành lập DN', desc: 'Mẫu hồ sơ thành lập doanh nghiệp' },
  ];

  const templateIds: Record<string, string> = {};
  for (const t of sampleTemplates) {
    const tmpl = await prisma.documentTemplate.upsert({
      where: { workspaceId_matterTypeKey_version: { workspaceId: workspace.id, matterTypeKey: t.key, version: 1 } },
      update: { label: t.label, content: `# ${t.label}\n\n---\n\nNội dung mẫu cho **${t.desc}**.\n\n## Điều khoản\n\n1. Bên A: {party_a}\n2. Bên B: {party_b}\n3. Ngày hiệu lực: {effective_date}\n4. Thời hạn: {duration}\n\n---\n*Template version 1*` },
      create: {
        workspaceId: workspace.id,
        matterTypeKey: t.key,
        version: 1,
        status: 'published',
        label: t.label,
        description: t.desc,
        variableSchema: { party_a: 'string', party_b: 'string', effective_date: 'date', duration: 'string' },
        content: `# ${t.label}\n\n---\n\nNội dung mẫu cho **${t.desc}**.\n\n## Điều khoản\n\n1. Bên A: {party_a}\n2. Bên B: {party_b}\n3. Ngày hiệu lực: {effective_date}\n4. Thời hạn: {duration}\n\n---\n*Template version 1*`,
      },
    });
    templateIds[t.key] = tmpl.id;
  }
  console.log(`  ✓ Document templates: ${Object.keys(templateIds).length}`);

  // ── Seed documents + versions for demo requests ──
  const allDemoRequests = await prisma.legalRequest.findMany({
    where: { workspaceId: workspace.id, code: { startsWith: 'DEMO-' } },
  });

  const documentStatuses = ['draft', 'in_progress', 'submitted_for_review', 'approved', 'rejected'];

  let docCount = 0;
  for (const req of allDemoRequests) {
    const tplKey = sampleTemplates[docCount % sampleTemplates.length].key;
    const tpl = templateIds[tplKey];
    if (!tpl) continue;

    // Only create documents for requests past draft_intake/triage
    const docStatus = req.status === 'draft_intake' || req.status === 'triage'
      ? 'draft'
      : documentStatuses[docCount % documentStatuses.length];

    const doc = await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        requestId: req.id,
        title: `Tài liệu: ${req.title}`,
      },
    });

    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        templateId: tpl,
        templateVersion: 1,
        status: docStatus,
        inputSnapshot: {
          party_a: 'Công ty An Phát',
          party_b: req.title.includes('đối tác') ? 'Đối tác ABC' : 'Bên liên quan',
          effective_date: new Date().toISOString().split('T')[0],
          duration: '12 tháng',
        },
        generatedContent: `# ${req.title}\n\n---\n\n## BÊN A: Công ty An Phát\nĐịa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM\nMST: 0123456789\n\n## BÊN B: Bên liên quan\n\n## ĐIỀU 1: NỘI DUNG CÔNG VIỆC\nThực hiện ${req.title.toLowerCase()} theo yêu cầu.\n\n## ĐIỀU 2: THỜI HẠN\n12 tháng kể từ ngày ký.\n\n## ĐIỀU 3: PHÍ DỊCH VỤ\nTheo báo giá đính kèm.\n\n---\n*Tài liệu mẫu — chỉ dùng cho demo*`,
      },
    });
    docCount++;
  }
  console.log(`  ✓ Documents + versions: ${docCount}`);

  // ── Seed vault files for demo-legal-workspace ──
  const demoVaultFiles = [
    'Hợp đồng lao động thời vụ - Bản cuối.pdf',
    'Thỏa thuận bảo mật NDA - Đã ký.pdf',
    'Giấy phép kinh doanh công ty.docx',
    'Điều lệ công ty TNHH.pdf',
    'Báo cáo tuân thủ PCCC.docx',
    'Hợp đồng phân phối độc quyền - Dự thảo.pdf',
    'Đơn đăng ký nhãn hiệu Pháp Việt.pdf',
    'Biên bản thỏa thuận hợp tác.docx',
    'Báo cáo tài chính quý 1-2026.xlsx',
    'Hợp đồng thuê văn phòng quận 1.pdf',
    'Hồ sơ sáp nhập chi nhánh.docx',
    'Đăng ký sáng chế - Mô tả kỹ thuật.pdf',
  ];

  const demoMimeTypes = [
    'application/pdf', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
  ];

  const fileKinds = ['contract', 'nda', 'license', 'charter', 'compliance', 'contract', 'application', 'minutes', 'report', 'contract', 'merger', 'patent'];

  for (let i = 0; i < demoVaultFiles.length; i++) {
    const relatedReq = allDemoRequests[i % allDemoRequests.length];

    await prisma.vaultFile.create({
      data: {
        storageKey: `vault/demo/${Date.now()}-${i}`,
        contentType: demoMimeTypes[i],
        size: Math.floor(Math.random() * 5000000) + 100000,
        workspaceId: workspace.id,
        requestId: relatedReq.id,
        actorId: demoCustomer.id,
        fileKind: fileKinds[i],
        filename: demoVaultFiles[i],
      },
    });
  }
  console.log(`  ✓ Vault files: ${demoVaultFiles.length}`);

  // ── Seed audit events for demo-legal-workspace (customer.demo as actor) ──
  // Action names must match Dashboard.activity.actions i18n keys
  // (see src/messages/en.json → Dashboard.activity.actions)
  const demoAuditActions = [
    'request.created', 'document.uploaded', 'request.updated',
    'document.downloaded', 'intake.submitted', 'request.created',
    'document.uploaded', 'request.updated', 'vault.file_added',
    'request.created', 'document.uploaded', 'user.updated',
    'request.updated', 'vault.file_added', 'document.uploaded',
  ];

  for (let i = 0; i < demoAuditActions.length; i++) {
    const relatedReq = allDemoRequests[i % allDemoRequests.length];
    await prisma.auditEvent.create({
      data: {
        actorId: demoCustomer.id,
        workspaceId: workspace.id,
        action: demoAuditActions[i],
        targetType: demoAuditActions[i].startsWith('document') ? 'document'
          : demoAuditActions[i].startsWith('vault') ? 'vault' : 'request',
        targetId: relatedReq.id,
        metadataSummary: `${demoAuditActions[i]} on ${relatedReq.title}`,
      },
    });
  }
  console.log(`  ✓ Audit events: ${demoAuditActions.length}`);

  // ── Seed messages for ALL demo-legal-workspace requests ──
  // Every DEMO request gets a conversation thread (5-8 messages)
  const allDemoRequestsForMsgs = await prisma.legalRequest.findMany({
    where: {
      workspaceId: workspace.id,
      code: { startsWith: 'DEMO-' },
    },
    orderBy: { code: 'asc' },
  });

  // Rich message templates — one per topic area, reusable with different titles
  const messageTemplates: Array<{ from: 'specialist' | 'customer'; content: string }[]> = [
    // 0: Contract review
    [
      { from: 'customer', content: 'Chào em, bên chị mới nhận được hợp đồng từ đối tác, em xem giúp chị có điều khoản nào rủi ro không nhé.' },
      { from: 'specialist', content: 'Dạ chị gửi em bản hợp đồng, em sẽ rà soát và báo cáo các điểm cần lưu ý trong 24h ạ.' },
      { from: 'specialist', content: 'Chào chị, em đã xem xong hợp đồng. Có 3 điểm chính cần điều chỉnh: (1) Điều khoản phạt vi phạm đang quá cao so với quy định, (2) Thời hạn thanh toán chưa rõ ràng, (3) Thiếu điều khoản giải quyết tranh chấp. Em gửi chị bản đánh dấu các điểm cần sửa.' },
      { from: 'customer', content: 'Cảm ơn em, chị xem và phản hồi lại ngay.' },
      { from: 'specialist', content: 'Dạ chị cứ tự nhiên. Nếu cần em soạn email phản hồi chính thức cho đối tác luôn ạ.' },
    ],
    // 1: Company/incorporation
    [
      { from: 'customer', content: 'Em ơi, bên chị muốn làm thủ tục thành lập công ty mới, không biết cần những giấy tờ gì?' },
      { from: 'specialist', content: 'Chào chị, em sẽ hỗ trợ chị toàn bộ thủ tục. Cần chuẩn bị: CMND/CCCD của người đại diện, dự thảo điều lệ, giấy đề nghị đăng ký kinh doanh, và danh sách thành viên/góp vốn. Chị dự định thành lập loại hình nào: TNHH, cổ phần, hay tư nhân ạ?' },
      { from: 'customer', content: 'Công ty TNHH 2 thành viên trở lên em nhé. Vốn điều lệ khoảng 5 tỷ.' },
      { from: 'specialist', content: 'Dạ rõ. Em soạn hồ sơ đầy đủ cho chị: điều lệ, giấy đề nghị, danh sách thành viên. Dự kiến 3-5 ngày làm việc sẽ có giấy phép. Chị cho em xin thông tin 2 thành viên để em điền vào hồ sơ.' },
    ],
    // 2: Trademark/IP
    [
      { from: 'specialist', content: 'Chào chị, em đã nhận yêu cầu đăng ký sở hữu trí tuệ của chị. Em đã tra cứu sơ bộ trên hệ thống Cục SHTT và thấy khả quan ạ.' },
      { from: 'customer', content: 'Tốt quá! Vậy mình cần chuẩn bị gì tiếp theo em?' },
      { from: 'specialist', content: 'Dạ cần: mẫu nhãn hiệu/kiểu dáng, tờ khai đăng ký, giấy ủy quyền cho bên em nộp hồ sơ. Em đã soạn sẵn tờ khai và giấy ủy quyền, chị chỉ cần ký và gửi mẫu. Lệ phí nhà nước khoảng 1-2 triệu tùy loại, phí dịch vụ bên em 3 triệu.' },
      { from: 'customer', content: 'OK, gửi chị giấy tờ để ký. Khi nào nộp được em?' },
      { from: 'specialist', content: 'Dạ ngay khi có đủ chữ ký em sẽ nộp trong ngày. Thời gian xử lý khoảng 12-18 tháng, mình sẽ nhận được thông báo chấp nhận đơn trong 2-3 tháng đầu.' },
      { from: 'customer', content: 'Rõ rồi, cảm ơn em.' },
    ],
    // 3: Tax/compliance
    [
      { from: 'customer', content: 'Em ơi, chị cần tư vấn về vấn đề thuế và tuân thủ cho công ty. Bên chị đang có vài vướng mắc.' },
      { from: 'specialist', content: 'Chào chị, em sẵn sàng hỗ trợ. Chị cho em biết cụ thể vướng mắc ở khâu nào: thuế GTGT, TNDN, TNCN, hay báo cáo định kỳ ạ?' },
      { from: 'customer', content: 'Chủ yếu là cách tính thuế TNCN cho nhân viên mới, và bên chị sắp bị thanh tra thuế nên cần rà soát lại.' },
      { from: 'specialist', content: 'Dạ em hiểu. Em sẽ làm 2 việc: (1) Tư vấn chi tiết cách tính thuế TNCN cho nhân viên mới kèm biểu thuế lũy tiến, (2) Rà soát toàn bộ hồ sơ thuế 2 năm gần nhất để chuẩn bị cho đợt thanh tra. Em gửi chị checklist các mục cần kiểm tra trước.' },
      { from: 'customer', content: 'Tuyệt vời, đúng cái chị cần. Làm ngay giúp chị nhé.' },
    ],
    // 4: Employment/labor
    [
      { from: 'customer', content: 'Chào luật sư, công ty em đang cần tư vấn về vấn đề lao động.' },
      { from: 'specialist', content: 'Chào chị, em là chuyên viên phụ trách. Chị cho em biết cụ thể công ty mình đang gặp vấn đề gì về lao động: hợp đồng, kỷ luật, chấm dứt, hay chế độ phúc lợi ạ?' },
      { from: 'customer', content: 'Bên chị muốn soạn lại quy chế và hợp đồng lao động cho chuẩn với luật mới.' },
      { from: 'specialist', content: 'Dạ em sẽ soạn bộ hồ sơ lao động chuẩn theo Bộ luật Lao động 2019: hợp đồng mẫu, quy chế nội bộ, thỏa ước lao động tập thể (nếu cần). Em cũng rà soát xem có điểm nào chưa phù hợp không. Chị cho em xin quy chế và hợp đồng hiện tại để em đối chiếu.' },
      { from: 'customer', content: 'OK em, để chị gửi.' },
    ],
    // 5: NDA/confidentiality
    [
      { from: 'specialist', content: 'Chào chị, em đã nhận yêu cầu về thỏa thuận bảo mật. Em cần biết phạm vi thông tin cần bảo vệ để soạn NDA phù hợp.' },
      { from: 'customer', content: 'Chủ yếu là dữ liệu khách hàng, bí quyết kinh doanh, và thông tin tài chính nội bộ. Đối tác sẽ tiếp cận những thông tin này trong quá trình hợp tác.' },
      { from: 'specialist', content: 'Dạ em soạn NDA với phạm vi rộng, bao gồm: thông tin khách hàng, dữ liệu tài chính, bí quyết kinh doanh, và chiến lược phát triển. Thời hạn bảo mật 5 năm kể từ ngày ký. Có điều khoản bồi thường nếu vi phạm. Chị xem có cần thêm gì không?' },
      { from: 'customer', content: 'Tốt rồi em, gửi chị bản nháp nhé.' },
      { from: 'specialist', content: 'Dạ em gửi ngay. Khi nào có phản hồi từ đối tác mình sẽ điều chỉnh tiếp ạ.' },
    ],
    // 6: Service agreement
    [
      { from: 'customer', content: 'Em ơi, chị cần soạn 1 hợp đồng dịch vụ mới cho khách hàng.' },
      { from: 'specialist', content: 'Chào chị, em sẽ hỗ trợ. Chị cho em biết loại dịch vụ, thời hạn, giá trị hợp đồng, và các yêu cầu đặc biệt để em soạn cho sát thực tế.' },
      { from: 'customer', content: 'Dịch vụ tư vấn quản lý, hợp đồng 1 năm, giá trị khoảng 500 triệu. Khách hàng yêu cầu có điều khoản bảo mật và cam kết chất lượng.' },
      { from: 'specialist', content: 'Dạ em soạn hợp đồng dịch vụ tư vấn với đầy đủ: phạm vi công việc, thời hạn, phí dịch vụ và phương thức thanh toán, điều khoản bảo mật, cam kết chất lượng (SLA), và điều khoản chấm dứt. Em gửi chị bản nháp trong chiều nay.' },
      { from: 'customer', content: 'OK, chị đợi bản nháp nhé. Cảm ơn em.' },
    ],
    // 7: Corporate governance
    [
      { from: 'customer', content: 'Em ơi, công ty chị cần soạn thảo các văn bản quản trị nội bộ cho chuẩn.' },
      { from: 'specialist', content: 'Chào chị, em sẽ giúp chị chuẩn hóa toàn bộ hồ sơ quản trị: điều lệ, quy chế hoạt động HĐTV/HĐQT, quy chế tài chính, và các nghị quyết/biên bản họp. Chị cho em biết loại hình công ty và cơ cấu tổ chức hiện tại.' },
      { from: 'customer', content: 'Công ty cổ phần, có HĐQT 5 người, Ban kiểm soát 3 người. Chị cần bộ quy chế đầy đủ.' },
      { from: 'specialist', content: 'Dạ em soạn trọn bộ: điều lệ cập nhật theo Luật Doanh nghiệp 2020, quy chế hoạt động HĐQT, quy chế Ban kiểm soát, quy chế tài chính nội bộ, và mẫu biên bản/nghị quyết chuẩn. Dự kiến 5 ngày làm việc sẽ hoàn thiện.' },
      { from: 'customer', content: 'Tốt, làm giúp chị nhé.' },
    ],
    // 8: M&A/Investment
    [
      { from: 'specialist', content: 'Chào chị, em đã nhận yêu cầu tư vấn về M&A/đầu tư. Đây là lĩnh vực phức tạp, em sẽ phân tích kỹ từng bước cho chị.' },
      { from: 'customer', content: 'Chào em, chị cần đánh giá rủi ro pháp lý trước khi quyết định đầu tư/sáp nhập.' },
      { from: 'specialist', content: 'Dạ em sẽ thực hiện: (1) Due diligence pháp lý — rà soát toàn bộ hồ sơ pháp lý của bên kia, (2) Đánh giá rủi ro và cơ hội, (3) Đề xuất cấu trúc giao dịch tối ưu, (4) Soạn thảo thỏa thuận nguyên tắc. Chị gửi em thông tin cơ bản về bên kia để em bắt đầu.' },
      { from: 'customer', content: 'OK em, chị gửi hồ sơ qua email. Em xem và báo chị nhé.' },
    ],
    // 9: Distribution/agency
    [
      { from: 'customer', content: 'Chào em, bên chị sắp ký hợp đồng với đại lý/nhà phân phối mới, em hỗ trợ soạn thảo giúp.' },
      { from: 'specialist', content: 'Chào chị, em sẽ soạn hợp đồng chuẩn theo Luật Thương mại. Chị cho em biết: phạm vi độc quyền hay không độc quyền, khu vực địa lý, thời hạn, và chính sách chiết khấu/hoa hồng.' },
      { from: 'specialist', content: 'Dạ em soạn xong bản nháp. Các điều khoản chính: độc quyền phân phối trong khu vực, doanh số cam kết tối thiểu, chính sách giá và chiết khấu, thời hạn 3 năm, điều khoản chấm dứt và giải quyết tranh chấp. Chị xem và góp ý thêm ạ.' },
      { from: 'customer', content: 'Đọc sơ qua thấy ổn, để chị xem kỹ rồi phản hồi.' },
    ],
  ];

  const demoMsgCount = { total: 0, threads: 0 };
  const baseTime = Date.now();
  // Messages page filter: status in triage|assigned|in_progress|pending_review|revision_required
  const msgFilterStatuses = new Set(['triage', 'assigned', 'in_progress', 'pending_review', 'revision_required']);

  for (let i = 0; i < allDemoRequestsForMsgs.length; i++) {
    const req = allDemoRequestsForMsgs[i];

    // Skip closed/cancelled/draft_intake — not visible in messages page
    if (!msgFilterStatuses.has(req.status)) continue;

    // Pick template based on index — cyclic
    const templateIdx = i % messageTemplates.length;
    const template = messageTemplates[templateIdx];

    // Determine sender/recipient based on request's createdBy
    const customerId = req.createdById;
    const specialistId = req.assignedSpecialistId ?? demoSpecialist.id;

    // Spread threads across last 72 hours, oldest message first
    const threadBaseMs = baseTime - (i * 120 * 60 * 1000);

    for (let j = 0; j < template.length; j++) {
      const msg = template[j];
      const senderId = msg.from === 'specialist' ? specialistId : customerId;
      const recipientId = msg.from === 'specialist' ? customerId : specialistId;

      // j=0 → oldest (furthest in past), j=last → newest (closest to now)
      const msgOffsetMs = (template.length - 1 - j) * 10 * 60 * 1000;
      const createdAt = new Date(threadBaseMs - msgOffsetMs);

      await prisma.message.create({
        data: {
          workspaceId: workspace.id,
          legalRequestId: req.id,
          senderId,
          recipientId,
          content: msg.content,
          isRead: true,
          createdAt,
        },
      });
      demoMsgCount.total++;
    }

    // Guarantee a visible unread state for the demo customer (the account the
    // reviewer logs in as): append a fresh unread specialist reply to ~half of
    // that customer's visible threads. Independent of whether the topic
    // template ended on a customer or specialist message, so the unread badge
    // in the top nav and the bold thread state always render for the reviewer.
    const isDemoThread = customerId === demoCustomer.id;
    if (isDemoThread && msgFilterStatuses.has(req.status) && i % 2 === 0) {
      await prisma.message.create({
        data: {
          workspaceId: workspace.id,
          legalRequestId: req.id,
          senderId: specialistId,
          recipientId: customerId,
          content:
            'Em gửi chị bản cập nhật mới nhất của hồ sơ. Chị xem giúp em nhé, cần điều chỉnh gì cứ nhắn em ạ.',
          isRead: false,
          createdAt: new Date(threadBaseMs + 2 * 60 * 1000),
        },
      });
      demoMsgCount.total++;
    }
    demoMsgCount.threads++;
  }
  console.log(`  ✓ Demo messages: ${demoMsgCount.total} (${demoMsgCount.threads} threads)`);

  // Phase 16 fixtures
  const customerUser = demoCustomer;
  const specialistUser = demoSpecialist;
  const reviewerUser = demoReviewer;

  const fixtureSlaDeadline = new Date();
  fixtureSlaDeadline.setDate(fixtureSlaDeadline.getDate() + 7);

  const existingRequest = await prisma.legalRequest.findFirst({
    where: { workspaceId: workspace.id, title: 'Phase 16 fixture request' },
  });

  const fixtureRequest = existingRequest ?? await prisma.legalRequest.create({
    data: {
      workspaceId: workspace.id,
      title: 'Phase 16 fixture request',
      matterType: 'contract_drafting',
      status: 'in_progress',
      slaDeadline: fixtureSlaDeadline,
      createdById: customerUser.id,
      assignedSpecialistId: specialistUser.id,
      assignedReviewerId: reviewerUser.id,
    },
  });

  if (!fixtureRequest.assignedSpecialistId || !fixtureRequest.assignedReviewerId || !fixtureRequest.slaDeadline) {
    await prisma.legalRequest.update({
      where: { id: fixtureRequest.id },
      data: {
        assignedSpecialistId: specialistUser.id,
        assignedReviewerId: reviewerUser.id,
        slaDeadline: fixtureRequest.slaDeadline ?? fixtureSlaDeadline,
      },
    });
  }

  const existingDocument = await prisma.document.findFirst({
    where: { requestId: fixtureRequest.id, title: 'Phase 16 fixture document' },
  });
  const fixtureDocument = existingDocument ?? await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      requestId: fixtureRequest.id,
      title: 'Phase 16 fixture document',
    },
  });

  const fixtureDocumentVersion = await prisma.documentVersion.findFirst({
    where: { documentId: fixtureDocument.id, status: 'submitted_for_review' },
  });
  if (!fixtureDocumentVersion) {
    const firstTemplate = await prisma.documentTemplate.findFirst({
      where: { workspaceId: workspace.id },
      select: { id: true },
    });
    if (firstTemplate) {
      await prisma.documentVersion.create({
        data: {
          documentId: fixtureDocument.id,
          templateId: firstTemplate.id,
          templateVersion: 1,
          status: 'submitted_for_review',
          inputSnapshot: { seed: 'phase-16' },
          generatedContent: 'Phase 16 fixture document version content.',
        },
      });
    }
  }

  // ── Seed a conversation for the fixture request so its thread is not empty ──
  // The messages page sorts threads by updatedAt DESC; this fixture request is
  // upserted near the end so it lands at the top of the customer's thread list.
  // Give it a real dialogue (cũ → mới) so the top thread shows content instead
  // of "Bắt đầu cuộc trò chuyện".
  const fixtureMessages: Array<{ from: 'specialist' | 'customer'; content: string }> = [
    { from: 'customer', content: 'Chào em, bên chị cần hỗ trợ soạn thảo hợp đồng mẫu cho dự án mới.' },
    { from: 'specialist', content: 'Chào chị, em sẽ hỗ trợ. Chị cho em biết loại hợp đồng và các bên tham gia để em chuẩn bị mẫu cho phù hợp ạ.' },
    { from: 'customer', content: 'Hợp đồng cung cấp dịch vụ pháp lý giữa bên chị và công ty tư vấn. Thời hạn 1 năm, gia hạn theo thỏa thuận.' },
    { from: 'specialist', content: 'Dạ em soạn xong bản nháp với các điều khoản chính: phạm vi dịch vụ, phí và phương thức thanh toán, bảo mật thông tin, và điều khoản chấm dứt. Em gửi chị bản nháp để chị duyệt ạ.' },
    { from: 'customer', content: 'Em gửi chị xem nhé. Nếu ổn chị sẽ ký và gửi lại em trong hôm nay.' },
    { from: 'specialist', content: 'Dạ em đã gửi. Chị xem giúp em, có điểm nào cần chỉnh cứ nhắn em ạ.' },
  ];

  const existingFixtureMessages = await prisma.message.count({
    where: { legalRequestId: fixtureRequest.id },
  });
  if (existingFixtureMessages === 0) {
    const fixtureBaseMs = Date.now() - 30 * 60 * 1000;
    for (let j = 0; j < fixtureMessages.length; j++) {
      const m = fixtureMessages[j];
      const senderId = m.from === 'specialist' ? specialistUser.id : customerUser.id;
      const recipientId = m.from === 'specialist' ? customerUser.id : specialistUser.id;
      // j=0 → OLDEST, j=last → NEWEST (cũ → mới, matches messages page asc)
      const msgOffsetMs = (fixtureMessages.length - 1 - j) * 4 * 60 * 1000;
      await prisma.message.create({
        data: {
          workspaceId: workspace.id,
          legalRequestId: fixtureRequest.id,
          senderId,
          recipientId,
          content: m.content,
          isRead: true,
          createdAt: new Date(fixtureBaseMs - msgOffsetMs),
        },
      });
    }
    console.log('  ✓ Fixture request messages: 6 (thread "Phase 16 fixture request")');
  }

}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
