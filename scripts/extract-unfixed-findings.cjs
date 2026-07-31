/**
 * Extract unfixed High/Critical findings from code review directory
 */
const fs = require('fs');
const path = require('path');
const dir = '.opencodereview/reviews/PhapChe/a8c935bf-65ff-477e-acb4-e26fbe0d25b8';

// Files already fixed in the committed batch
const fixed = new Set([
  'src/app/api/admin/partner/requests/route.ts',
  'src/app/api/admin/requests/my-work/route.ts',
  'src/app/api/admin/requests/route.ts',
  'src/app/api/admin/requests/triage/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/workspaces/route.ts',
  'src/app/api/ai/analyze/route.ts',
  'src/app/api/ai/init/route.ts',
  'src/app/api/ai/status/route.ts',
  'src/app/api/auth/session-role/route.ts',
  'src/app/api/debug-session/route.ts',
  'src/app/api/files/route.ts',
  'src/app/api/intake/submit/route.ts',
  'src/app/api/partner/members/route.ts',
  'src/app/globals.css',
]);

function walk(d) {
  const results = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) { results.push(...walk(full)); }
    else if (e.isFile() && full.endsWith('.md')) { results.push(full); }
  }
  return results;
}

const files = walk(dir);
const results = [];
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const sm = content.match(/# Review: `([^`]+)`/);
  if (!sm) continue;
  const srcFile = sm[1];
  if (fixed.has(srcFile)) continue;

  // Parse severity sections and their finding counts
  // Format: ## 🟠 High (1)  or  ## 🔴 Critical (2)
  const sevSections = [...content.matchAll(/^## (🟠|🔴|🟡|🔵) (High|Critical|Medium|Low)\s*\((\d+)\)/gm)];

  for (const sec of sevSections) {
    const severity = sec[2];
    const count = parseInt(sec[3], 10);

    if (severity === 'High' || severity === 'Critical') {
      // Get the section content - from this heading to next heading or end
      const startIdx = sec.index;
      const nextHeading = content.slice(startIdx + sec[0].length).match(/^## /m);
      const endIdx = nextHeading ? startIdx + sec[0].length + nextHeading.index : content.length;
      const sectionText = content.slice(startIdx, endIdx);

      // Extract finding titles: **emoji Type** · line N
      const findings = [...sectionText.matchAll(/^\*\*([^\n]+)\*\*/gm)];
      for (const f of findings) {
        results.push({ severity, srcFile, title: f[1], reviewFile: f });
      }
      if (findings.length === 0) {
        results.push({ severity, srcFile, title: '(' + count + ' finding' + (count > 1 ? 's' : '') + ')', reviewFile: f });
      }
    }
  }
}

// Summary
const byFile = {};
const count = {};
for (const r of results) {
  count[r.severity] = (count[r.severity] || 0) + 1;
  if (!byFile[r.srcFile]) byFile[r.srcFile] = [];
  byFile[r.srcFile].push(r);
}

console.log('=== Severity Count ===');
console.log(JSON.stringify(count));
console.log('');
console.log('=== UNFIXED - ' + Object.keys(byFile).length + ' files ===');
console.log('');

// API routes first, then pages, then others
const routes = [];
const pages = [];
const others = [];
for (const [src, items] of Object.entries(byFile)) {
  if (src.includes('/api/')) routes.push([src, items]);
  else if (src.includes('/page.tsx')) pages.push([src, items]);
  else others.push([src, items]);
}

const sorted = [
  ...routes.sort((a, b) => b[1].length - a[1].length),
  ...pages.sort((a, b) => b[1].length - a[1].length),
  ...others.sort((a, b) => b[1].length - a[1].length),
];

for (const [src, items] of sorted) {
  const sevs = [...new Set(items.map(i => i.severity))];
  console.log('[' + sevs.join('/') + '] ' + src + ' (' + items.length + ' findings)');
  for (const item of items) {
    console.log('  - [' + item.severity + '] ' + item.title);
  }
}
