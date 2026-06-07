// Use Node.js built-in crypto for scrypt
const crypto = require('crypto');
require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');

// Same params as @better-auth/utils/dist/password.mjs
const N = 16384, r = 16, p = 1, dkLen = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const saltHex = salt.toString('hex');
  const key = crypto.scryptSync(password.normalize('NFKC'), salt, dkLen, { N, r, p, maxmem: 128 * N * r * 2 });
  return `${saltHex}:${key.toString('hex')}`;
}

function verifyPassword(hash, password) {
  const parts = hash.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const key = crypto.scryptSync(password.normalize('NFKC'), salt, dkLen, { N, r, p, maxmem: 128 * N * r * 2 });
    return crypto.timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
  } catch {
    return false;
  }
}

async function main() {
  const db = new PrismaClient();
  const password = 'Demo@123456';

  // Test
  const testHash = hashPassword(password);
  console.log('Scrypt hash format:', testHash.slice(0, 35) + '... (len=' + testHash.length + ')');
  console.log('Scrypt verify:', verifyPassword(testHash, password) ? 'OK' : 'FAIL');
  console.log();

  const accounts = await db.account.findMany({ where: { providerId: 'credential' } });
  console.log('Updating', accounts.length, 'accounts with scrypt hashes...');

  for (const acc of accounts) {
    const newHash = hashPassword(password);
    await db.account.update({ where: { id: acc.id }, data: { password: newHash } });
    console.log(`  ${acc.accountId}: len=${newHash.length}`);
  }

  // Verify
  console.log('\nVerification:');
  for (const acc of accounts) {
    const fresh = await db.account.findUnique({ where: { id: acc.id } });
    const ok = verifyPassword(fresh.password, password);
    console.log(`  ${acc.accountId}: ${ok ? 'PASS' : 'FAIL'}`);
  }

  await db.$disconnect();
  console.log('\nDone!');
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
