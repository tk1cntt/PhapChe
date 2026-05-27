import { PrismaClient } from '@prisma/client';
import { MATTER_CATALOG } from '../src/lib/intake/catalog';

const prisma = new PrismaClient();

async function main() {
  for (const matterType of MATTER_CATALOG) {
    await prisma.matterType.upsert({
      where: { key: matterType.key },
      update: {
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
        isActive: true,
      },
      create: {
        key: matterType.key,
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions,
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
