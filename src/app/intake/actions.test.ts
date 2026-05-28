import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const actionSource = readFileSync('src/app/intake/actions.ts', 'utf8');
const sessionSource = readFileSync('src/lib/security/session.ts', 'utf8');

assert.match(actionSource, /export async function attachIntakeFileAction/);
assert.match(actionSource, /attachIntakeFile\(/);
assert.doesNotMatch(actionSource, /workspaceId\s*=\s*formData\.get\(['"]workspaceId['"]\)/);
assert.doesNotMatch(actionSource, /publicUrl|url:/);
assert.match(actionSource, /redirect\(`\/requests\/\$\{submitted\.id\}`\)/);

assert.doesNotMatch(sessionSource, /id:\s*['"]demo-customer['"]/);
assert.doesNotMatch(sessionSource, /['"]demo-customer['"]/);
assert.match(sessionSource, /process\.env\.APP_SESSION_USER_ID\?\.trim\(\)/);
assert.match(sessionSource, /throw new Error\(['"]UNAUTHENTICATED['"]\)/);
assert.match(sessionSource, /memberships:\s*\{/);
assert.match(sessionSource, /workspace:\s*\{ isActive: true \}/);
