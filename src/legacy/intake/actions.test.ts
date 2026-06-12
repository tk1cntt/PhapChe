import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const actionSource = readFileSync('src/app/intake/actions.ts', 'utf8');
const sessionSource = readFileSync('src/lib/security/session.ts', 'utf8');

assert.match(actionSource, /export async function attachIntakeFileAction/);
assert.match(actionSource, /attachIntakeFile\(/);
assert.doesNotMatch(actionSource, /workspaceId\s*=\s*formData\.get\(['"]workspaceId['"]\)/);
assert.doesNotMatch(actionSource, /publicUrl|url:/);
assert.match(actionSource, /redirect\(`\/intake\?requestId=\$\{draft\.id\}`\)/);
assert.match(actionSource, /redirect\(`\/requests\/\$\{submitted\.id\}`\)/);

const pageSource = readFileSync('src/app/intake/page.tsx', 'utf8');
assert.doesNotMatch(pageSource, /demo-request/);
assert.match(pageSource, /searchParams/);
assert.match(pageSource, /name="requestId" value=\{request\.id\}/);
assert.doesNotMatch(pageSource, /Sẽ được lưu từ câu trả lời của khách hàng/);
assert.doesNotMatch(pageSource, /ho-so-mau\.pdf/);
assert.match(pageSource, /answerLabels/);
assert.match(pageSource, /vaultFiles/);
assert.match(pageSource, /request\.intakeSubmission\.answers/);

assert.doesNotMatch(sessionSource, /id:\s*['"]demo-customer['"]/);
assert.doesNotMatch(sessionSource, /['"]demo-customer['"]/);
assert.match(sessionSource, /process\.env\.APP_SESSION_USER_ID\?\.trim\(\)/);
assert.match(sessionSource, /throw new Error\(['"]UNAUTHENTICATED['"]\)/);
assert.match(sessionSource, /memberships:\s*\{/);
assert.match(sessionSource, /workspace:\s*\{ isActive: true \}/);
