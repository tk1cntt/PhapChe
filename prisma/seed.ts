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

    for (let i = 0; i < 12; i++) {
      await prisma.legalRequest.upsert({
        where: { id: `req-anphat-${String(i + 1).padStart(3, '0')}` },
        update: {},
        create: {
          id: `req-anphat-${String(i + 1).padStart(3, '0')}`,
          workspaceId: anPhatWorkspace.id,
          title: titles[i] || `Yeu cau ${i + 1}`,
          status: statuses[i] || 'draft_intake',
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

  // Phase 16 fixtures: minimum demo legal request, document, and document version
  // so dynamic detail routes can validate with role-owned IDs.
  const customerUser = demoCustomer;
  const specialistUser = demoSpecialist;
  const reviewerUser = demoReviewer;

  const existingRequest = await prisma.legalRequest.findFirst({
    where: { workspaceId: workspace.id, title: 'Phase 16 fixture request' },
  });

  const fixtureRequest = existingRequest ?? await prisma.legalRequest.create({
    data: {
      workspaceId: workspace.id,
      title: 'Phase 16 fixture request',
      status: 'in_progress',
      createdById: customerUser.id,
      assignedSpecialistId: specialistUser.id,
      assignedReviewerId: reviewerUser.id,
    },
  });

  if (!fixtureRequest.assignedSpecialistId || !fixtureRequest.assignedReviewerId) {
    await prisma.legalRequest.update({
      where: { id: fixtureRequest.id },
      data: {
        assignedSpecialistId: specialistUser.id,
        assignedReviewerId: reviewerUser.id,
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

}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
