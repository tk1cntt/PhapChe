import { SEED_MATTER_TYPES, SEED_FOLDERS, SEED_TAGS, SEED_VERSION, SEED_METADATA } from '../src/lib/i18n/seed-multilingual';
import { auth } from '../src/auth';
import { seedMessages } from './seed-messages';
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

  // Create platform tenant
  const platformTenant = await prisma.tenant.upsert({
    where: { id: 'platform-tenant' },
    update: {},
    create: {
      id: 'platform-tenant',
      name: 'GitNexus Platform',
      type: 'platform',
      settings: JSON.stringify({
        requireMfa: false,
        defaultLanguage: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
      }),
    },
  });
  console.log('  ✓ Platform tenant:', platformTenant.id);

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

async function seedAnPhatWorkspace() {
  // Phase 30: Workspace page seed data - "Cong ty An Phat" workspace
  const anPhatWorkspace = await prisma.workspace.upsert({
    where: { slug: 'an-phat' },
    update: { isActive: true },
    create: {
      name: 'Cong ty An Phat',
      slug: 'an-phat',
      isActive: true,
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
  await seedAnPhatWorkspace();

  const workspace = await prisma.workspace.upsert({
    where: { slug: routingCapability.workspaceSlug },
    update: { isActive: true },
    create: {
      name: 'Demo Legal Workspace',
      slug: routingCapability.workspaceSlug,
      isActive: true,
    },
  });

  console.log(`Seeding MatterTypes v${SEED_VERSION}...`);

  for (const [key, matterType] of Object.entries(SEED_MATTER_TYPES)) {
    await prisma.matterType.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key } },
      update: {
        label_vi: matterType.label.vi,
        label_en: matterType.label.en ?? null,
        label_zh: matterType.label.zh ?? null,
        label_ja: matterType.label.ja ?? null,
        description_vi: matterType.description.vi ?? null,
        description_en: matterType.description.en ?? null,
        description_zh: matterType.description.zh ?? null,
        description_ja: matterType.description.ja ?? null,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
      create: {
        workspaceId: workspace.id,
        key,
        label_vi: matterType.label.vi,
        label_en: matterType.label.en ?? null,
        label_zh: matterType.label.zh ?? null,
        label_ja: matterType.label.ja ?? null,
        description_vi: matterType.description.vi ?? null,
        description_en: matterType.description.en ?? null,
        description_zh: matterType.description.zh ?? null,
        description_ja: matterType.description.ja ?? null,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(SEED_MATTER_TYPES).length} MatterTypes seeded with ${SEED_METADATA.locales.length} languages`);

  console.log('Seeding Folders...');

  for (const [key, folder] of Object.entries(SEED_FOLDERS)) {
    // Use findFirst to check if folder exists, then create or update
    const existing = await prisma.folder.findFirst({
      where: {
        workspaceId: workspace.id,
        name_vi: folder.name.vi,
      },
    });

    if (existing) {
      await prisma.folder.update({
        where: { id: existing.id },
        data: {
          name_en: folder.name.en ?? null,
          name_zh: folder.name.zh ?? null,
          name_ja: folder.name.ja ?? null,
        },
      });
    } else {
      await prisma.folder.create({
        data: {
          workspaceId: workspace.id,
          name_vi: folder.name.vi,
          name_en: folder.name.en ?? null,
          name_zh: folder.name.zh ?? null,
          name_ja: folder.name.ja ?? null,
        },
      });
    }
  }
  console.log(`  ✓ ${Object.keys(SEED_FOLDERS).length} Folders seeded`);

  console.log('Seeding Tags...');

  for (const [key, tag] of Object.entries(SEED_TAGS)) {
    await prisma.tag.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace.id,
          key,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        key,
        label_vi: tag.label.vi,
        label_en: tag.label.en ?? null,
        label_zh: tag.label.zh ?? null,
        label_ja: tag.label.ja ?? null,
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

  // Phase 16 fixtures: minimum demo legal request, document, and document version
  // so dynamic detail routes can validate with role-owned IDs.
  const customerUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'customer.demo@example.test' },
  });
  const specialistUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'specialist.demo@example.test' },
  });
  const reviewerUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'reviewer.demo@example.test' },
  });

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

  // Seed sample message threads (Phase 29)
  await seedMessages();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
