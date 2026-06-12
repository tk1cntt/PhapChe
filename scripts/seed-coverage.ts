/**
 * Seed Translation Coverage Report
 *
 * Checks what percentage of translations are filled
 * for each locale. Helps identify translation gaps.
 */

import { PrismaClient } from '@prisma/client';
import { SEED_MATTER_TYPES, SEED_FOLDERS, SEED_TAGS, SEED_VERSION } from '../src/lib/i18n/seed-multilingual';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';

const prisma = new PrismaClient();

type Locale = 'vi' | 'en' | 'zh' | 'ja';

interface CoverageResult {
  locale: Locale;
  filled: number;
  total: number;
  percentage: number;
}

function calculateCoverage(seedData: Record<string, { label: Record<string, string | null | undefined> }>): CoverageResult[] {
  const results: CoverageResult[] = [];

  for (const locale of SUPPORTED_LOCALES) {
    let filled = 0;
    let total = 0;

    for (const key of Object.keys(seedData)) {
      const item = seedData[key];
      if (item.label[locale]) {
        filled++;
      }
      total++;
    }

    results.push({
      locale,
      filled,
      total,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    });
  }

  return results;
}

async function main() {
  console.log('═'.repeat(50));
  console.log('Seed Translation Coverage Report');
  console.log('═'.repeat(50));
  console.log(`Seed Version: ${SEED_VERSION}`);
  console.log('');

  // Calculate expected coverage from seed data
  console.log('📊 Expected Coverage (from seed data):');
  console.log('-'.repeat(30));

  const matterTypeCoverage = calculateCoverage(SEED_MATTER_TYPES);
  const folderCoverage = calculateCoverage(SEED_FOLDERS);
  const tagCoverage = calculateCoverage(SEED_TAGS);

  for (const locale of SUPPORTED_LOCALES) {
    const mt = matterTypeCoverage.find(r => r.locale === locale);
    const fo = folderCoverage.find(r => r.locale === locale);
    const ta = tagCoverage.find(r => r.locale === locale);

    console.log(`${locale.toUpperCase().padEnd(4)} | MatterTypes: ${mt?.filled}/${mt?.total} (${mt?.percentage}%) | Folders: ${fo?.filled}/${fo?.total} (${fo?.percentage}%) | Tags: ${ta?.filled}/${ta?.total} (${ta?.percentage}%)`);
  }

  console.log('');

  // Check database coverage
  console.log('📊 Database Coverage (actual records):');
  console.log('-'.repeat(30));

  try {
    const matterTypes = await prisma.matterType.findMany();
    const folders = await prisma.folder.findMany();
    const tags = await prisma.tag.findMany();

    for (const locale of SUPPORTED_LOCALES) {
      const localeKey = locale as keyof typeof matterTypes[0];

      const mtFilled = matterTypes.filter(m => m[`label_${locale}` as keyof typeof m]).length;
      const foFilled = folders.filter(f => f[`name_${locale}` as keyof typeof f]).length;
      const taFilled = tags.filter(t => t[`label_${locale}` as keyof typeof t]).length;

      console.log(`${locale.toUpperCase().padEnd(4)} | MatterTypes: ${mtFilled}/${matterTypes.length} | Folders: ${foFilled}/${folders.length} | Tags: ${taFilled}/${tags.length}`);
    }
  } catch (error) {
    console.log('⚠️  Database not available (run seed first)');
  }

  console.log('');
  console.log('═'.repeat(50));

  // Warnings
  const enCoverage = matterTypeCoverage.find(r => r.locale === 'en');
  if (enCoverage && enCoverage.percentage < 100) {
    console.log('⚠️  WARNING: English translations incomplete!');
    console.log('   Some content will fall back to Vietnamese.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
