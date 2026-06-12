/**
 * Migration Script: Copy existing label/description/name → _vi columns
 *
 * This script handles the transition from single-language to multilingual schema.
 * It copies existing data to the _vi column (primary language).
 *
 * IMPORTANT: Run this BEFORE running prisma db push
 *
 * Order of operations:
 * 1. npx prisma db push (update schema - adds new columns)
 * 2. tsx scripts/migrate-existing-data.ts (copy existing data to _vi)
 * 3. npx prisma studio (verify data)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting multilingual migration...');

  // Track migration counts
  const stats = {
    matterTypes: 0,
    documentTemplates: 0,
    folders: 0,
    tags: 0,
  };

  // 1. Migrate MatterType
  // Note: After schema change, label column is replaced by label_vi/_en/_zh/_ja
  // This script assumes it runs BEFORE schema change
  try {
    const matterTypes = await prisma.$queryRaw<Array<{ id: string; label: string }>>`
      SELECT id, label FROM MatterType WHERE label IS NOT NULL
    `;
    for (const mt of matterTypes) {
      await prisma.$executeRaw`
        UPDATE MatterType SET label_vi = ${mt.label} WHERE id = ${mt.id} AND (label_vi IS NULL OR label_vi = '')
      `;
      stats.matterTypes++;
    }
    console.log(`Migrated ${stats.matterTypes} MatterTypes`);
  } catch (e) {
    console.log('MatterType migration skipped (label column may not exist yet)');
  }

  // 2. Migrate DocumentTemplate
  try {
    const templates = await prisma.$queryRaw<Array<{ id: string; label: string }>>`
      SELECT id, label FROM DocumentTemplate WHERE label IS NOT NULL
    `;
    for (const t of templates) {
      await prisma.$executeRaw`
        UPDATE DocumentTemplate SET label_vi = ${t.label} WHERE id = ${t.id} AND (label_vi IS NULL OR label_vi = '')
      `;
      stats.documentTemplates++;
    }
    console.log(`Migrated ${stats.documentTemplates} DocumentTemplates`);
  } catch (e) {
    console.log('DocumentTemplate migration skipped (label column may not exist yet)');
  }

  // 3. Migrate Folder
  try {
    const folders = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT id, name FROM Folder WHERE name IS NOT NULL
    `;
    for (const f of folders) {
      await prisma.$executeRaw`
        UPDATE Folder SET name_vi = ${f.name} WHERE id = ${f.id} AND (name_vi IS NULL OR name_vi = '')
      `;
      stats.folders++;
    }
    console.log(`Migrated ${stats.folders} Folders`);
  } catch (e) {
    console.log('Folder migration skipped (name column may not exist yet)');
  }

  // 4. Migrate Tag
  try {
    const tags = await prisma.$queryRaw<Array<{ id: string; label: string }>>`
      SELECT id, label FROM Tag WHERE label IS NOT NULL
    `;
    for (const tag of tags) {
      await prisma.$executeRaw`
        UPDATE Tag SET label_vi = ${tag.label} WHERE id = ${tag.id} AND (label_vi IS NULL OR label_vi = '')
      `;
      stats.tags++;
    }
    console.log(`Migrated ${stats.tags} Tags`);
  } catch (e) {
    console.log('Tag migration skipped (label column may not exist yet)');
  }

  console.log('\nMigration complete!');
  console.log('Summary:', stats);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
