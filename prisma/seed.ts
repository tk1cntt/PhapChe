import { PrismaClient } from '@prisma/client';
import { MATTER_CATALOG } from '../src/lib/intake/catalog';
import { auth } from '../src/auth';
import { seedMessages } from './seed-messages';

const prisma = new PrismaClient();

const seedUsers: { email: string; name: string; password: string; role: 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin' | 'super_admin' }[] = [
  { email: 'customer.demo@example.test', name: 'Khach hang Demo', password: 'Demo@123456', role: 'customer' },
  { email: 'specialist.demo@example.test', name: 'Chuyen vien Lao dong Demo', password: 'Demo@123456', role: 'specialist' },
  { email: 'reviewer.demo@example.test', name: 'Reviewer Lao dong Demo', password: 'Demo@123456', role: 'reviewer' },
  { email: 'admin.demo@example.test', name: 'Dieu phoi Demo', password: 'Demo@123456', role: 'coordinator_admin' },
  { email: 'superadmin.demo@example.test', name: 'Quan tri vien Demo', password: 'Demo@123456', role: 'super_admin' },
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
      try {
        await auth.api.signUpEmail({
          body: { email, name, password },
        });
      } catch (err) {
        console.warn(`signUpEmail failed for ${email} (likely duplicate, skipping):`, err);
      }
    }
    return prisma.user.findUniqueOrThrow({ where: { email } });
  }
  const { user } = await auth.api.signUpEmail({
    body: { email, name, password },
  });
  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

async function createSession(userId: string) {
  const { createSession } = auth.api;
  // Create session directly in database
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  return token;
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
        userId_workspaceId_role: { userId: user.id, workspaceId: anPhatWorkspace.id, role: userData.role },
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

  const matterTypes = prisma.matterType as unknown as { upsert(input: unknown): Promise<unknown> };

  for (const matterType of MATTER_CATALOG) {
    await matterTypes.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key: matterType.key } },
      update: {
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
      create: {
        workspaceId: workspace.id,
        key: matterType.key,
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
    });
  }

  for (const userData of seedUsers) {
    const user = await ensureUser(userData.email, userData.name, userData.password);

    await prisma.workspaceMembership.upsert({
      where: { userId_workspaceId_role: { userId: user.id, workspaceId: workspace.id, role: userData.role } },
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
