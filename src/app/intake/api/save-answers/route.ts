import { NextResponse } from 'next/server';
import { saveIntakeAnswers } from '@/lib/intake/intake-service';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { requestId, answers } = body;

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers is required' }, { status: 400 });
    }

    await saveIntakeAnswers({
      session,
      requestId,
      answers,
      correlationId: `save-answers-${Date.now()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save answers failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to save answers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
