import { PrismaClient } from '@prisma/client';
import { MATTER_CATALOG } from '../src/lib/intake/catalog';
import { auth } from '../src/auth';

const prisma = new PrismaClient();

const seedUsers: { email: string; name: string; password: string; role: 'specialist' | 'reviewer' }[] = [
  { email: 'specialist.demo@example.test', name: 'Chuyen vien Lao dong Demo', password: 'Demo@123456', role: 'specialist' },
  { email: 'reviewer.demo@example.test', name: 'Reviewer Lao dong Demo', password: 'Demo@123456', role: 'reviewer' },
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

async function main() {
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
