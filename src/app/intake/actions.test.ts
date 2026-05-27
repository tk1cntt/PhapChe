import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync('src/app/intake/actions.ts', 'utf8');

assert.match(source, /export async function attachIntakeFileAction/);
assert.match(source, /attachIntakeFile\(/);
assert.doesNotMatch(source, /workspaceId\s*=\s*formData\.get\(['"]workspaceId['"]\)/);
assert.doesNotMatch(source, /publicUrl|url:/);
assert.match(source, /redirect\(`\/requests\/\$\{submitted\.id\}`\)/);
