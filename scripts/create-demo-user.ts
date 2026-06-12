import { auth } from '../src/auth';
import { headers } from 'next/headers';

async function main() {
  const h = await headers();
  const cookieHeader = h.get('cookie');
  console.log('Cookie header:', cookieHeader?.substring(0, 100));

  // Test getSession
  try {
    const session = await auth.api.getSession({ headers: h });
    console.log('Session:', JSON.stringify(session, null, 2));
  } catch (e: any) {
    console.error('getSession error:', e.message);
  }
}

main();
