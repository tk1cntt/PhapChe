const fs = require('fs');
const path = require('path');
const baseDir = '.opencodereview/reviews/PhapChe/a8c935bf-65ff-477e-acb4-e26fbe0d25b8/src';

const alreadyFixed = new Set([
  'src/app/api/admin/partner/requests/[id]/status/route.ts',
  'src/app/api/admin/partners/[id]/route.ts',
  'src/app/api/admin/requests/[id]/assign/route.ts',
  'src/app/api/admin/requests/[id]/files/[fileId]/ai-review/route.ts',
  'src/app/api/admin/requests/[id]/files/[fileId]/preview/route.ts',
  'src/app/api/admin/requests/[id]/files/annotations/route.ts',
  'src/app/api/admin/requests/[id]/route.ts',
  'src/app/api/admin/requests/[id]/timeline/route.ts',
  'src/app/api/partner/members/[id]/route.ts',
  'src/app/api/partner/requests/[id]/documents/route.ts',
  'src/app/api/admin/workspaces/[id]/route.ts',
  'src/middleware/partner-context-middleware.ts',
  'src/middleware/organization-context-middleware.ts',
  'src/middleware/auth-middleware.ts',
  'src/lib/services/review-service.ts',
]);

function walk(dirPath, depth) {
  if (depth > 10) return [];
  const entries = fs.readdirSync(dirPath, {withFileTypes: true});
  let result = [];
  for (const e of entries) {
    const full = path.join(dirPath, e.name);
    if (e.isDirectory()) result = result.concat(walk(full, depth + 1));
    else if (e.name.endsWith('.md')) result.push(full);
  }
  return result;
}

const allMdFiles = walk(baseDir, 0);
const severityRegex = /## (🔴|🟠) (Critical|High)/;

const remaining = {};
let skipped = 0;
let noSeverity = 0;

for (const mdFile of allMdFiles) {
  const content = fs.readFileSync(mdFile, 'utf-8');
  const relPath = path.relative(baseDir, mdFile);
  const sourceFile = 'src/' + relPath.slice(0, -3).replace(/\\/g, '/');

  if (alreadyFixed.has(sourceFile)) { skipped++; continue; }

  const hasSeverity = severityRegex.test(content);
  if (!hasSeverity) { noSeverity++; continue; }

  const critMatch = content.match(/## 🔴 Critical \((\d+)\)/);
  const highMatch = content.match(/## 🟠 High \((\d+)\)/);

  remaining[sourceFile] = {
    critical: critMatch ? parseInt(critMatch[1]) : 0,
    high: highMatch ? parseInt(highMatch[1]) : 0,
  };
}

const sorted = Object.entries(remaining).sort((a, b) => {
  const aTotal = a[1].critical * 3 + a[1].high;
  const bTotal = b[1].critical * 3 + b[1].high;
  return bTotal - aTotal;
});

let totalCrit = 0, totalHigh = 0;
for (const [file, counts] of sorted) {
  const critStr = counts.critical > 0 ? '\u{1F534}' + counts.critical + ' ' : '   ';
  const highStr = counts.high > 0 ? '\u{1F7E0}' + String(counts.high).padStart(3) : '    ';
  console.log(critStr + highStr + ' ' + file);
  totalCrit += counts.critical;
  totalHigh += counts.high;
}
console.log('');
console.log('TOTAL: ' + totalCrit + ' Critical, ' + totalHigh + ' High in ' + sorted.length + ' files');
console.log('(skipped ' + skipped + ' already fixed, ' + noSeverity + ' no Critical/High)');
