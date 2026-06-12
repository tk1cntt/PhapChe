import { NextResponse } from 'next/server';
import { submitIntake } from '@/lib/intake/intake-service';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { requestId } = body;

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const result = await submitIntake({
      session,
      requestId,
      correlationId: `submit-${Date.now()}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Submit intake failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit intake';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
