import { PrismaClient } from '@prisma/client';
import { MATTER_CATALOG } from '../src/lib/intake/catalog';

const prisma = new PrismaClient();

const routingCapability = {
  workspaceSlug: 'demo-legal-workspace',
  matterTypeKey: 'labor_contract',
  specialist: {
    email: 'specialist.demo@example.test',
    name: 'Chuyên viên Lao động Demo',
  },
  reviewer: {
    email: 'reviewer.demo@example.test',
    name: 'Reviewer Lao động Demo',
  },
};

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

  const matterTypes = prisma.matterType as { upsert(input: unknown): Promise<unknown> };

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

  const specialist = await prisma.user.upsert({
    where: { email: routingCapability.specialist.email },
    update: { name: routingCapability.specialist.name, isActive: true },
    create: { email: routingCapability.specialist.email, name: routingCapability.specialist.name, isActive: true },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: routingCapability.reviewer.email },
    update: { name: routingCapability.reviewer.name, isActive: true },
    create: { email: routingCapability.reviewer.email, name: routingCapability.reviewer.name, isActive: true },
  });

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId_role: { userId: specialist.id, workspaceId: workspace.id, role: 'specialist' } },
    update: { isActive: true },
    create: { userId: specialist.id, workspaceId: workspace.id, role: 'specialist', isActive: true },
  });

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId_role: { userId: reviewer.id, workspaceId: workspace.id, role: 'reviewer' } },
    update: { isActive: true },
    create: { userId: reviewer.id, workspaceId: workspace.id, role: 'reviewer', isActive: true },
  });

  await prisma.routingCapability.upsert({
    where: {
      workspaceId_userId_matterTypeKey_kind: {
        workspaceId: workspace.id,
        userId: specialist.id,
        matterTypeKey: routingCapability.matterTypeKey,
        kind: 'specialist',
      },
    },
    update: { isActive: true },
    create: {
      workspaceId: workspace.id,
      userId: specialist.id,
      matterTypeKey: routingCapability.matterTypeKey,
      kind: 'specialist',
      isActive: true,
    },
  });

  await prisma.routingCapability.upsert({
    where: {
      workspaceId_userId_matterTypeKey_kind: {
        workspaceId: workspace.id,
        userId: reviewer.id,
        matterTypeKey: routingCapability.matterTypeKey,
        kind: 'reviewer',
      },
    },
    update: { isActive: true },
    create: {
      workspaceId: workspace.id,
      userId: reviewer.id,
      matterTypeKey: routingCapability.matterTypeKey,
      kind: 'reviewer',
      isActive: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
