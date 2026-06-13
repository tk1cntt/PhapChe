/**
 * Migration Script: Copy existing label/description/name → _vi columns
 *
 * This script handles the transition from single-language to multilingual schema.
 * It copies existing data from legacy columns to new _vi columns.
 *
 * Order of operations:
 * 1. npx prisma db push (update schema - adds new columns alongside legacy)
 * 2. tsx scripts/migrate-existing-data.ts (copy existing data to _vi)
 * 3. Update schema to remove legacy columns (drop label, name columns)
 * 4. npx prisma db push (remove legacy columns)
 * 5. npx prisma studio (verify data)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting multilingual migration...');
  console.log('Copying data from legacy columns to _vi columns...\n');

  // Track migration counts
  const stats = {
    matterTypes: 0,
    documentTemplates: 0,
    folders: 0,
    tags: 0,
  };

  // 1. Migrate MatterType
  const matterTypes = await prisma.matterType.findMany({
    where: {
      label_vi: { not: null },
      OR: [
        { label_en: null },
        { label_en: '' },
      ],
    },
  });

  for (const mt of matterTypes) {
    if (mt.label_vi) {
      await prisma.matterType.update({
        where: { id: mt.id },
        data: {
          label_en: mt.label_vi,
        },
      });
      stats.matterTypes++;
    }
  }
  console.log(`Migrated ${stats.matterTypes} MatterTypes`);

  // 2. Migrate DocumentTemplate
  const templates = await prisma.documentTemplate.findMany({
    where: {
      label_vi: { not: null },
      OR: [
        { label_en: null },
        { label_en: '' },
      ],
    },
  });

  for (const t of templates) {
    if (t.label_vi) {
      await prisma.documentTemplate.update({
        where: { id: t.id },
        data: { label_en: t.label_vi },
      });
      stats.documentTemplates++;
    }
  }
  console.log(`Migrated ${stats.documentTemplates} DocumentTemplates`);

  // 3. Migrate Folder
  const folders = await prisma.folder.findMany({
    where: {
      name_vi: { not: null },
      OR: [
        { name_en: null },
        { name_en: '' },
      ],
    },
  });

  for (const f of folders) {
    if (f.name_vi) {
      await prisma.folder.update({
        where: { id: f.id },
        data: { name_en: f.name_vi },
      });
      stats.folders++;
    }
  }
  console.log(`Migrated ${stats.folders} Folders`);

  // 4. Migrate Tag
  const tags = await prisma.tag.findMany({
    where: {
      label_vi: { not: null },
      OR: [
        { label_en: null },
        { label_en: '' },
      ],
    },
  });

  for (const tag of tags) {
    if (tag.label_vi) {
      await prisma.tag.update({
        where: { id: tag.id },
        data: { label_en: tag.label_vi },
      });
      stats.tags++;
    }
  }
  console.log(`Migrated ${stats.tags} Tags`);

  console.log('\n--- Migration Summary ---');
  console.log(`MatterTypes: ${stats.matterTypes}`);
  console.log(`DocumentTemplates: ${stats.documentTemplates}`);
  console.log(`Folders: ${stats.folders}`);
  console.log(`Tags: ${stats.tags}`);
  console.log('\nMigration complete!');
  console.log('\nNext steps:');
  console.log('1. Verify data in: npx prisma studio');
  console.log('2. Remove legacy columns from schema');
  console.log('3. Run: npx prisma db push');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
