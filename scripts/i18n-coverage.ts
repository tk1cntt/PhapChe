/**
 * i18n Coverage Report
 *
 * Checks translation coverage for all i18n keys.
 * Identifies missing translations across locales.
 *
 * Usage: node scripts/i18n-coverage.ts
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = 'src/messages';

interface CoverageResult {
  locale: string;
  keys: Set<string>;
  missing: string[];
  extra: string[];
}

function loadMessages(locale: string): CoverageResult {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    const keys = new Set<string>();
    function extractKeys(obj: unknown, prefix = '') {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extractKeys(value, fullKey);
        } else {
          keys.add(fullKey);
        }
      }
    }

    extractKeys(data);
    return { locale, keys, missing: [], extra: [] };
  } catch (error) {
    throw new Error(`Failed to load messages for locale ${locale}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function main() {
  console.log('═'.repeat(50));
  console.log('i18n Coverage Report');
  console.log('═'.repeat(50));
  console.log('');

  const locales = ['vi', 'en', 'zh', 'ja'];
  const files: CoverageResult[] = [];

  // Load all locales
  for (const locale of locales) {
    try {
      const file = loadMessages(locale);
      files.push(file);
      console.log(`✓ ${locale}: ${file.keys.size} keys`);
    } catch (error) {
      console.log(`✗ ${locale}: FILE NOT FOUND`);
    }
  }

  console.log('');

  // Find missing keys (compared to primary locale 'vi')
  const primary = files.find(f => f.locale === 'vi');
  if (primary) {
    for (const file of files) {
      if (file.locale === 'vi') continue;

      const missing: string[] = [];
      for (const key of primary.keys) {
        if (!file.keys.has(key)) {
          missing.push(key);
        }
      }
      file.missing = missing;
    }
  }

  // Report coverage
  console.log('─'.repeat(50));
  console.log('Coverage (compared to Vietnamese):');
  console.log('─'.repeat(50));

  for (const file of files) {
    if (file.locale === 'vi') continue;

    const coverage = primary
      ? Math.round(((primary.keys.size - file.missing.length) / primary.keys.size) * 100)
      : 0;

    const status = coverage === 100 ? '✓' : '⚠️';

    const primaryKeys = primary?.keys.size ?? 0;
    console.log(`${status} ${file.locale.padEnd(4)} | ${primaryKeys - file.missing.length}/${primaryKeys} keys (${coverage}%)`);

    if (file.missing.length > 0 && file.missing.length <= 10) {
      console.log(`   Missing: ${file.missing.join(', ')}`);
    } else if (file.missing.length > 10) {
      console.log(`   Missing: ${file.missing.length} keys`);
    }
  }

  // Check for extra keys in other locales
  console.log('');
  console.log('─'.repeat(50));
  console.log('Extra keys (in locale but not in Vietnamese):');
  console.log('─'.repeat(50));

  for (const file of files) {
    if (file.locale === 'vi') continue;

    const extra: string[] = [];
    if (primary) {
      for (const key of file.keys) {
        if (!primary.keys.has(key)) {
          extra.push(key);
        }
      }
    }
    file.extra = extra;

    if (extra.length > 0) {
      console.log(`⚠️ ${file.locale}: ${extra.length} extra keys`);
      if (extra.length <= 10) {
        console.log(`   Extra: ${extra.join(', ')}`);
      }
    } else {
      console.log(`✓ ${file.locale}: No extra keys`);
    }
  }

  console.log('');
  console.log('═'.repeat(50));
  console.log('Summary:');
  console.log('═'.repeat(50));

  const allGood = files.every(f => f.locale === 'vi' || (f.missing.length === 0 && f.extra.length === 0));
  if (allGood) {
    console.log('✓ All locales have complete translation coverage!');
  } else {
    console.log('⚠️ Some translation issues detected. Review output above.');
  }
}

main();
